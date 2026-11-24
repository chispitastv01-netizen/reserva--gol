'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { Selector } from '@/components/ui/Selector';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { DIRECCION_SEDE, HORA_APERTURA, HORA_CIERRE, PRECIO_HORA_BASE } from '@/lib/config/reservagol';
import { formatearDuracionHoras, formatearFecha, formatearHora, formatearPesos } from '@/lib/formato';
import { calcularAnticipoInicial } from '@/lib/reglas/pago';
import { calcularTotalReserva, duracionEnHoras, haySolape } from '@/lib/reglas/horario';
import type { BloqueOcupadoPublico, Cancha } from '@/lib/datos/tipos';

type Props = {
  canchas: Cancha[];
  ocupadas: BloqueOcupadoPublico[];
  fechas: string[];
  hoy: string;
  canchaInicial: string;
};

type Seleccion = { fecha: string; horaInicio: string; horaFin: string };
type MetodoAnticipo = 'transferencia' | 'efectivo';

const DIA = new Intl.DateTimeFormat('es-CO', { weekday: 'short', timeZone: 'UTC' });
const FECHA_CORTA = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
const FECHA_RANGO = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });

type ConfirmacionReserva = {
  total: number;
  anticipo: number;
  id: string;
  canchaNombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: 'activa';
  estadoPago: 'pendiente';
};

function etiquetaDia(fecha: string) {
  const date = new Date(`${fecha}T12:00:00Z`);
  const dia = DIA.format(date).replace(/\.$/, '');
  return `${dia.charAt(0).toLocaleUpperCase('es-CO')}${dia.slice(1)} ${FECHA_CORTA.format(date)}`;
}

function horasDelDia() {
  const inicio = Number(HORA_APERTURA.slice(0, 2));
  const fin = Number(HORA_CIERRE.slice(0, 2));
  return Array.from({ length: fin - inicio }, (_, indice) => `${String(inicio + indice).padStart(2, '0')}:00`);
}

function minutosDesdeMedianoche(hora: string) {
  return Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));
}

function horaConDuracion(horaInicio: string, duracion: number) {
  const minutos = minutosDesdeMedianoche(horaInicio) + duracion * 60;
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
}

function sumarDias(fecha: string, dias: number) {
  const resultado = new Date(`${fecha}T00:00:00Z`);
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado.toISOString().slice(0, 10);
}

function mismoBloque(a: BloqueOcupadoPublico, b: BloqueOcupadoPublico) {
  return a.canchaId === b.canchaId &&
    a.fecha === b.fecha &&
    a.horaInicio === b.horaInicio &&
    a.horaFin === b.horaFin;
}

