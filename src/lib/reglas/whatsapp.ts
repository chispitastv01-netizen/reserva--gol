export function normalizarNumeroWhatsApp(contacto: string): string | null {
  let numero = contacto.replace(/\D/g, '');
  if (numero.startsWith('00')) numero = numero.slice(2);
  if (numero.length === 10) {
    if (!numero.startsWith('3')) return null;
    numero = `57${numero}`;
  }
  if (!/^[1-9]\d{7,14}$/.test(numero)) return null;
  return numero;
}
