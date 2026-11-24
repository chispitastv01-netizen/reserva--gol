import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AgendaCliente } from '@/components/reservagol/AgendaCliente';
import type { Cancha } from '@/lib/datos/tipos';

const { refresh, fetchMock } = vi.hoisted(() => ({ refresh: vi.fn(), fetchMock: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

const CANCHA: Cancha = {
  id: '98b5f05a-7f6d-4c35-96a1-e338d770c09a',
  nombre: 'Cancha Norte',
  precioHora: null,
  activa: true,
};
const FECHAS = ['2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15', '2026-11-16', '2026-11-17', '2026-11-18'];

describe('AgendaCliente', () => {
  let descriptorPortapapeles: PropertyDescriptor | undefined;

  beforeEach(() => {
    refresh.mockClear();
    fetchMock.mockReset().mockImplementation(async (url: string) => {
      const resultado = String(url).includes('?desde=')
        ? {
            ok: true,
            datos: {
              ocupadas: [{
                canchaId: CANCHA.id,
                fecha: '2026-11-12',
                horaInicio: '06:00',
                horaFin: '07:00',
              }],
            },
          }
        : {
            ok: true,
            datos: {
              id: 'reserva-1',
              canchaNombre: CANCHA.nombre,
              estado: 'activa',
              estadoPago: 'pendiente',
              valorTotal: 60000,
              anticipoRequerido: 15000,
            },
          };
      return {
        ok: true,
        json: async () => resultado,
        text: async () => JSON.stringify(resultado),
      };
    });
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    if (descriptorPortapapeles) {
      Object.defineProperty(navigator, 'clipboard', descriptorPortapapeles);
      descriptorPortapapeles = undefined;
    } else {
      Reflect.deleteProperty(navigator, 'clipboard');
    }
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('abre el panel lateral al pulsar una franja libre', () => {
    render(<AgendaCliente canchas={[CANCHA]} ocupadas={[]} fechas={FECHAS} hoy="2026-11-12" canchaInicial={CANCHA.id} />);

    expect(screen.queryByRole('heading', { name: 'Tu reserva' })).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /06:00 libre/i })[0]!);

    expect(screen.getByRole('heading', { name: 'Tu reserva' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre completo')).toBeInTheDocument();
    expect(screen.getByLabelText('Teléfono de contacto')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument();
  });

  it('no muestra franjas libres ni formulario si no hay canchas activas', () => {
    render(<AgendaCliente canchas={[]} ocupadas={[]} fechas={FECHAS} hoy="2026-11-12" canchaInicial="" />);

    expect(screen.getByRole('heading', { name: 'No hay canchas disponibles' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /06:00 libre/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Tu reserva' })).not.toBeInTheDocument();
  });

  it('muestra y registra la respuesta del servidor cuando rechaza una reserva', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const textoError = JSON.stringify({
      ok: false,
      error: { codigo: 'CHOQUE_HORARIO', mensaje: 'La franja ya está ocupada.' },
    });
    fetchMock.mockImplementationOnce(async () => ({
      ok: false,
      status: 409,
      text: async () => textoError,
    }));

    render(<AgendaCliente canchas={[CANCHA]} ocupadas={[]} fechas={FECHAS} hoy="2026-11-12" canchaInicial={CANCHA.id} />);
    fireEvent.click(screen.getAllByRole('button', { name: /06:00 libre/i })[0]!);
    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Ana Prueba' } });
    fireEvent.change(screen.getByLabelText('Teléfono de contacto'), { target: { value: '3001234567' } });
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'ana@example.com' } });
    fireEvent.click(screen.getByLabelText(/acepto el tratamiento/i));
    fireEvent.click(screen.getByRole('button', { name: 'Solicitar reserva' }));

    expect(await screen.findByText('La franja ya está ocupada.')).toBeInTheDocument();
    expect(errorSpy).toHaveBeenCalledWith(
      `El servidor rechazó la reserva. ${JSON.stringify({
        status: 409,
        codigo: 'CHOQUE_HORARIO',
        respuesta: textoError,
        respuestaTruncada: false,
      })}`,
    );
    errorSpy.mockRestore();
  });

  it('confirma en pantalla, marca la franja ocupada y no abre enlaces externos', async () => {
    const abrirWhatsApp = vi.spyOn(window, 'open').mockReturnValue(null);
    descriptorPortapapeles = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    const escribirPortapapeles = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: escribirPortapapeles },
    });
    render(<AgendaCliente canchas={[CANCHA]} ocupadas={[]} fechas={FECHAS} hoy="2026-11-12" canchaInicial={CANCHA.id} />);

    fireEvent.click(screen.getAllByRole('button', { name: /libre/i })[0]!);
    expect(screen.getByText(/60\.000\/h COP \(tarifa base\)/)).toBeInTheDocument();
    expect(screen.getByText(/15\.000 COP/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/valor total/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Ana Prueba' } });
    fireEvent.change(screen.getByLabelText('Teléfono de contacto'), { target: { value: '3001234567' } });
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'ana@example.com' } });
    fireEvent.click(screen.getByLabelText(/acepto el tratamiento/i));
    const boton = screen.getByRole('button', { name: 'Solicitar reserva' });
    expect(boton).toBeEnabled();
    fireEvent.click(boton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/reservas/publica', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        canchaId: CANCHA.id,
        clienteNuevo: { nombre: 'Ana Prueba', contacto: '3001234567', email: 'ana@example.com' },
        fecha: '2026-11-12',
        horaInicio: '06:00',
        horaFin: '07:00',
        metodoAnticipo: 'transferencia',
        politicasAceptadas: true,
      }),
    })));
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)).not.toHaveProperty('valorTotal');
    expect(await screen.findByText('reserva-1')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Reserva confirmada' })).toBeInTheDocument();
    const comprobante = within(screen.getByRole('status', { name: 'Comprobante de reserva confirmada' }));
    expect(comprobante.getAllByText('Cancha Norte')).toHaveLength(2);
    expect(comprobante.getAllByText('12 de noviembre de 2026')).toHaveLength(2);
    expect(comprobante.getAllByText('06:00–07:00')).toHaveLength(2);
    expect(comprobante.getAllByText('Activa')).toHaveLength(2);
    expect(document.querySelector('a[href^="https://wa.me"], a[href^="https://api.whatsapp.com/send"]')).toBeNull();
    expect(abrirWhatsApp).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Copiar código' }));
    expect(await screen.findByRole('button', { name: 'Código copiado' })).toBeInTheDocument();
    expect(escribirPortapapeles).toHaveBeenCalledWith('reserva-1');
    fireEvent.click(screen.getByText('Ver detalle completo'));
    expect(screen.getByText('Estado del pago')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /06:00 ocupada/i })).toBeDisabled();
    expect(screen.queryByRole('heading', { name: 'Tu reserva' })).not.toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/reservas/publica?desde='),
      expect.objectContaining({ cache: 'no-store' }),
    ));
  });

  it('conserva ocupada una reserva confirmada si termina tarde una lectura antigua', async () => {
    let resolverDisponibilidad: ((respuesta: {
      ok: true;
      json: () => Promise<{ ok: true; datos: { ocupadas: never[] } }>;
    }) => void) | undefined;
    const disponibilidadPendiente = new Promise<{
      ok: true;
      json: () => Promise<{ ok: true; datos: { ocupadas: never[] } }>;
    }>((resolve) => {
      resolverDisponibilidad = resolve;
    });
    fetchMock.mockImplementation((url: string, opciones?: RequestInit) => {
      if (opciones?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          text: async () => JSON.stringify({
            ok: true,
            datos: {
              id: 'reserva-1',
              canchaNombre: CANCHA.nombre,
              estado: 'activa',
              estadoPago: 'pendiente',
              valorTotal: 60000,
              anticipoRequerido: 15000,
            },
          }),
        });
      }
      return disponibilidadPendiente;
    });
    render(<AgendaCliente canchas={[CANCHA]} ocupadas={[]} fechas={FECHAS} hoy="2026-11-12" canchaInicial={CANCHA.id} />);
    fireEvent.click(screen.getAllByRole('button', { name: /06:00 libre/i })[0]!);
    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Ana Prueba' } });
    fireEvent.change(screen.getByLabelText('Teléfono de contacto'), { target: { value: '3001234567' } });
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'ana@example.com' } });
    fireEvent.click(screen.getByLabelText(/acepto el tratamiento/i));
    fireEvent.click(screen.getByRole('button', { name: 'Solicitar reserva' }));

    expect(await screen.findByText('reserva-1')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /06:00 ocupada/i })).toBeDisabled();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/reservas/publica?desde='),
      expect.objectContaining({ cache: 'no-store' }),
    ));

    await act(async () => {
      resolverDisponibilidad?.({
        ok: true,
        json: async () => ({ ok: true, datos: { ocupadas: [] } }),
      });
      await Promise.resolve();
    });

    expect(screen.getByRole('button', { name: /06:00 ocupada/i })).toBeDisabled();
  });

  it('actualiza las celdas libres cuando otra reserva aparece en el servidor', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        datos: {
          ocupadas: [{
            canchaId: CANCHA.id,
            fecha: '2026-11-12',
            horaInicio: '06:00',
            horaFin: '07:00',
          }],
        },
      }),
    });
    vi.useFakeTimers();
    render(<AgendaCliente canchas={[CANCHA]} ocupadas={[]} fechas={FECHAS} hoy="2026-11-12" canchaInicial={CANCHA.id} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/reservas/publica?desde=2026-11-12&hasta=2026-11-18',
      expect.objectContaining({ cache: 'no-store' }),
    );
    expect(screen.getByRole('button', { name: /06:00 ocupada/i })).toBeDisabled();
  });
});