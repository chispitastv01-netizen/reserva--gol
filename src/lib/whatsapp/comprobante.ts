import { formatearFecha, formatearHora, formatearPesos } from '@/lib/formato';
import { normalizarNumeroWhatsApp } from '@/lib/reglas/whatsapp';

const TIEMPO_LIMITE_MS = 2500;

export type DatosComprobanteReserva = {
  id: string;
  canchaNombre: string;
  valorTotal: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
};

export type ResultadoComprobanteWhatsApp =
  | { estado: 'enviado'; enlaceRespaldo: null }
  | { estado: 'respaldo'; enlaceRespaldo: string };

export function crearTextoComprobante(reserva: DatosComprobanteReserva): string {
  return [
    'ReservaGol · Reserva confirmada',
    `Cancha: ${reserva.canchaNombre}`,
    `Fecha: ${formatearFecha(reserva.fecha)}`,
    `Hora: ${formatearHora(reserva.horaInicio)}–${formatearHora(reserva.horaFin)}`,
    `Total: ${formatearPesos(reserva.valorTotal)}`,
    `Código de reserva: ${reserva.id}`,
    'Disponibilidad y reserva: confirmadas',
  ].join('\n');
}

export function crearEnlaceComprobanteWhatsApp(contacto: string, mensaje: string): string | null {
  const numero = normalizarNumeroWhatsApp(contacto);
  if (!numero) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

export async function enviarComprobanteWhatsApp(
  contacto: string,
  reserva: DatosComprobanteReserva,
): Promise<ResultadoComprobanteWhatsApp> {
  const mensaje = crearTextoComprobante(reserva);
  const enlaceRespaldo = crearEnlaceComprobanteWhatsApp(contacto, mensaje);
  if (!enlaceRespaldo) {
    throw new Error('El número de WhatsApp no se pudo normalizar.');
  }

  const endpoint = process.env.RESERVAGOL_WHATSAPP_API_URL;
  if (!endpoint) return { estado: 'respaldo', enlaceRespaldo };

  const numero = normalizarNumeroWhatsApp(contacto);
  if (!numero) throw new Error('El número de WhatsApp no se pudo normalizar.');

  try {
    const url = new URL(endpoint);
    if (url.protocol !== 'https:' || url.username || url.password) {
      throw new Error('El endpoint de WhatsApp debe ser HTTPS y no incluir credenciales en la URL.');
    }

    const token = process.env.RESERVAGOL_WHATSAPP_API_TOKEN;
    const respuesta = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        evento: 'reserva.confirmada',
        para: numero,
        mensaje,
        reserva: {
          ...reserva,
          fecha: formatearFecha(reserva.fecha),
          horaInicio: formatearHora(reserva.horaInicio),
          horaFin: formatearHora(reserva.horaFin),
          estado: 'confirmada',
        },
      }),
      redirect: 'error',
      signal: AbortSignal.timeout(TIEMPO_LIMITE_MS),
    });

    if (respuesta.ok) return { estado: 'enviado', enlaceRespaldo: null };
    console.warn('El proveedor de WhatsApp rechazó el comprobante; se ofrece el envío manual.', {
      estadoHttp: respuesta.status,
    });
  } catch (error) {
    console.warn('No se pudo entregar el comprobante por la API de WhatsApp; se ofrece el envío manual.', {
      tipo: error instanceof Error ? error.name : 'Error desconocido',
    });
  }

  return { estado: 'respaldo', enlaceRespaldo };
}
