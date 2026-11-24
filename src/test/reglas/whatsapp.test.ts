import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  crearEnlaceComprobanteWhatsApp,
  crearTextoComprobante,
  enviarComprobanteWhatsApp,
} from '@/lib/whatsapp/comprobante';
import { normalizarNumeroWhatsApp } from '@/lib/reglas/whatsapp';

const RESERVA = {
  id: 'RG-2026-001',
  canchaNombre: 'Cancha Norte',
  valorTotal: 80000,
  fecha: '2026-11-20',
  horaInicio: '18:00',
  horaFin: '19:00',
};

describe('comprobante por WhatsApp', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('normaliza celulares colombianos locales y números internacionales', () => {
    expect(normalizarNumeroWhatsApp('(300) 123-4567')).toBe('573001234567');
    expect(normalizarNumeroWhatsApp('+1 202 555 0100')).toBe('12025550100');
    expect(normalizarNumeroWhatsApp('601 555 0000')).toBeNull();
    expect(normalizarNumeroWhatsApp('123')).toBeNull();
  });

  it('incluye los datos confirmados y crea enlace seguro cuando no hay API configurada', async () => {
    vi.stubEnv('RESERVAGOL_WHATSAPP_API_URL', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const mensaje = crearTextoComprobante(RESERVA);
    const resultado = await enviarComprobanteWhatsApp('3001234567', RESERVA);
    const enlace = crearEnlaceComprobanteWhatsApp('3001234567', mensaje);

    expect(mensaje).toContain('Cancha: Cancha Norte');
    expect(mensaje).toContain('Total: $80.000 COP');
    expect(mensaje).toContain('Código de reserva: RG-2026-001');
    expect(mensaje).toContain('Disponibilidad y reserva: confirmadas');
    expect(resultado).toEqual({ estado: 'respaldo', enlaceRespaldo: enlace });
    expect(enlace).toContain('https://wa.me/573001234567?text=');
    expect(decodeURIComponent(enlace ?? '')).toContain('20 de noviembre de 2026');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('envía el comprobante al endpoint configurado con token Bearer', async () => {
    vi.stubEnv('RESERVAGOL_WHATSAPP_API_URL', 'https://mensajeria.example/api/whatsapp');
    vi.stubEnv('RESERVAGOL_WHATSAPP_API_TOKEN', 'token-de-prueba');
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);

    const resultado = await enviarComprobanteWhatsApp('+573001234567', RESERVA);
    const [url, opciones] = fetchMock.mock.calls[0] as [URL, RequestInit];
    const cuerpo = JSON.parse(String(opciones.body));

    expect(resultado).toEqual({ estado: 'enviado', enlaceRespaldo: null });
    expect(url.toString()).toBe('https://mensajeria.example/api/whatsapp');
    expect((opciones.headers as Record<string, string>).Authorization).toBe('Bearer token-de-prueba');
    expect(cuerpo).toMatchObject({
      evento: 'reserva.confirmada',
      para: '573001234567',
      reserva: {
        id: 'RG-2026-001',
        canchaNombre: 'Cancha Norte',
        estado: 'confirmada',
      },
    });
  });

  it('vuelve al enlace manual si falla el proveedor sin exponer datos del cliente', async () => {
    vi.stubEnv('RESERVAGOL_WHATSAPP_API_URL', 'https://mensajeria.example/api/whatsapp');
    vi.stubEnv('RESERVAGOL_WHATSAPP_API_TOKEN', 'secreto-no-registrable');
    const fetchMock = vi.fn().mockRejectedValue(new Error('fallo de red'));
    vi.stubGlobal('fetch', fetchMock);
    const advertencia = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const resultado = await enviarComprobanteWhatsApp('3001234567', RESERVA);

    expect(resultado.estado).toBe('respaldo');
    expect(resultado.enlaceRespaldo).toContain('https://wa.me/573001234567?text=');
    expect(JSON.stringify(advertencia.mock.calls)).not.toContain('secreto-no-registrable');
    expect(JSON.stringify(advertencia.mock.calls)).not.toContain('3001234567');
  });
});
