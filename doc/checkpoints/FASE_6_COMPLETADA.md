# Fase 6 completada · Revisión y aceptación

## Revisión de reglas e integridad

- La creación de reservas valida el horario en una transacción, bloquea la cancha activa y las reservas activas existentes, y aplica intervalos semiabiertos.
- El estado del pago se deriva de la suma de abonos; los montos se validan como enteros y no pueden superar el saldo.
- Las fechas pasadas se comparan usando `hoyBogota()`.
- Las rutas de reservas exigen sesión; las consultas SQL usan parámetros y los estados incluyen texto además del color.
- No se encontraron defectos pendientes en los criterios de P08.

## Verificaciones

- `npm.cmd run probar:flujo`: 15/15 pasos correctos.
- `npm.cmd run db:limpiar -- --prueba`: 0 filas de prueba eliminadas; los datos Demo se conservaron.
- `npm.cmd run build`: exitoso.
- `npm.cmd test`: 42 pruebas pasaron.
- `.env.local` está ignorado y no está versionado; `.env.example` contiene únicamente nombres de variables con valores vacíos. No se detectaron credenciales en archivos versionados.

## Aceptación manual pendiente

`doc/ACEPTACION.md` contiene A-01 a A-15 con las columnas de resultado vacías. Ejecutar A-01 a A-14 en Vercel; A-15 se completa después de P09. La aceptación en Vercel no se considera sustituida por estas pruebas locales.
