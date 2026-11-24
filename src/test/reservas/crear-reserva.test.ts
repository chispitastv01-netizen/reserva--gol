import type { PoolClient } from 'pg';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { crearReserva, crearReservaPublica } from '@/lib/datos/reservas';

const { conTransaccion, consultar, query, exigirCanchaActiva, exigirClienteActivo } = vi.hoisted(() => ({
  conTransaccion: vi.fn(),
  consultar: vi.fn(),
  query: vi.fn(),
  exigirCanchaActiva: vi.fn(),
  exigirClienteActivo: vi.fn(),
}));

vi.mock('@/lib/db/conexion', () => ({ conTransaccion, consultar }));
vi.mock('@/lib/datos/canchas', () => ({ exigirCanchaActiva }));
vi.mock('@/lib/datos/clientes', () => ({ exigirClienteActivo }));

const CANCHA_ID = '98b5f05a-7f6d-4c35-96a1-e338d770c09a';
const CLIENTE_ID = 'f53851d6-b065-4f4f-865c-2aa8604c0a3e';
const RESERVA_ID = '7d1ef4ac-1a2a-41f0-9dbb-8340c78a27d7';

describe('crearReserva con cliente nuevo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-19T17:00:00.000Z'));
    query.mockReset().mockImplementation(async (sql: string) => {
      if (sql.includes('FROM canchas')) return { rows: [{ canchaNombre: 'Cancha Norte', precioHora: 50000 }] };
      if (sql.includes('INSERT INTO clientes')) return { rows: [{ id: CLIENTE_ID }] };
      if (sql.includes('SELECT hora_inicio AS')) return { rows: [] };
      if (sql.includes('INSERT INTO reservas')) return { rows: [{ id: RESERVA_ID }] };
      if (sql.includes('WHERE id = $1')) {
        return {
          rows: [{
            id: RESERVA_ID,
            canchaId: CANCHA_ID,
            canchaNombre: 'Cancha Norte',
            clienteId: CLIENTE_ID,
            clienteNombre: 'Ana Prueba',
            fecha: '2026-11-20',
            horaInicio: '18:00',
            horaFin: '19:00',
            valorTotal: 50000,
            metodoAnticipo: 'transferencia',
            estado: 'activa',
            abonado: 0,
          }],
        };
      }
      throw new Error('Consulta SQL inesperada en prueba.');
    });
    const tx = { query } as unknown as PoolClient;
    conTransaccion.mockReset().mockImplementation(async (operacion: (tx: PoolClient) => Promise<unknown>) => operacion(tx));
    consultar.mockReset();
    exigirCanchaActiva.mockReset().mockResolvedValue(undefined);
    exigirClienteActivo.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('inserta cliente y reserva en una transacción con método y consentimiento', async () => {
    const reserva = await crearReserva({
      canchaId: CANCHA_ID,
      clienteNuevo: { nombre: 'Ana Prueba', contacto: '3001234567', email: 'ana@example.com' },
      fecha: '2026-11-20',
      horaInicio: '18:00',
      horaFin: '19:00',
      valorTotal: 50000,
      metodoAnticipo: 'transferencia',
      politicasAceptadas: true,
    });

    expect(conTransaccion).toHaveBeenCalledOnce();
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO clientes'),
      ['Ana Prueba', '3001234567', 'ana@example.com'],
    );
    expect(query.mock.calls.find(([sql]) => sql.includes('INSERT INTO reservas'))?.[1]).toEqual([
      CANCHA_ID,
      CLIENTE_ID,
      '2026-11-20',
      '18:00',
      '19:00',
      50000,
      'transferencia',
      true,
    ]);
    expect(reserva).toMatchObject({
      id: RESERVA_ID,
      clienteId: CLIENTE_ID,
      metodoAnticipo: 'transferencia',
      estadoPago: 'pendiente',
      abonado: 0,
    });
  });

  it('guarda en una transacción el cliente y la franja pública exacta con tarifa de la base', async () => {
    const reserva = await crearReservaPublica({
      canchaId: CANCHA_ID,
      clienteNuevo: { nombre: 'Ana Prueba', contacto: '3001234567', email: 'ana@example.com' },
      fecha: '2026-11-20',
      horaInicio: '18:00',
      horaFin: '20:00',
      metodoAnticipo: 'transferencia',
      politicasAceptadas: true,
      comprobanteWhatsappAceptado: true,
    });

    expect(reserva).toEqual({ id: RESERVA_ID, valorTotal: 100000, canchaNombre: 'Cancha Norte' });
    expect(conTransaccion).toHaveBeenCalledOnce();
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO clientes'),
      ['Ana Prueba', '3001234567', 'ana@example.com'],
    );
    expect(query.mock.calls.find(([sql]) => sql.includes('INSERT INTO reservas'))?.[1]).toEqual([
      CANCHA_ID,
      CLIENTE_ID,
      '2026-11-20',
      '18:00',
      '20:00',
      100000,
      'transferencia',
    ]);
    expect(query.mock.calls.find(([sql]) => sql.includes('INSERT INTO reservas'))?.[0]).toContain("'activa'");
  });

  it('calcula el precio público usando tarifa por hora desde la base', async () => {
    const reserva = await crearReservaPublica({
      canchaId: CANCHA_ID,
      clienteNuevo: { nombre: 'Ana Prueba', contacto: '3001234567', email: 'ana@example.com' },
      fecha: '2026-11-20',
      horaInicio: '18:00',
      horaFin: '20:00',
      metodoAnticipo: 'transferencia',
      politicasAceptadas: true,
      comprobanteWhatsappAceptado: true,
    });

    expect(reserva).toEqual({ id: RESERVA_ID, valorTotal: 100000, canchaNombre: 'Cancha Norte' });
    expect(query).toHaveBeenCalledWith(expect.stringContaining('FROM canchas'), [CANCHA_ID]);
    expect(query.mock.calls.find(([sql]) => sql.includes('INSERT INTO reservas'))?.[1]).toEqual([
      CANCHA_ID,
      CLIENTE_ID,
      '2026-11-20',
      '18:00',
      '20:00',
      100000,
      'transferencia',
    ]);
  });

  it('usa tarifa base de 60000 cuando la columna aún retorna null', async () => {
    query.mockImplementationOnce(async (sql: string) => {
      if (sql.includes('FROM canchas')) return { rows: [{ canchaNombre: 'Cancha Norte', precioHora: null }] };
      return { rows: [] };
    });

    const reserva = await crearReservaPublica({
      canchaId: CANCHA_ID,
      clienteNuevo: { nombre: 'Ana Prueba', contacto: '3001234567', email: 'ana@example.com' },
      fecha: '2026-11-20',
      horaInicio: '18:00',
      horaFin: '19:00',
      metodoAnticipo: 'transferencia',
      politicasAceptadas: true,
      comprobanteWhatsappAceptado: true,
    });

    expect(reserva.valorTotal).toBe(60000);
    expect(reserva.canchaNombre).toBe('Cancha Norte');
    expect(query.mock.calls.find(([sql]) => sql.includes('INSERT INTO reservas'))?.[1]?.[5]).toBe(60000);
  });
});