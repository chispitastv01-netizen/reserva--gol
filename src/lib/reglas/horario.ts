function minutosDesdeMedianoche(hora: string): number | null {
  const coincidencia = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hora);
  if (!coincidencia) return null;
  return Number(coincidencia[1]) * 60 + Number(coincidencia[2]);
}

export function haySolape(
  aInicio: string,
  aFin: string,
  bInicio: string,
  bFin: string,
): boolean {
  return aInicio < bFin && bInicio < aFin;
}

export function finPosteriorAInicio(inicio: string, fin: string): boolean {
  return fin > inicio;
}

export function duracionEnHoras(inicio: string, fin: string): number {
  const inicioMinutos = minutosDesdeMedianoche(inicio);
  const finMinutos = minutosDesdeMedianoche(fin);
  if (inicioMinutos === null || finMinutos === null || finMinutos <= inicioMinutos) return 0;
  return (finMinutos - inicioMinutos) / 60;
}

export function calcularTotalReserva(precioHora: number, inicio: string, fin: string): number {
  if (!Number.isSafeInteger(precioHora) || precioHora <= 0) return 0;
  const total = Math.round(precioHora * duracionEnHoras(inicio, fin));
  return Number.isSafeInteger(total) && total > 0 ? total : 0;
}