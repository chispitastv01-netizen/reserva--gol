import Link from 'next/link';
import { AccionesReservaAdmin } from '@/components/reservagol/AccionesReservaAdmin';
import { ActualizarDatosEnVivo } from '@/components/reservagol/ActualizarDatosEnVivo';
import { InsigniaEstadoPago } from '@/components/reservagol/InsigniaEstadoPago';
import { resumenAdministrador } from '@/lib/dataService';
import { formatearFecha, formatearHora, formatearPesos } from '@/lib/formato';
import { esFechaValida, hoyBogota } from '@/lib/reglas/fechas';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
};

function rangoDelMes(fecha: string) {
  const [anio, mes] = fecha.split('-');
  const ultimoDia = new Date(Date.UTC(Number(anio), Number(mes), 0)).getUTCDate();
  return { desde: `${anio}-${mes}-01`, hasta: `${anio}-${mes}-${String(ultimoDia).padStart(2, '0')}` };
}

export default async function AdminPage({ searchParams }: Props) {
  const parametros = await searchParams;
  const hoy = hoyBogota();
  const predeterminado = rangoDelMes(hoy);
  const rangoValido = Boolean(
    parametros.desde && parametros.hasta && esFechaValida(parametros.desde) &&
    esFechaValida(parametros.hasta) && parametros.desde <= parametros.hasta,
  );
  const desde = rangoValido ? parametros.desde! : predeterminado.desde;
  const hasta = rangoValido ? parametros.hasta! : predeterminado.hasta;
  const resumen = await resumenAdministrador(desde, hasta);

  return (
    <main className="app-contenido admin-dashboard">
      <ActualizarDatosEnVivo />
      <header className="admin-cabecera">
        <div>
          <p className="seccion-kicker">Administración</p>
          <h1>Panel del propietario</h1>
          <p>Contaduría y ocupación de canchas</p>
        </div>
        <form className="admin-filtro-periodo" action="/admin" method="get">
          <label>Desde <input type="date" name="desde" defaultValue={desde} required /></label>
          <label>Hasta <input type="date" name="hasta" defaultValue={hasta} required /></label>
          <button type="submit">Aplicar</button>
        </form>
      </header>

      <p className="admin-periodo">{formatearFecha(desde)} – {formatearFecha(hasta)}</p>

      <section className="admin-metricas" aria-label="Indicadores del período">
        <article className="admin-metrica"><span>Abonos registrados</span><strong>{formatearPesos(resumen.abonosRegistrados)}</strong><small>De reservas del período; incluye canceladas y no descuenta reembolsos.</small></article>
        <article className="admin-metrica"><span>Reservas registradas</span><strong>{resumen.totalReservas}</strong><small>{resumen.reservasActivas} activas · {resumen.reservasCanceladas} canceladas</small></article>
        <article className="admin-metrica"><span>Canchas ocupadas</span><strong>{resumen.canchasOcupadas}</strong><small>Con reservas activas en el período</small></article>
      </section>

      <nav className="admin-accesos" aria-label="Acciones rápidas">
        <Link href="/reservas/nueva">Nueva reserva</Link>
        <Link href="/reservas/clientes">Clientes</Link>
        <Link href="/reservas/resumen">Resumen</Link>
        <Link href="/reservas/canchas">Canchas</Link>
      </nav>

      <section className="admin-tabla-seccion" aria-labelledby="admin-canchas-titulo">
        <div className="seccion-cabecera">
          <div><p className="seccion-kicker">Rendimiento</p><h2 id="admin-canchas-titulo">Actividad por cancha</h2></div>
          <Link className="admin-enlace" href="/reservas/canchas">Gestionar canchas</Link>
        </div>
        <div className="tabla-contenedor">
          <table className="tabla-reservas">
            <thead><tr><th>Cancha</th><th>Reservas activas</th><th>Canceladas</th><th>Abonos registrados</th></tr></thead>
            <tbody>
              {resumen.porCancha.map((cancha) => (
                <tr key={cancha.canchaId}>
                  <td>{cancha.canchaNombre}</td>
                  <td>{cancha.reservasActivas}</td>
                  <td>{cancha.reservasCanceladas}</td>
                  <td>{formatearPesos(cancha.abonosRegistrados)}</td>
                </tr>
              ))}
              {resumen.porCancha.length === 0 && <tr><td colSpan={4}>No hay canchas activas.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="admin-nota">Los abonos reflejan pagos registrados para reservas con fecha en el período; no se descuentan devoluciones.</p>
      </section>

      <section className="admin-tabla-seccion" aria-labelledby="admin-reservas-titulo">
        <div className="seccion-cabecera">
          <div>
            <p className="seccion-kicker">Registro</p>
            <h2 id="admin-reservas-titulo">Reservas recientes</h2>
          </div>
          <Link className="admin-enlace" href="/reservas/clientes">Ver clientes</Link>
        </div>
        <p className="admin-nota">El período filtra los indicadores. Esta tabla muestra el historial reciente completo, incluidas reservas canceladas.</p>
        <div className="tabla-contenedor">
          <table className="tabla-reservas">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th>Cancha</th>
                <th>Fecha</th>
                <th>Horario</th>
                <th>Total</th>
                <th>Anticipo requerido</th>
                <th>Abonado</th>
                <th>Pago</th>
                <th>Reserva</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {resumen.reservas.map((reserva) => (
                <tr key={reserva.id}>
                  <td><Link className="enlace-reserva" href={`/reservas/${reserva.id}`}>{reserva.clienteNombre}</Link></td>
                  <td>{reserva.clienteContacto}</td>
                  <td>{reserva.clienteEmail ?? 'Sin correo'}</td>
                  <td>{reserva.canchaNombre}</td>
                  <td>{formatearFecha(reserva.fecha)}</td>
                  <td>{formatearHora(reserva.horaInicio)}–{formatearHora(reserva.horaFin)}</td>
                  <td className="monto-tabular">{formatearPesos(reserva.valorTotal)}</td>
                  <td className="monto-tabular">{reserva.anticipoRequerido === null ? 'No aplica' : formatearPesos(reserva.anticipoRequerido)}</td>
                  <td className="monto-tabular">{formatearPesos(reserva.abonado)}</td>
                  <td><InsigniaEstadoPago estado={reserva.estadoPago} /></td>
                  <td>{reserva.estado === 'activa' ? 'Activa' : 'Cancelada'}</td>
                  <td>
                    <AccionesReservaAdmin
                      id={reserva.id}
                      clienteNombre={reserva.clienteNombre}
                      fecha={reserva.fecha}
                      horaInicio={reserva.horaInicio}
                      horaFin={reserva.horaFin}
                      estado={reserva.estado}
                    />
                  </td>
                </tr>
              ))}
              {resumen.reservas.length === 0 && (
                <tr><td colSpan={12}>No hay reservas registradas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

    </main>
  );
}