import { describe, expect, it } from 'vitest';
import { abonoValido, calcularAnticipoInicial, estadoPago, saldo } from '@/lib/reglas/pago';

describe('reglas de pago', () => {
  it('T-10: deja pendiente un pago sin abonos', () => {
    expect(estadoPago(50000, 0)).toBe('pendiente');
  });

  it('T-11: marca anticipo cuando el abono es parcial', () => {
    expect(estadoPago(50000, 20000)).toBe('anticipo');
  });

  it('T-12: marca pagado cuando se cubre el total', () => {
    expect(estadoPago(50000, 50000)).toBe('pagado');
  });

  it('T-13: mantiene pagado cuando el abonado supera el total', () => {
    expect(estadoPago(50000, 60000)).toBe('pagado');
  });

  it('T-14: calcula el saldo parcial', () => {
    expect(saldo(50000, 20000)).toBe(30000);
  });

  it('T-15: limita el saldo a cero cuando está cubierto', () => {
    expect(saldo(50000, 50000)).toBe(0);
  });

  it('T-16: permite un abono que completa el total', () => {
    expect(abonoValido(50000, 20000, 30000)).toBe(true);
  });

  it('T-17: rechaza un abono que supera el saldo', () => {
    expect(abonoValido(50000, 20000, 40000)).toBe(false);
  });

  it('T-18: rechaza un abono de cero', () => {
    expect(abonoValido(50000, 0, 0)).toBe(false);
  });

  it('calcula un anticipo inicial del 25% como pesos enteros', () => {
    expect(calcularAnticipoInicial(120000)).toBe(30000);
    expect(calcularAnticipoInicial(50001)).toBe(12501);
    expect(calcularAnticipoInicial(0)).toBe(0);
  });
});