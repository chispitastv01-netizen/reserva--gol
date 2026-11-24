import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PanelCobro } from './PanelCobro';
import type { ReservaConCobro } from '@/lib/datos/tipos';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const RESERVA: ReservaConCobro = {
  id: 'reserva-1',
  canchaId: '98b5f05a-7f6d-4c35-96a1-e338d770c09a',
  canchaNombre: 'Cancha Norte',
  clienteId: 'f53851d6-b065-4f4f-865c-2aa8604c0a3e',
  clienteNombre: 'Ana Prueba',
  fecha: '2026-11-25',
  horaInicio: '08:00',
  horaFin: '10:00',
  valorTotal: 120000,
  estado: 'activa',
  metodoAnticipo: 'transferencia',
  cobro: {
    total: 120000,
    abonado: 0,
    saldo: 120000,
    estadoPago: 'pendiente',
    abonos: [],
  },
};

describe('PanelCobro', () => {
  it('muestra la duración, total y anticipo acordado para el rango completo', () => {
    render(<PanelCobro reserva={RESERVA} />);

    expect(screen.getByText(/08:00\s*–\s*10:00/)).toBeInTheDocument();
    const resumen = within(screen.getByRole('region', { name: /cobro/i }));
    expect(resumen.getByText('2 horas')).toBeInTheDocument();
    expect(resumen.getByText('Anticipo inicial acordado (25%)')).toBeInTheDocument();
    expect(resumen.getByText('$30.000 COP')).toBeInTheDocument();
    expect(resumen.getAllByText('$120.000 COP')).toHaveLength(2);
  });
});