export function AgendaCliente({ canchas, ocupadas, fechas, hoy, canchaInicial }: Props) {
  const router = useRouter();
  const [canchaId, setCanchaId] = useState(canchaInicial);
  const [bloquesOcupados, setBloquesOcupados] = useState(ocupadas);
  const [errorDisponibilidad, setErrorDisponibilidad] = useState(false);
  const [seleccion, setSeleccion] = useState<Seleccion | null>(null);
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [email, setEmail] = useState('');
  const [metodoAnticipo, setMetodoAnticipo] = useState<MetodoAnticipo>('transferencia');
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [confirmacion, setConfirmacion] = useState<ConfirmacionReserva | null>(null);
  const [codigoCopiado, setCodigoCopiado] = useState(false);
  const confirmacionesLocales = useRef<BloqueOcupadoPublico[]>([]);
  const cancha = canchas.find((item) => item.id === canchaId);
  const visibles = fechas.filter((fecha) => fecha >= hoy).slice(0, 7);
  const inicioRango = visibles[0] ?? hoy;
  const finRango = visibles[visibles.length - 1] ?? hoy;
  const rangoActual = useRef({ desde: inicioRango, hasta: finRango });
  const horas = horasDelDia();
  const duracionHoras = seleccion ? duracionEnHoras(seleccion.horaInicio, seleccion.horaFin) : 0;
  const tarifaPorHora = cancha?.precioHora ?? PRECIO_HORA_BASE;
  const total = seleccion && cancha
    ? calcularTotalReserva(tarifaPorHora, seleccion.horaInicio, seleccion.horaFin)
    : 0;
  const anticipo = calcularAnticipoInicial(total);
  const seleccionOcupada = Boolean(seleccion && bloquesOcupados.some((bloque) =>
    bloque.canchaId === canchaId &&
    bloque.fecha === seleccion.fecha &&
    haySolape(seleccion.horaInicio, seleccion.horaFin, bloque.horaInicio, bloque.horaFin)
  ));
  const duracionesDisponibles = seleccion
    ? Array.from(
        { length: Math.floor((minutosDesdeMedianoche(HORA_CIERRE) - minutosDesdeMedianoche(seleccion.horaInicio)) / 60) },
        (_, indice) => indice + 1,
      ).filter((duracion) => {
        const fin = horaConDuracion(seleccion.horaInicio, duracion);
        return !bloquesOcupados.some((bloque) =>
          bloque.canchaId === canchaId &&
          bloque.fecha === seleccion.fecha &&
          haySolape(seleccion.horaInicio, fin, bloque.horaInicio, bloque.horaFin)
        );
      })
    : [];
  const puedeAnterior = inicioRango > hoy;

  useEffect(() => {
    rangoActual.current = { desde: inicioRango, hasta: finRango };
  }, [finRango, inicioRango]);

  function seleccionarFranja(fecha: string, horaInicio: string, horaFin: string) {
    const ocupada = bloquesOcupados.some((bloque) =>
      bloque.canchaId === canchaId &&
      bloque.fecha === fecha &&
      bloque.horaInicio < horaFin &&
      horaInicio < bloque.horaFin
    );
    if (!cancha || fecha < hoy || ocupada) return;
    setSeleccion({ fecha, horaInicio, horaFin });
    setConfirmacion(null);
    setCodigoCopiado(false);
    setAviso(null);
  }

  function cambiarDuracion(duracion: number) {
    if (!seleccion || !duracionesDisponibles.includes(duracion)) return;
    setSeleccion({
      ...seleccion,
      horaFin: horaConDuracion(seleccion.horaInicio, duracion),
    });
    setAviso(null);
  }

  async function copiarCodigoReserva() {
    if (!confirmacion) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Portapapeles no disponible.');
      await navigator.clipboard.writeText(confirmacion.id);
      setCodigoCopiado(true);
      setAviso(null);
    } catch (error) {
      console.error('No se pudo copiar el código de reserva.', {
        tipo: error instanceof Error ? error.name : 'Error desconocido',
      });
      setAviso({ tipo: 'error', texto: 'No se pudo copiar el código. Puedes seleccionarlo y copiarlo manualmente.' });
    }
  }

  const actualizarDisponibilidad = useCallback(async (signal?: AbortSignal) => {
    const parametros = new URLSearchParams(rangoActual.current);
    try {
      const response = await fetch(`/api/reservas/publica?${parametros.toString()}`, {
        cache: 'no-store',
        ...(signal ? { signal } : {}),
      });
      const resultado = await response.json() as {
        ok?: boolean;
        datos?: { ocupadas?: BloqueOcupadoPublico[] };
      };
      if (!response.ok || !resultado.ok || !Array.isArray(resultado.datos?.ocupadas)) {
        throw new Error('Respuesta inválida al consultar disponibilidad.');
      }
      const ocupadasServidor = resultado.datos.ocupadas;
      const pendientesLocales = confirmacionesLocales.current.filter((local) =>
        !ocupadasServidor.some((delServidor) => mismoBloque(local, delServidor))
      );
      confirmacionesLocales.current = pendientesLocales;
      setBloquesOcupados([...ocupadasServidor, ...pendientesLocales]);
      setErrorDisponibilidad(false);
    } catch (error) {
      if (!signal?.aborted) {
        console.error('No se pudo consultar la disponibilidad pública.', error);
        setErrorDisponibilidad(true);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const intervalo = window.setInterval(() => {
      void actualizarDisponibilidad(controller.signal);
    }, 5000);
    return () => {
      window.clearInterval(intervalo);
      controller.abort();
    };
  }, [actualizarDisponibilidad]);

  async function confirmar() {
    if (seleccionOcupada) {
      setAviso({ tipo: 'error', texto: 'Ese rango acaba de ocuparse. Elige otro horario para continuar.' });
      return;
    }
    if (!cancha || !seleccion || !nombre.trim() || !contacto.trim() || !/^\S+@\S+\.\S+$/.test(email.trim()) || !aceptaPrivacidad || total <= 0) {
      setAviso({ tipo: 'error', texto: 'Completa tus datos, verifica la tarifa y acepta el tratamiento de datos.' });
      return;
    }
    setGuardando(true);
    setAviso(null);
    try {
      const response = await fetch('/api/reservas/publica', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canchaId,
          clienteNuevo: { nombre: nombre.trim(), contacto: contacto.trim(), email: email.trim() },
          fecha: seleccion.fecha,
          horaInicio: seleccion.horaInicio,
          horaFin: seleccion.horaFin,
          metodoAnticipo,
          politicasAceptadas: true,
        }),
      });
      const textoRespuesta = await response.text();
      let resultado: {
        datos?: {
          id?: unknown;
          canchaNombre?: unknown;
          valorTotal?: unknown;
          anticipoRequerido?: unknown;
          estado?: unknown;
          estadoPago?: unknown;
        };
        error?: { codigo?: string; mensaje?: string };
      };
      try {
        resultado = JSON.parse(textoRespuesta) as typeof resultado;
      } catch {
        console.error('El servidor devolvió una respuesta no válida.', {
          status: response.status,
          ...(process.env.NODE_ENV === 'production' ? {} : { textoError: textoRespuesta }),
        });
        if (!response.ok) {
          setAviso({ tipo: 'error', texto: 'El servidor no pudo completar la reserva. Revisa los registros para ver el detalle.' });
          router.refresh();
          return;
        }
        throw new Error('La respuesta del servidor no contiene JSON válido.');
      }
      if (!response.ok) {
        const diagnostico = {
          status: response.status,
          codigo: resultado.error?.codigo ?? null,
          ...(process.env.NODE_ENV === 'production'
            ? {}
            : {
                respuesta: textoRespuesta.slice(0, 2000),
                respuestaTruncada: textoRespuesta.length > 2000,
              }),
        };
        console.error(`El servidor rechazó la reserva. ${JSON.stringify(diagnostico)}`);
        setAviso({ tipo: 'error', texto: resultado.error?.mensaje ?? 'No se pudo completar la reserva.' });
        router.refresh();
        return;
      }
      const valorTotal = resultado.datos?.valorTotal;
      const anticipoRequerido = resultado.datos?.anticipoRequerido;
      const idReserva = resultado.datos?.id;
      const canchaNombre = resultado.datos?.canchaNombre;
      const estadoReserva = resultado.datos?.estado;
      const estadoPago = resultado.datos?.estadoPago;
      if (
        typeof valorTotal !== 'number' ||
        !Number.isSafeInteger(valorTotal) ||
        typeof anticipoRequerido !== 'number' ||
        !Number.isSafeInteger(anticipoRequerido) ||
        anticipoRequerido !== calcularAnticipoInicial(valorTotal) ||
        typeof idReserva !== 'string' ||
        typeof canchaNombre !== 'string' ||
        estadoReserva !== 'activa' ||
        estadoPago !== 'pendiente'
      ) {
        throw new Error('Respuesta inválida al confirmar la reserva.');
      }
      setConfirmacion({
        total: valorTotal,
        anticipo: anticipoRequerido,
        id: idReserva,
        canchaNombre,
        fecha: seleccion.fecha,
        horaInicio: seleccion.horaInicio,
        horaFin: seleccion.horaFin,
        estado: estadoReserva,
        estadoPago,
      });
      const bloqueConfirmado = {
        canchaId,
        fecha: seleccion.fecha,
        horaInicio: seleccion.horaInicio,
        horaFin: seleccion.horaFin,
      };
      confirmacionesLocales.current = [...confirmacionesLocales.current, bloqueConfirmado];
      setBloquesOcupados((actuales) =>
        actuales.some((actual) => mismoBloque(actual, bloqueConfirmado))
          ? actuales
          : [...actuales, bloqueConfirmado]
      );
      setSeleccion(null);
      setCodigoCopiado(false);
      void actualizarDisponibilidad();
      router.refresh();
    } catch (error) {
      console.error('No se pudo completar la solicitud de reserva.', error);
      setAviso({ tipo: 'error', texto: 'No fue posible conectar con el servidor.' });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="app-contenido public-booking">
      <header className="public-booking-hero">
        <p className="public-booking-kicker">RESERVAS DEPORTIVAS</p>
        <h1>Tu próxima cancha empieza aquí</h1>
        <div className="public-booking-ubicacion"><MapPin size={16} aria-hidden="true" />{DIRECCION_SEDE}</div>
      </header>

      <section className="public-booking-filtros" aria-label="Seleccionar cancha y fecha">
        <Selector etiqueta="Cancha" value={canchaId} onChange={(event) => { setCanchaId(event.target.value); setSeleccion(null); setConfirmacion(null); setCodigoCopiado(false); }}>
          {canchas.map((item) => <option value={item.id} key={item.id}>{item.nombre}</option>)}
        </Selector>
        <div className="agenda-semana-navegacion">
          {puedeAnterior ? <Link className="agenda-semana-boton" href={`/reservas?canchaId=${canchaId}&fecha=${sumarDias(inicioRango, -7)}`}>← 7 días</Link> : <span className="agenda-semana-boton agenda-semana-boton--desactivado">← 7 días</span>}
          <p>{FECHA_RANGO.format(new Date(`${inicioRango}T12:00:00Z`))} al {FECHA_RANGO.format(new Date(`${finRango}T12:00:00Z`))}</p>
          <Link className="agenda-semana-boton" href={`/reservas?canchaId=${canchaId}&fecha=${sumarDias(inicioRango, 7)}`}>7 días →</Link>
        </div>
      </section>

      {confirmacion && (
        <section className="public-booking-confirmada" role="status" aria-label="Comprobante de reserva confirmada">
          <div className="comprobante-cabecera">
            <div>
              <p>COMPROBANTE DE RESERVA</p>
              <h2>Reserva confirmada</h2>
            </div>
            <span className="comprobante-estado">Activa</span>
          </div>
          <dl className="comprobante-resumen">
            <div><dt>Cancha</dt><dd>{confirmacion.canchaNombre}</dd></div>
            <div><dt>Fecha</dt><dd>{formatearFecha(confirmacion.fecha)}</dd></div>
            <div><dt>Horario</dt><dd>{formatearHora(confirmacion.horaInicio)}–{formatearHora(confirmacion.horaFin)}</dd></div>
            <div><dt>Duración</dt><dd>{formatearDuracionHoras(duracionEnHoras(confirmacion.horaInicio, confirmacion.horaFin))}</dd></div>
          </dl>
          <dl className="comprobante-valores">
            <div><dt>Total</dt><dd>{formatearPesos(confirmacion.total)}</dd></div>
            <div><dt>Anticipo requerido (25%)</dt><dd>{formatearPesos(confirmacion.anticipo)}</dd></div>
          </dl>
          <div className="comprobante-codigo">
            <div><span>Código de reserva</span><code>{confirmacion.id}</code></div>
            <Boton variante="secundario" className="comprobante-copiar" type="button" onClick={copiarCodigoReserva}>
              {codigoCopiado ? 'Copiado' : 'Copiar código'}
            </Boton>
          </div>
          <details className="comprobante-detalles">
            <summary>Ver detalle completo</summary>
            <dl>
              <div><dt>Cancha</dt><dd>{confirmacion.canchaNombre}</dd></div>
              <div><dt>Fecha</dt><dd>{formatearFecha(confirmacion.fecha)}</dd></div>
              <div><dt>Horario</dt><dd>{formatearHora(confirmacion.horaInicio)}–{formatearHora(confirmacion.horaFin)}</dd></div>
              <div><dt>Duración</dt><dd>{formatearDuracionHoras(duracionEnHoras(confirmacion.horaInicio, confirmacion.horaFin))}</dd></div>
              <div><dt>Estado de la reserva</dt><dd>Activa</dd></div>
              <div><dt>Estado del pago</dt><dd>Pendiente</dd></div>
              <div><dt>Total</dt><dd>{formatearPesos(confirmacion.total)}</dd></div>
              <div><dt>Anticipo requerido (25%)</dt><dd>{formatearPesos(confirmacion.anticipo)}</dd></div>
            </dl>
          </details>
        </section>
      )}
      {errorDisponibilidad && (
        <Aviso tono="error" role="status">
          No se pudo actualizar la disponibilidad. Se intentará de nuevo automáticamente.
        </Aviso>
      )}

      {!cancha ? (
        <EstadoVacio
          titulo={canchas.length === 0 ? 'No hay canchas disponibles' : 'Selecciona una cancha'}
          detalle={canchas.length === 0
            ? 'El propietario debe registrar una cancha activa antes de habilitar reservas.'
            : 'Selecciona una cancha activa para consultar sus horarios disponibles.'}
        />
      ) : (
      <div className={seleccion ? 'agenda-board agenda-board--seleccionada' : 'agenda-board'}>
        <section className="agenda-matriz rounded-2xl border border-white/10 bg-[#131C2E]/90 p-4 shadow-sm" aria-labelledby="disponibilidad-publica">
          <div className="seccion-cabecera">
            <h2 id="disponibilidad-publica">Disponibilidad</h2>
            <div className="agenda-leyenda"><span className="agenda-badge agenda-badge--libre">Libre</span><span className="agenda-badge agenda-badge--ocupada">Ocupada</span></div>
          </div>
          <div className="agenda-matriz-scroll">
            <table className="agenda-matriz-tabla">
              <thead><tr><th className="agenda-columna-hora" scope="col">Hora</th>{visibles.map((fecha) => <th className="agenda-dia" scope="col" key={fecha}>{etiquetaDia(fecha)}{fecha === hoy && <span className="agenda-hoy">Hoy</span>}</th>)}</tr></thead>
              <tbody>{horas.map((horaInicio) => {
                const horaFin = horaConDuracion(horaInicio, 1);
                return <tr key={horaInicio}><th className="agenda-hora" scope="row">{formatearHora(horaInicio)}</th>{visibles.map((fecha) => {
                  const ocupada = bloquesOcupados.some((bloque) => bloque.canchaId === canchaId && bloque.fecha === fecha && bloque.horaInicio < horaFin && horaInicio < bloque.horaFin);
                  const seleccionada = seleccion?.fecha === fecha && horaInicio >= seleccion.horaInicio && horaInicio < seleccion.horaFin;
                  return <td key={fecha}><button className={`agenda-celda ${ocupada ? 'agenda-celda--ocupada' : 'agenda-celda--libre'}${seleccionada ? ' agenda-celda--seleccionada' : ''}`} type="button" disabled={ocupada || fecha < hoy || !cancha} aria-pressed={seleccionada} aria-label={`${etiquetaDia(fecha)} ${formatearHora(horaInicio)} ${ocupada ? 'ocupada' : seleccionada ? 'seleccionada' : 'libre'}`} onClick={() => seleccionarFranja(fecha, horaInicio, horaFin)}><span className={`agenda-badge ${ocupada ? 'agenda-badge--ocupada' : seleccionada ? 'agenda-badge--seleccionada' : 'agenda-badge--libre'}`}>{ocupada ? 'Ocupada' : seleccionada ? 'Seleccionada' : 'Libre'}</span></button></td>;
                })}</tr>;
              })}</tbody>
            </table>
          </div>
        </section>

        {seleccion && cancha && <aside className="agenda-reserva-panel rounded-2xl border border-white/10 bg-[#131C2E]/90 p-5 shadow-sm" aria-labelledby="tu-reserva-publica">
          <p className="seccion-kicker">Paso 2 · Confirma tus datos</p>
          <h2 id="tu-reserva-publica">Tu reserva</h2>
          <dl className="agenda-reserva-datos"><div><dt>Cancha</dt><dd>{cancha.nombre}</dd></div><div><dt>Fecha</dt><dd>{formatearFecha(seleccion.fecha)}</dd></div><div><dt>Horario</dt><dd>{formatearHora(seleccion.horaInicio)}–{formatearHora(seleccion.horaFin)}</dd></div></dl>
          <Selector etiqueta="Duración" value={String(duracionHoras)} onChange={(event) => cambiarDuracion(Number(event.target.value))} disabled={duracionesDisponibles.length === 0}>
            {duracionesDisponibles.length === 0
              ? <option value={String(duracionHoras)}>Horario ya ocupado</option>
              : duracionesDisponibles.map((duracion) => (
                  <option value={duracion} key={duracion}>
                    {formatearDuracionHoras(duracion)} · {formatearHora(seleccion.horaInicio)}–{formatearHora(horaConDuracion(seleccion.horaInicio, duracion))}
                  </option>
                ))}
          </Selector>
          <div className="agenda-datos-cliente">
            <Campo etiqueta="Nombre completo" autoComplete="name" value={nombre} onChange={(event) => setNombre(event.target.value)} required />
            <Campo etiqueta="Teléfono de contacto" type="tel" autoComplete="tel" value={contacto} onChange={(event) => setContacto(event.target.value)} required />
            <Campo etiqueta="Correo electrónico" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <Selector etiqueta="Método de anticipo" value={metodoAnticipo} onChange={(event) => setMetodoAnticipo(event.target.value as MetodoAnticipo)}><option value="transferencia">Transferencia</option><option value="efectivo">Pago en sede</option></Selector>
          <div className="agenda-total"><div><span>Duración</span><strong>{duracionHoras ? formatearDuracionHoras(duracionHoras) : 'No disponible'}</strong></div><div><span>Total · {formatearPesos(tarifaPorHora)}/h{cancha.precioHora == null ? ' (tarifa base)' : ''}</span><strong>{total ? formatearPesos(total) : 'No disponible'}</strong></div><div className="agenda-anticipo"><span>Anticipo requerido (25%)</span><strong>{anticipo ? formatearPesos(anticipo) : 'No disponible'}</strong></div></div>
          {seleccionOcupada && <Aviso tono="error" role="status">Ese rango acaba de ocuparse. Elige otro horario para continuar.</Aviso>}
          <label className="agenda-privacidad"><input type="checkbox" checked={aceptaPrivacidad} onChange={(event) => setAceptaPrivacidad(event.target.checked)} /><span>Acepto el tratamiento de mis datos personales para gestionar esta reserva.</span></label>
          <Boton type="button" className="agenda-confirmar" onClick={confirmar} disabled={guardando || seleccionOcupada || !duracionesDisponibles.includes(duracionHoras) || !total || !nombre.trim() || !contacto.trim() || !email.trim() || !aceptaPrivacidad}>{guardando ? 'Confirmando reserva...' : 'Solicitar reserva'}</Boton>
          {aviso && <Aviso tono={aviso.tipo} role="status">{aviso.texto}</Aviso>}
        </aside>}
      </div>
      )}
    </main>
  );
}