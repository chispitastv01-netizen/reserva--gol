import { describe, expect, it } from 'vitest';
import { esHoraValida } from '@/lib/reglas/fechas';
import { calcularTotalReserva, duracionEnHoras, finPosteriorAInicio, haySolape } from '@/lib/reglas/horario';

describe('reglas de horario', () => {
  it('T-01: detecta franjas idénticas', () => {
    expect(haySolape('18:00', '19:00', '18:00', '19:00')).toBe(true);
  });

  it('T-02: detecta solape parcial', () => {
    expect(haySolape('18:00', '19:00', '18:30', '19:30')).toBe(true);
  });

  it('T-03: detecta una franja contenida', () => {
    expect(haySolape('18:00', '20:00', '18:30', '19:00')).toBe(true);
  });

  it('T-04: permite franjas consecutivas', () => {
    expect(haySolape('18:00', '19:00', '19:00', '20:00')).toBe(false);
  });

  it('T-05: permite franjas separadas', () => {
    expect(haySolape('18:00', '19:00', '20:00', '21:00')).toBe(false);
  });

  it('T-06: permite una franja que termina al inicio de otra', () => {
    expect(haySolape('18:00', '19:00', '17:00', '18:00')).toBe(false);
  });

  it('T-07: acepta una hora de fin posterior', () => {
    expect(finPosteriorAInicio('18:00', '19:00')).toBe(true);
  });

  it('T-08: rechaza una hora de fin anterior', () => {
    expect(finPosteriorAInicio('19:00', '18:00')).toBe(false);
  });

  it('T-09: rechaza horas de inicio y fin iguales', () => {
    expect(finPosteriorAInicio('18:00', '18:00')).toBe(false);
  });

  it('T-23: rechaza horas fuera del rango válido', () => {
    expect(esHoraValida('25:00')).toBe(false);
    expect(esHoraValida('18:60')).toBe(false);
  });

  it('calcula duración y total para una reserva de dos horas', () => {
    expect(duracionEnHoras('08:00', '10:00')).toBe(2);
    expect(calcularTotalReserva(80000, '08:00', '10:00')).toBe(160000);
  });

  it('calcula duraciones parciales en pesos enteros y rechaza valores inválidos', () => {
    expect(duracionEnHoras('08:30', '10:00')).toBe(1.5);
    expect(calcularTotalReserva(50001, '08:30', '10:00')).toBe(75002);
    expect(duracionEnHoras('10:00', '08:00')).toBe(0);
    expect(calcularTotalReserva(80000, '08:00', '08:00')).toBe(0);
    expect(calcularTotalReserva(Number.MAX_SAFE_INTEGER, '08:00', '10:00')).toBe(0);
  });
});