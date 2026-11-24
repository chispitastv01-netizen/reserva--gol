import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FormularioReserva } from './FormularioReserva';
import type { Cancha, Cliente } from '@/lib/datos/tipos';

const { push, refresh } = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh }) }));

const CANCHAS: Cancha[] = [{
  id: '98b5f05a-7f6d-4c35-96a1-e338d770c09a',
  nombre: 'Cancha Norte',
  precioHora: 80000,
  activa: true,
}];
const CLIENTES: Cliente[] = [{
  id: 'f53851d6-b065-4f4f-865c-2aa8604c0a3e',
  nombre: 'Ana Prueba',
  contacto: '3001234567',
  activo: true,
}];

describe('FormularioReserva', () => {
  beforeEach(() => {
    push.mockClear();
    refresh.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('calcula duración, total y anticipo de referencia con el rango seleccionado', () => {
    render(
      <FormularioReserva
        canchas={CANCHAS}
        clientes={CLIENTES}
        canchaInicial={CANCHAS[0]!.id}
        fechaInicial="2026-11-25"
        hoy="2026-11-23"
      />,
    );

    fireEvent.change(screen.getByLabelText('Hora de inicio'), { target: { value: '08:00' } });
    fireEvent.change(screen.getByLabelText('Hora de fin'), { target: { value: '10:00' } });

    const resumen = within(screen.getByLabelText('Cálculo de la reserva'));
    expect(resumen.getByText('2 horas')).toBeInTheDocument();
    expect(resumen.getByText('$80.000 COP')).toBeInTheDocument();
    expect(resumen.getByText('$160.000 COP')).toBeInTheDocument();
    expect(resumen.getByText('$40.000 COP')).toBeInTheDocument();
  });

  it('envía al servidor el total calculado según la duración y la tarifa', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, datos: { id: 'reserva-1' } }),
    });
    vi.stubGlobal('fetch', fetchMock);
    render(
      <FormularioReserva
        canchas={CANCHAS}
        clientes={CLIENTES}
        canchaInicial={CANCHAS[0]!.id}
        fechaInicial="2026-11-25"
        hoy="2026-11-23"
      />,
    );

    fireEvent.change(screen.getByLabelText('Hora de inicio'), { target: { value: '08:00' } });
    fireEvent.change(screen.getByLabelText('Hora de fin'), { target: { value: '10:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear reserva' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/reservas', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('"valorTotal":160000'),
    })));
    expect(push).toHaveBeenCalledWith(expect.stringContaining('/reservas?canchaId='));
  });
});
