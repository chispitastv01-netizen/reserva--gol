import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminPage from './page';

const { resumenAdministrador } = vi.hoisted(() => ({ resumenAdministrador: vi.fn() }));

vi.mock('@/lib/dataService', () => ({ resumenAdministrador }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

describe('AdminPage', () => {
  it('presenta abonos registrados, reservas y rendimiento por cancha del período', async () => {
    resumenAdministrador.mockResolvedValue({
      desde: '2026-11-01',
      hasta: '2026-11-30',
      totalReservas: 3,
      reservasActivas: 2,
      reservasCanceladas: 1,
      abonosRegistrados: 70000,
      canchasOcupadas: 1,
      reservas: [],
      porCancha: [{
        canchaId: 'cancha-1',
        canchaNombre: 'Cancha Norte',
        reservasActivas: 2,
        reservasCanceladas: 1,
        abonosRegistrados: 70000,
      }],
    });

    render(await AdminPage({ searchParams: Promise.resolve({ desde: '2026-11-01', hasta: '2026-11-30' }) }));

    expect(screen.getByRole('heading', { name: 'Panel del propietario' })).toBeInTheDocument();
    expect(screen.getByText('Reservas registradas')).toBeInTheDocument();
    expect(screen.getByText('Canceladas')).toBeInTheDocument();
    expect(screen.getByText('Canchas ocupadas')).toBeInTheDocument();
    expect(screen.getByText('Cancha Norte')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Clientes' })).toHaveAttribute('href', '/reservas/clientes');
    expect(screen.getByRole('link', { name: 'Resumen' })).toHaveAttribute('href', '/reservas/resumen');
    expect(screen.getByRole('link', { name: 'Nueva reserva' })).toHaveAttribute('href', '/reservas/nueva');
  });

  it('muestra los datos de contacto y pagos de reservas persistidas', async () => {
    resumenAdministrador.mockResolvedValue({
      desde: '2026-11-01',
      hasta: '2026-11-30',
      totalReservas: 1,
      reservasActivas: 1,
      reservasCanceladas: 0,
      abonosRegistrados: 25000,
      canchasOcupadas: 1,
      reservas: [{
        id: 'reserva-1',
        clienteNombre: 'Ana Pérez',
        clienteContacto: '3001234567',
        clienteEmail: 'ana@example.com',
        canchaNombre: 'Cancha Norte',
        fecha: '2026-11-08',
        horaInicio: '09:00',
        horaFin: '10:00',
        valorTotal: 100000,
        anticipoRequerido: 25000,
        abonado: 25000,
        saldo: 75000,
        estado: 'activa',
        estadoPago: 'anticipo',
      }],
      porCancha: [],
    });

    render(await AdminPage({ searchParams: Promise.resolve({ desde: '2026-11-01', hasta: '2026-11-30' }) }));

    expect(screen.getByRole('heading', { name: 'Reservas recientes' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ana Pérez' })).toHaveAttribute('href', '/reservas/reserva-1');
    expect(screen.getByRole('link', { name: 'Gestionar cobro' })).toHaveAttribute('href', '/reservas/reserva-1');
    expect(screen.getByRole('button', { name: 'Cancelar reserva de Ana Pérez' })).toBeInTheDocument();
    expect(screen.getByText('3001234567')).toBeInTheDocument();
    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
    expect(screen.getByText('09:00–10:00')).toBeInTheDocument();
    expect(screen.getAllByText(/25\.000/)).toHaveLength(3);
  });

  it('muestra reservas recientes aunque pertenezcan a un mes distinto al filtro contable', async () => {
    resumenAdministrador.mockResolvedValue({
      desde: '2026-11-01',
      hasta: '2026-11-30',
      totalReservas: 0,
      reservasActivas: 0,
      reservasCanceladas: 0,
      abonosRegistrados: 0,
      canchasOcupadas: 0,
      reservas: [{
        id: 'reserva-diciembre',
        clienteNombre: 'Carlos Ruiz',
        clienteContacto: '3001234567',
        clienteEmail: null,
        canchaNombre: 'Cancha Norte',
        fecha: '2026-12-01',
        horaInicio: '09:00',
        horaFin: '10:00',
        valorTotal: 60000,
        anticipoRequerido: 15000,
        abonado: 0,
        saldo: 60000,
        estado: 'activa',
        estadoPago: 'pendiente',
      }],
      porCancha: [],
    });

    render(await AdminPage({ searchParams: Promise.resolve({ desde: '2026-11-01', hasta: '2026-11-30' }) }));

    expect(screen.getByRole('link', { name: 'Carlos Ruiz' })).toHaveAttribute('href', '/reservas/reserva-diciembre');
    expect(screen.getByText('1 de diciembre de 2026')).toBeInTheDocument();
  });
});