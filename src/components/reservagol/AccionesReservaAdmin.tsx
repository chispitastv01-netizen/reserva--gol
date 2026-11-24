'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { Modal } from '@/components/ui/Modal';
import { formatearFecha, formatearHora } from '@/lib/formato';
import type { EstadoReserva } from '@/lib/datos/tipos';

type Props = {
  id: string;
  clienteNombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: EstadoReserva;
};

export function AccionesReservaAdmin({
  id,
  clienteNombre,
  fecha,
  horaInicio,
  horaFin,
  estado,
}: Props) {
  const router = useRouter();
  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  async function cancelar() {
    setOcupado(true);
    setAviso(null);
    try {
      const respuesta = await fetch(`/api/reservas/${id}/cancelar`, { method: 'POST' });
      const resultado = await respuesta.json() as { error?: { mensaje?: string } };
      if (!respuesta.ok) {
        setAviso({ tipo: 'error', texto: resultado.error?.mensaje ?? 'No se pudo cancelar la reserva.' });
        return;
      }

      setConfirmacionAbierta(false);
      setAviso({ tipo: 'exito', texto: 'Reserva cancelada. La franja quedó libre.' });
      router.refresh();
    } catch {
      setAviso({ tipo: 'error', texto: 'No se pudo conectar con el servidor.' });
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="admin-reserva-acciones">
      <Link className="admin-accion-cobro" href={`/reservas/${id}`}>
        Gestionar cobro
      </Link>
      {estado === 'activa' && (
        <Boton
          variante="peligro"
          type="button"
          onClick={() => setConfirmacionAbierta(true)}
          aria-label={`Cancelar reserva de ${clienteNombre}`}
        >
          Cancelar
        </Boton>
      )}
      {aviso && <Aviso tono={aviso.tipo} role="status">{aviso.texto}</Aviso>}
      <Modal
        abierto={confirmacionAbierta}
        titulo="Confirmar cancelación"
        confirmar="Cancelar reserva"
        alCerrar={() => setConfirmacionAbierta(false)}
        alConfirmar={cancelar}
        ocupado={ocupado}
      >
        <p>
          Cancelar la reserva de {clienteNombre} el {formatearFecha(fecha)} de{' '}
          {formatearHora(horaInicio)} a {formatearHora(horaFin)}. La reserva se conservará en el historial y
          la franja quedará libre.
        </p>
      </Modal>
    </div>
  );
}
