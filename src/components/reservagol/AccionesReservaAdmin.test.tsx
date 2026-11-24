import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccionesReservaAdmin } from './AccionesReservaAdmin';

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

describe('AccionesReservaAdmin', () => {
  beforeEach(() => {
    refresh.mockClear();
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value(this: HTMLDialogElement) { this.setAttribute('open', ''); },
    });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      value(this: HTMLDialogElement) { this.removeAttribute('open'); },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('permite abrir cobro y cancelar sin ofrecer borrar una reserva', () => {
    render(
      <AccionesReservaAdmin
        id="reserva-1"
        clienteNombre="Ana Prueba"
        fecha="2026-11-20"
        horaInicio="08:00"
        horaFin="10:00"
        estado="activa"
      />,
    );

    expect(screen.getByRole('link', { name: 'Gestionar cobro' })).toHaveAttribute('href', '/reservas/reserva-1');
    expect(screen.getByRole('button', { name: 'Cancelar reserva de Ana Prueba' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /eliminar/i })).not.toBeInTheDocument();
  });

  it('no ofrece cancelar reservas que ya fueron canceladas', () => {
    render(
      <AccionesReservaAdmin
        id="reserva-1"
        clienteNombre="Ana Prueba"
        fecha="2026-11-20"
        horaInicio="08:00"
        horaFin="10:00"
        estado="cancelada"
      />,
    );

    expect(screen.queryByRole('button', { name: /cancelar reserva/i })).not.toBeInTheDocument();
  });

  it('confirma antes de cancelar y actualiza la lista del panel', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, datos: {} }),
    });
    vi.stubGlobal('fetch', fetchMock);
    render(
      <AccionesReservaAdmin
        id="reserva-1"
        clienteNombre="Ana Prueba"
        fecha="2026-11-20"
        horaInicio="08:00"
        horaFin="10:00"
        estado="activa"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar reserva de Ana Prueba' }));
    expect(screen.getByRole('dialog', { name: 'Confirmar cancelación' })).toBeInTheDocument();
    expect(screen.getByText(/se conservará en el historial/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Cancelar reserva$/ }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/reservas/reserva-1/cancelar', { method: 'POST' }));
    expect(await screen.findByText('Reserva cancelada. La franja quedó libre.')).toBeInTheDocument();
    expect(refresh).toHaveBeenCalledOnce();
  });
});
