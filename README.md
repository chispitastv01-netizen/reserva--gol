# ReservaGol

Sistema de administración de reservas y cobros para canchas sintéticas. Usa Next.js App Router, TypeScript, PostgreSQL de Supabase y una interfaz protegida por sesión de administrador.

## Aplicación publicada

Usa siempre la aplicación alojada en Vercel; no requiere abrir una terminal, ejecutar comandos npm ni iniciar un servidor local:

- Inicio: https://reservagolsm.vercel.app/
- Reservas: https://reservagolsm.vercel.app/reservas
- Acceso del propietario: https://reservagolsm.vercel.app/login

La navegación dentro de la aplicación usa rutas relativas y conserva el dominio publicado.

## Funcionalidades

- Gestión de canchas y clientes; se desactivan para conservar el historial.
- Agenda por cancha y fecha, con franjas ocupadas y libres.
- Creación y cancelación de reservas con comprobación transaccional de solapes.
- Cobro mediante abonos; pendiente, anticipo y pagado se derivan de los valores registrados.
- Autenticación de administrador con cookie firmada.

Las franjas son semiabiertas `[inicio, fin)`: 18:00–19:00 y 19:00–20:00 son consecutivas y no chocan.

## Desarrollo local (opcional)

Esta sección es únicamente para contribuir al código. No es necesaria para abrir ni usar la aplicación publicada.

- Node.js 20.9 o posterior.
- Proyecto Supabase Postgres.
- Variables locales y de Vercel descritas abajo.

### Configuración

1. Instala dependencias con `npm install`.
2. Copia `.env.example` a `.env.local` y asigna valores localmente; no subas `.env.local` a Git.
3. Configura `RESERVAGOL_POSTGRES_URL` con la conexión **Transaction pooler** de Supabase (puerto 6543). Para desarrollo y tareas administrativas se prefiere `RESERVAGOL_POSTGRES_URL_NON_POOLING` si está disponible.
4. Configura `RESERVAGOL_ADMIN_EMAIL`, `RESERVAGOL_ADMIN_PASSWORD` y un `RESERVAGOL_SESSION_SECRET` aleatorio de al menos 32 caracteres.
5. Ejecuta las migraciones y carga opcional de datos demo:

```bash
npm run db:migrar
npm run db:verificar
npm run db:demo
```

En Vercel configura los nombres de las variables de conexión y autenticación en los entornos que uses (Development, Preview y Production). No compartas ni registres sus valores.

Para desarrollo visual local, `npm run dev` es opcional; al terminar, vuelve a usar las URLs de producción indicadas arriba.

## Scripts

| Comando | Uso |
|---|---|
| `npm run dev` | Servidor local Next.js, solo desarrollo opcional |
| `npm run build` | Build de producción y verificación TypeScript |
| `npm run start` | Servidor de producción local; el alojamiento en Vercel lo inicia automáticamente |
| `npm run test` | Pruebas Vitest |
| `npm run db:migrar` | Aplicar migraciones SQL ordenadas |
| `npm run db:verificar` | Verificar esquema, restricciones, RLS e integridad |
| `npm run db:demo` | Reemplazar y crear registros demo |
| `npm run db:limpiar -- --prueba` | Eliminar datos de prueba sin borrar demos |
| `npm run probar:flujo` | Probar el flujo de reservas y cobros contra la base |

El servidor y las rutas API son Next.js; Vite solo se usa como infraestructura de pruebas de Vitest.

## Estructura

- `src/app/`: páginas, layouts, proxy y rutas API.
- `src/components/`: componentes reutilizables de interfaz.
- `src/lib/reglas/`: reglas de negocio puras.
- `src/lib/datos/`: consultas parametrizadas y transacciones PostgreSQL.
- `supabase/migrations/`: esquema de base de datos.
- `doc/`: plan técnico, estado, checkpoints y aceptación.

## API de salud

La API de salud está disponible en `/api/health`.

## Plan técnico

Consulta [doc/PLAN_RESERVAGOL.md](doc/PLAN_RESERVAGOL.md) para el modelo, reglas y criterios completos.
