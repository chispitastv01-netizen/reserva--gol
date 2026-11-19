# Fase 5 completada · Interfaz

P08 cierra la interfaz del MVP al integrar el detalle de reserva, el cobro con abonos y la cancelación con confirmación.

## Detalle y cobro

- El detalle obtiene la reserva por ID y presenta cancha, cliente, fecha, franja y estado de reserva.
- El panel muestra total, abonado, saldo, estado de pago y los abonos registrados.
- El registro de abono comunica errores, incluido `ABONO_EXCEDE_TOTAL`, y actualiza la vista.
- La cancelación solo está disponible para reservas activas; usa el texto de confirmación definido en el plan y actualiza el detalle tras responder.
- Los estados se representan con etiqueta y color.

## Evidencia

- Los entregables de P08 ya estaban implementados al retomar la ejecución; se revisaron sin rehacerlos.
- `npm.cmd run build`: exitoso.
- `npm.cmd test`: 42 pruebas pasaron.
- La aceptación manual de A-01 a A-14 queda para el despliegue de Vercel; A-15 corresponde a P09.
