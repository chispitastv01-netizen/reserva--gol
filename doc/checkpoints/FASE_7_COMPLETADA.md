# Fase 7 · P09 implementado

## Entregables

- `agendaDelDia(fecha)` consulta reservas activas de todas las canchas, incluidas las desactivadas, y se reexporta desde `dataService`.
- `/reservas/resumen` presenta una rejilla por cancha y hora, desde 06:00 hasta 23:00, que marca las franjas libres y ocupadas y enlaza las reservas.
- `resumenCobros(desde, hasta)` suma los abonos y cuenta reservas por estado de pago dentro del rango de fechas. Incluye reservas canceladas en el resumen financiero, ya que el sistema no tiene una operación de reembolso.
- `GET /api/reservas/resumen?desde=&hasta=` requiere sesión, valida fechas y rechaza rangos invertidos.
- La pantalla ofrece un selector para la fecha de agenda y otro rango para el resumen de cobros; por defecto se consulta el mes actual.

## Verificaciones

- `npm.cmd run build`: exitoso; Next.js registra `/api/reservas/resumen` y `/reservas/resumen` como rutas dinámicas.
- `npm.cmd test`: 47 pruebas pasaron, incluidas las pruebas del endpoint y de las funciones de resumen.
- El navegador local redirigió a `/login`. No se inició sesión, por lo que la inspección visual autenticada de A-15 y la comprobación de los datos Demo quedan pendientes.
- El fixture Demo documentado en P04 contiene abonos de $20.000 y $50.000. El total esperado para el mes es $70.000, con 3 reservas: 1 pendiente, 1 con anticipo y 1 pagada. Este total es una suma manual del fixture documentado, no una observación en la pantalla.
- La ejecución de A-15 en Vercel sigue pendiente y no se considera sustituida por estas pruebas locales.