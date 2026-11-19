# Fase 8 · Disponibilidad, navegación e identidad visual

## Entregables

- `AgendaCliente` consulta `/api/reservas/publica` cada cinco segundos sin cache. Tras crear una reserva, marca inmediatamente la franja como ocupada y consulta el estado persistido; otros navegadores reciben el cambio en el siguiente sondeo.
- `ReservasLayout` mantiene la cabecera pública sin sesión y muestra la navegación del propietario autenticado en las rutas de gestión. La navegación incluye Contaduría, Canchas, Clientes y Resumen; el header privado es sticky.
- Las marcas de inicio públicas, privadas y de login usan el icono Trophy con el nombre ReservaGol; se eliminaron las marcas de texto `RG`.
- La ruta pública sigue usando el mismo endpoint de creación y la capa de datos transaccional existente; no hubo cambios de conexión ni de esquema.

## Verificaciones

- `npm.cmd test`: 73 pruebas pasaron en 20 archivos.
- `npm.cmd run build`: exitoso con Next.js 16.3.5.
- Búsqueda en `src/`: sin marcas de logotipo `RG`.
