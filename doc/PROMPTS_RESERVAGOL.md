# ReservaGol · Prompts para GitHub Copilot

> Plan de referencia: `doc/PLAN_RESERVAGOL.md`
> Herramienta: GitHub Copilot Chat en modo Agente (VS Code)
> Punto de partida: repositorio Next.js ya iniciado (estructura /src, /doc, /public); por confirmar en P00

---

## El primer prompt concilia

El plan menciona que ya hay una estructura de repositorio (`/src`, `/doc`, `/public`). **El primer prompt (P00) audita qué hay montado** (proyecto Next, Supabase, login, datos) y escribe un dictamen de qué usar, qué adaptar y qué crear. Los prompts siguientes leen ese dictamen. Lee `doc/DICTAMEN.md` después de P00: ahí sabrás qué te falta conseguir (por ejemplo, la conexión a Supabase) antes de seguir.

## Cómo ejecutar estos prompts

1. Crear la carpeta `doc/` en la raíz del repositorio (si no existe) y copiar allí `PLAN_RESERVAGOL.md` y `PROMPTS_RESERVAGOL.md`.
2. Abrir el proyecto en VS Code y abrir Copilot Chat. En el selector de modo elegir **Agent**. En el selector de modelo elegir el más capaz disponible.
3. Cada prompt se ejecuta en una **conversación nueva** (botón `+` del chat).
4. Copiar el bloque gris completo del prompt, pegarlo en el chat y enviarlo. No hay datos que reemplazar.
5. Cuando Copilot pida permiso para ejecutar un comando en la terminal, leerlo y aceptarlo.
6. Al terminar cada prompt: revisar los cambios y aceptarlos (**Keep**); hacer la verificación indicada; hacer commit con el mensaje sugerido y `git push`. Vercel desplegará; si falla, usar el prompt de despliegue fallido antes de continuar.
7. No saltar prompts. Si algo falla, usar el prompt de corrección del final.

| Fase | Prompts |
|---|---|
| 0 · Conciliación | P00 |
| 1 · Base de datos | P01 |
| 2 · Reglas de negocio | P02 |
| 3 · Servidor | P03 |
| 4 · Datos y API | P04, P05 |
| 5 · Interfaz | P06, P07, P08 |
| 7 · Opcionales | P09 |

---

## P00 · Conciliación: qué hay, qué falta, qué se crea

**Fase:** 0 · **Modifica código:** no · **Crea:** `doc/ESTADO_ACTUAL.md`, `doc/DICTAMEN.md`, `.github/copilot-instructions.md`, `doc/ESTADO_EJECUCION.md`, `doc/checkpoints/FASE_0_COMPLETADA.md`

````text
Actúa como ingeniero de software senior trabajando en modo agente sobre este repositorio.

Contexto: el proyecto "ReservaGol" (reservas y cobros para canchas sintéticas) se construye sobre el stack del curso (Next.js + TypeScript + Tailwind + Supabase + Vercel). El repositorio ya tiene una estructura iniciada (/src, /doc, /public). NO se da por hecho que la base de datos ni el login estén montados. Este prompt NO implementa funcionalidades: audita lo que exista y produce un dictamen de qué hay, qué falta y qué se crea o adapta. El plan técnico está en doc/PLAN_RESERVAGOL.md.

Lee completo doc/PLAN_RESERVAGOL.md, en especial las secciones 0, 1, 4, 5, 7, 8 y 17.

TAREA 1. Crea doc/ESTADO_ACTUAL.md con una radiografía fiel. No supongas: revisa el repositorio. Secciones:
1. ¿Hay un proyecto Next.js con TypeScript? Versión de next, react, typescript, tailwindcss. El plan menciona Vite y Vitest: aclara si el proyecto es Next (App Router) con Vitest para pruebas, o si hay una configuración de Vite; el servidor y las rutas API deben ser de Next.
2. Scripts de package.json.
3. Estructura: árbol de src/, doc/, public/ y cualquier app/, lib/, components/ hasta 3 niveles.
4. Alias en tsconfig.json.
5. Autenticación: ¿hay login? Si lo hay, archivos y mecanismo; si no, indícalo (se agrega en P03).
6. Base de datos: ¿hay proyecto Supabase y conexión directa a Postgres en .env.local? (solo NOMBRES). Si no, indícalo.
7. Dónde viven los datos hoy, si hay algo.
8. Dependencias: pg, zod, @supabase/supabase-js, vitest: cuáles están y cuáles FALTAN.
9. Migraciones: ¿hay mecanismo? Si no, se crea.
10. Qué del dominio ya está construido: canchas, clientes, reservas, cobros/abonos. Estado de cada uno.
11. Estilos: Tailwind (versión), globals.css, tokens, fuentes.
12. Pruebas: configuración de Vitest y pruebas existentes.
13. Conflictos: existencia previa de app/reservas, app/api/reservas, lib/dataService, components/ui; contenido de app/page.tsx.
14. Decisiones derivadas: ¿hay base Next o hay que crear algo?; ruta de login (existe o se agrega); archivo de protección (proxy.ts en Next 16, middleware.ts antes); mecanismo de migraciones; nombre de la variable de conexión a Postgres; nombres de M1 y M2; estructura (src/).
15. Compilación de base: resultado de npm run build (TAREA 4).

TAREA 2. Crea doc/DICTAMEN.md: para cada pieza de INFRAESTRUCTURA (proyecto Next/TS, Tailwind, conexión Supabase/Postgres, login, migraciones) y cada funcionalidad del módulo mínimo (F1 canchas, F2 clientes, F3 crear reserva con verificación de disponibilidad, F4 consultar disponibilidad, F5 cancelar, F6 cobro con abonos), di su estado y qué hacer:

```markdown
## [Pieza o funcionalidad]
- Estado: EXISTE Y SIRVE | EXISTE PARCIAL | NO EXISTE
- Qué hacer: USAR | ADAPTAR | CREAR
- Detalle: [qué exactamente, en qué prompt]
```

Si algo EXISTE Y SIRVE, se USA; si EXISTE PARCIAL, se ADAPTA; si NO EXISTE, se CREA. Incluye una tabla resumen y una lista de "qué necesita conseguir el estudiante" (por ejemplo, crear el proyecto Supabase y copiar la cadena de conexión), con pasos sencillos.

TAREA 3. Crea .github/copilot-instructions.md reemplazando [AJUSTAR] con lo hallado:

```markdown
# ReservaGol · Instrucciones para Copilot

## Documentos rectores
- Plan técnico: doc/PLAN_RESERVAGOL.md. Si una instrucción contradice el plan, prevalece el plan.
- Estado real del repositorio: doc/ESTADO_ACTUAL.md.
- Dictamen de conciliación: doc/DICTAMEN.md. Antes de crear algo, revisa si el dictamen dice USAR (ya existe); si es así, úsalo sin rehacerlo.
- Avance: doc/ESTADO_EJECUCION.md.

## Stack objetivo
- Next.js App Router + TypeScript + Tailwind CSS. Despliegue en Vercel. (El servidor es Next, no Vite; Vitest es para pruebas.)
- Postgres de Supabase con el paquete pg y la variable [AJUSTAR: conexión]. (pg [AJUSTAR: está / falta].)
- Validación con Zod. Pruebas con Vitest.
- app/ está en [AJUSTAR: src/app]. Login: [AJUSTAR: existe / se agrega en P03] como puerta única, sin roles.

## Lo más importante del dominio
- Choque de horarios: dos reservas de la MISMA cancha y MISMO día, ambas activas, chocan si sus franjas [inicio, fin) se solapan (haySolape: aInicio < bFin && bInicio < aFin). Las franjas son semiabiertas: 18-19 y 19-20 NO chocan. La verificación se hace en una transacción, con las reservas activas de la cancha bloqueadas. Vive en lib/reglas/horario.ts.
- Estado del pago: se DERIVA de los abonos frente al total (sin abonos → pendiente; abonos < total → anticipo; abonos >= total → pagado). No se guarda como campo editable. Un abono no puede superar el saldo.
- Una reserva nace activa; cancelarla libera su franja. Reservas y abonos son inmutables.
- No se reserva en fecha pasada.

## Convenciones
- Identificadores, comentarios, mensajes y textos de interfaz en español.
- Reglas de negocio solo en lib/reglas/: funciones puras, sin pg, sin red, sin variables de entorno y sin reloj (excepto fechas.ts). Se prueban con Vitest.
- Solo lib/datos/ importa lib/db/conexion.ts. Rutas y páginas importan datos únicamente desde lib/dataService.ts.
- Toda ruta en app/api/reservas/ llama await exigirSesion() como primera instrucción.
- Montos en pesos enteros. Horas como texto 'HH:MM'; fechas 'YYYY-MM-DD'. Zona horaria America/Bogota; "hoy" solo con hoyBogota().
- En rutas dinámicas params es una Promise: const { id } = await params.
- SQL siempre con parámetros. Nunca concatenar valores.
- Canchas y clientes se desactivan, no se eliminan. Reservas se cancelan.
- No instalar librerías de componentes (shadcn, MUI u otras). Usar components/ui/.
- Prefijo de imports: [AJUSTAR]. Archivo de protección: [AJUSTAR]. Ruta de login: [AJUSTAR].

## Al terminar cada tarea
1. npm run build sin errores.
2. npm test sin fallas (desde que exista Vitest).
3. Actualizar doc/ESTADO_EJECUCION.md.
4. No hacer commit: el estudiante revisa y hace el commit.
```

TAREA 4. Si hay proyecto Next y falta node_modules, ejecuta npm install y luego npm run build; registra el resultado en la sección 15 de ESTADO_ACTUAL.md. Si no hay proyecto o falla, NO lo arregles: descríbelo y dilo en el dictamen.

TAREA 5. Crea doc/ESTADO_EJECUCION.md con la tabla de prompts (P00 a P09) en estado pendiente y una sección de bitácora.

TAREA 6. Según lo que falte, explícame qué necesito conseguir antes de P01: si no hay proyecto Supabase, cómo crearlo; cómo obtener la cadena de conexión (Connect, Transaction pooler, puerto 6543) y ponerla en .env.local y en Vercel. Solo diagnosticar; no crear nada.

RESTRICCIONES: no modifiques código, configuración ni dependencias. Solo creas los archivos de este prompt.

AL TERMINAR:
- Crea doc/checkpoints/FASE_0_COMPLETADA.md con: estado de la infraestructura, resumen del dictamen (qué USAR / ADAPTAR / CREAR) y qué necesita conseguir el estudiante.
- Marca P00 en ESTADO_EJECUCION.md.
- Muéstrame el dictamen resumido y dime claramente qué me falta conseguir antes de seguir con P01.
````

**Verificación del estudiante:** leer `doc/DICTAMEN.md`. Dice qué ya tienes, qué falta y qué se va a crear, y al final qué debes conseguir (por ejemplo, la conexión a Supabase) antes de P01.

**Commit sugerido:** `docs: conciliación y dictamen de ReservaGol`

---

## P01 · Base de datos del módulo

**Fase:** 1 · **Crea o usa:** dependencia `pg`, dos migraciones, `scripts/verificar-bd.mjs`, `scripts/migrar.mjs`

````text
Antes de escribir código lee completos: doc/DICTAMEN.md, doc/PLAN_RESERVAGOL.md (secciones 5, 7, 8, 9 y 15), doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md. Si el dictamen dice que falta la conexión a Postgres, detente y avísame.

OBJETIVO: crear las tablas en Supabase Postgres y dejar un script que demuestre que la base protege las reglas (nombre de cancha único, fin > inicio, valor > 0, abono > 0, y el índice que evita dos reservas activas idénticas).

TAREA 1. Si falta pg, agrégalo (y @types/pg).

TAREA 2. Crea en supabase/migrations/ dos archivos con los nombres de la sección 14 de ESTADO_ACTUAL.md:
- M1 (tablas) con el SQL exacto de la sección 9.2 del plan.
- M2 (vista y seguridad) con el SQL exacto de la sección 9.3.
No cambies nombres de tablas, columnas ni restricciones: el código depende de ellos (sección 9.4).

TAREA 3. Aplica las migraciones con el mecanismo existente o creando scripts/migrar.mjs (lee la variable de conexión; ssl { rejectUnauthorized: false }; tabla _migrations; aplica en orden alfabético en transacción; imprime "aplicada"/"omitida"; código 1 si falla) y el script "db:migrar". Ejecútalo.

TAREA 4. Crea scripts/verificar-bd.mjs y "db:verificar". Debe imprimir:
1. Existencia de canchas, clientes, reservas, abonos y la vista v_reservas.
2. Número de filas de cada tabla.
3. Restricciones (pg_constraint) e índices: ux_canchas_nombre, reservas_horas_ok, reservas_valor_ok, ux_reservas_slot_activo, abonos_monto_positivo.
4. Si RLS está activo en las cuatro tablas.
5. Pruebas de integridad en UNA transacción que SIEMPRE termina en ROLLBACK, con SAVEPOINT antes de cada caso que debe fallar:
   a) Crear cancha "Verif C1": funciona; crear "verif c1" otra vez: 23505 (ux_canchas_nombre).
   b) Crear cliente "Verif Cli" (contacto "300"): funciona.
   c) Crear reserva (Verif C1, Verif Cli, fecha hoy+3, 18:00, 19:00, valor 50000, activa): funciona.
   d) Crear reserva con hora_fin 18:00 y hora_inicio 19:00: 23514 (reservas_horas_ok).
   e) Crear reserva con valor_total 0: 23514 (reservas_valor_ok).
   f) Crear otra reserva activa con la misma cancha, fecha y hora_inicio 18:00: 23505 (ux_reservas_slot_activo).
   g) Insertar un abono con monto 0: 23514 (abonos_monto_positivo).
   h) Insertar un abono válido (monto 20000) y comprobar que la vista v_reservas reporta abonado 20000 para esa reserva.
   Imprime OK o FALLA por caso.
6. Total de fallas; código 1 si hubo alguna.

Ejecuta npm run db:verificar y copia la salida en la bitácora.

RESTRICCIONES: no modifiques el login ni app/. No crees tablas distintas a las del plan.

AL TERMINAR:
- npm run build sin errores.
- Crea doc/checkpoints/FASE_1_COMPLETADA.md con la salida de db:verificar.
- Marca P01 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** en Supabase aparecen `canchas`, `clientes`, `reservas` y `abonos`. La salida de `npm run db:verificar` no tiene FALLA, y el caso h muestra el abonado calculado por la vista.

**Commit sugerido:** `feat(bd): canchas, clientes, reservas y abonos`

---

## P02 · Reglas de negocio y pruebas unitarias

**Fase:** 2 · **Crea:** `src/lib/config/reservagol.ts`, `src/lib/reglas/*`, pruebas, `vitest.config.ts`

````text
Antes de escribir código lee completos: doc/DICTAMEN.md, doc/PLAN_RESERVAGOL.md (secciones 5, 7, 8, 10.3, 10.4, 10.5, 11.2, 14 y 16.1), doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md.

OBJETIVO: implementar las reglas puras y probarlas con Vitest. El núcleo es el solape de horarios y el estado del pago.

TAREA 1. Si falta Vitest, instálalo y configúralo (environment node, include ['src/tests/**/*.test.ts'] o la carpeta del repo, alias de tsconfig). Si ya hay Vitest, respétalo y no rompas pruebas existentes.

TAREA 2. Crea src/lib/config/reservagol.ts con el contenido de la sección 10.4.

TAREA 3. Crea src/lib/reglas/ con las firmas de la sección 10.5:
- errores.ts: CodigoError; MENSAJES y ESTADO_HTTP (tabla 11.2); clase ErrorDeNegocio.
- fechas.ts: hoyBogota; esFechaValida; esHoraValida ('HH:MM', 00:00–23:59); esFechaPasada(fecha, hoy).
- horario.ts: haySolape(aInicio, aFin, bInicio, bFin) = aInicio < bFin && bInicio < aFin (RN-03, RN-04); finPosteriorAInicio(inicio, fin) = fin > inicio.
- reserva.ts: validarReserva(d, hoy) (fecha no pasada → FECHA_INVALIDA; horas válidas y fin > inicio → DATOS_INVALIDOS; valorTotal entero > 0 → DATOS_INVALIDOS).
- pago.ts: EstadoPago; estadoPago(total, abonado) (abonado<=0 → pendiente; abonado>=total → pagado; si no → anticipo, RN-08); saldo(total, abonado) = max(0, total-abonado); abonoValido(total, abonadoActual, monto) = monto>0 && abonadoActual+monto<=total (RN-07).
- cliente.ts: validarCliente(d) (nombre y contacto no vacíos → DATOS_INVALIDOS).

Ninguna regla importa pg, red, next ni process.env, ni llama new Date() (excepto el parámetro por defecto de hoyBogota).

TAREA 4. Crea tests/reglas/ayudas.ts con esperarCodigo(fn, codigo). Crea las pruebas (horario, pago, reserva) cubriendo T-01 a T-25 de la sección 16.1, con hoy = '2026-06-15'. Cada caso con su ID. Lo crítico: T-04 (consecutivas no chocan), T-13 (abonado >= total → pagado), T-16/T-17 (abono que completa vs que excede).

TAREA 5. Ejecuta npm test hasta que pasen las 25. Si una falla, corrige la regla, no la prueba, salvo que contradiga el plan; explícalo.

RESTRICCIONES: no toques app/, el login ni la base de datos.

AL TERMINAR:
- npm run build y npm test sin errores.
- Crea doc/checkpoints/FASE_2_COMPLETADA.md con la salida de npm test.
- Marca P02 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** `npm test` (25 pruebas). Abrir `src/lib/reglas/horario.ts` y comprobar que dos franjas consecutivas (18-19 y 19-20) no chocan.

**Commit sugerido:** `feat(reglas): solape de horarios y estado de pago con 25 pruebas`

---

## P03 · Infraestructura del servidor

**Fase:** 3 · **Crea:** conexión, sesión (login como puerta), respuestas, esquemas, formato · **Modifica:** protección de rutas

````text
Antes de escribir código lee completos: doc/DICTAMEN.md, doc/PLAN_RESERVAGOL.md (secciones 3, 9.4, 10.1, 10.3, 10.7, 11.1, 11.2, 11.4, 13 y 14), doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md.

OBJETIVO: la infraestructura del servidor y el acceso.

TAREA 1. src/lib/db/conexion.ts como la sección 10.7 (con los parsers, incluido el de TIME que recorta a HH:MM). Usa el nombre real de la variable de conexión.

TAREA 2. Login y sesión:
- Si el dictamen dice que hay login: crea src/lib/auth/sesion.ts que lo envuelve (obtenerSesion, exigirSesion) sin reescribirlo.
- Si NO hay login: agrega uno mínimo como puerta (página /login con contraseña de acceso en variable de entorno y cookie de sesión firmada; el mecanismo más simple y seguro que encaje con la versión de Next). Documenta la decisión. Sin roles.
- exigirSesion() lanza ErrorDeNegocio('NO_AUTORIZADO') si no hay sesión.

TAREA 3. Protección de rutas (proxy.ts en Next 16, o el archivo del dictamen): protege /reservas/:path* y /api/reservas/:path*. Sin sesión: páginas a /login; API 401 con el formato de la sección 11.1.

TAREA 4. Tras iniciar sesión, a /reservas. app/page.tsx redirige a /reservas (o a /login si no hay sesión).

TAREA 5. src/lib/http/respuestas.ts: responderOk; responderError (ErrorDeNegocio → ESTADO_HTTP; ZodError → 400 DATOS_INVALIDOS con flatten; pg 23505/23503/23514 → tabla 9.4 por error.constraint; otro → console.error y 500 ERROR_INTERNO); conManejoDeErrores; leerCuerpo. Todas con Cache-Control: no-store.

TAREA 6. src/lib/validacion/esquemas.ts con los esquemas de la sección 11.4, con tipos z.infer. No importa nada del servidor.

TAREA 7. src/lib/formato.ts: formatearPesos (Intl es-CO, COP, sin decimales); formatearFecha; formatearHora (HH:MM).

TAREA 8. src/app/api/reservas/sesion/route.ts: GET con conManejoDeErrores; primera instrucción await exigirSesion(); responde { email } o { ok: true }. export const dynamic = 'force-dynamic'.

VERIFICACIÓN: npm run build y npm test. Inicia npm run dev; sin sesión, la ruta de sesión da 401 y /reservas redirige al login. Inicia sesión y comprueba que llega a /reservas.

AL TERMINAR:
- Crea doc/checkpoints/FASE_3_COMPLETADA.md con los resultados y la decisión de login.
- Marca P03 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** sin sesión, `/reservas` redirige al login; con sesión, entra.

**Commit sugerido:** `feat(servidor): conexión, login de acceso y utilidades de API`

---

## P04 · Datos: canchas, clientes y reservas

**Fase:** 4 (primera parte) · **Crea:** `src/lib/datos/*`, `src/lib/dataService.ts`, scripts de prueba y demo

````text
Antes de escribir código lee completos: doc/DICTAMEN.md, doc/PLAN_RESERVAGOL.md (secciones 5, 6, 6.1, 6.2, 7, 8, 9.4, 10.5, 10.6 y 16.2), doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md. Revisa lib/reglas/, lib/db/conexion.ts y lib/validacion/esquemas.ts.

OBJETIVO: la capa de datos y los casos de uso contra Postgres, y comprobar el flujo. Lo crítico: la verificación de choque en transacción y el estado de pago derivado.

TAREA 1. src/lib/datos/tipos.ts con los tipos de la sección 10.6.

TAREA 2. src/lib/datos/canchas.ts y src/lib/datos/clientes.ts:
- canchas: listarCanchas({ incluirInactivas }); crearCancha(d) (CANCHA_DUPLICADA si choca); desactivarCancha(id); exigirCanchaActiva(tx, id) (interna; CANCHA_NO_ENCONTRADA).
- clientes: listarClientes({ incluirInactivos }); crearCliente(d) (validarCliente); desactivarCliente(id); exigirClienteActivo(tx, id) (interna; CLIENTE_NO_ENCONTRADO).

TAREA 3. src/lib/datos/reservas.ts:
- crearReserva(d): secuencia EXACTA de la sección 6.1 dentro de conTransaccion: validarReserva(d, hoyBogota()); exigirCanchaActiva; exigirClienteActivo; traer las reservas activas de esa cancha y fecha con FOR UPDATE; si alguna haySolape con la nueva franja → CHOQUE_HORARIO; insertar la reserva activa. Devuelve la reserva.
- disponibilidad(canchaId, fecha): las franjas ocupadas (reservas activas de esa cancha ese día).
- obtenerReserva(id): la reserva (de v_reservas) con su cobro (total, abonado, saldo, estadoPago calculado con estadoPago(), lista de abonos); RESERVA_NO_ENCONTRADA si no.
- cancelarReserva(id): si no existe RESERVA_NO_ENCONTRADA; si ya cancelada RESERVA_CANCELADA; estado 'cancelada'.
- registrarAbono(id, monto): secuencia de la sección 6.2 dentro de conTransaccion (bloquear la reserva; RESERVA_CANCELADA si lo está; validar monto > 0; abonoValido con el abonado actual, si no ABONO_EXCEDE_TOTAL; insertar el abono). Devuelve el cobro recalculado.
- listarReservas({ canchaId, fecha, estado }): reservas con su estado de pago calculado.

TAREA 4. src/lib/datos/resumen.ts: créalo preparado para las opcionales (agendaDelDia, resumenCobros); en el mínimo no se usa.

TAREA 5. src/lib/dataService.ts como fachada: reexporta las funciones públicas y los tipos. Verifica que ningún archivo fuera de lib/datos importe lib/db/conexion.ts.

TAREA 6. scripts/limpiar-prueba.mjs ("db:limpiar"): borra (en orden abonos, reservas, clientes, canchas) los registros de prueba (canchas/clientes que empiecen por 'Prueba' o 'Demo' y sus reservas y abonos). scripts/cargar-demo.ts ("db:demo"): crea 2 canchas, 3 clientes y algunas reservas en fechas futuras con distintos estados de pago (una sin abonos, una con anticipo, una pagada). Limpia los demo antes. Imprime una tabla. Ejecútalo.

TAREA 7. Instala tsx si falta. scripts/probar-flujo.ts ("probar:flujo") con los 15 pasos de la sección 16.2 usando solo dataService (fechas futuras relativas a hoy). Imprime OK/FALLA por paso; los que esperan error verifican el código; limpia antes y en finally; cierra el pool; código 1 si hay fallas. CRÍTICO: el paso 5 comprueba CHOQUE_HORARIO en solape parcial; el 6 que una consecutiva (19-20) se permite; el 11 que un abono que excede se rechaza; el 14 que una franja cancelada se puede volver a reservar. Ejecuta y corrige hasta 0 fallas.

RESTRICCIONES: no romper el login ni las pruebas. No dupliques lógica (vive en lib/reglas/).

AL TERMINAR:
- npm run build y npm test sin errores.
- Marca P04 en ESTADO_EJECUCION.md y agrega la salida de probar:flujo y db:demo en la bitácora. La fase 4 sigue abierta hasta P05.
- Muéstrame un resumen.
````

**Verificación del estudiante:** `npm run probar:flujo` (15 OK, 0 fallas). El paso 5 confirma el choque, el 6 que las consecutivas se permiten, el 14 que una franja cancelada se libera.

**Commit sugerido:** `feat(datos): reservas con verificación de choque y cobros con abonos`

---

## P05 · API

**Fase:** 4 (cierre) · **Crea:** rutas de `src/app/api/reservas/`

````text
Antes de escribir código lee completos: doc/DICTAMEN.md, doc/PLAN_RESERVAGOL.md (secciones 11.1 a 11.4), doc/ESTADO_EJECUCION.md, lib/dataService.ts, lib/http/respuestas.ts, lib/validacion/esquemas.ts y lib/auth/sesion.ts.

OBJETIVO: exponer las operaciones del módulo mínimo con rutas protegidas.

TAREA 1. Crea las rutas del módulo mínimo de la tabla 11.3 (deja /resumen para P09). Reglas de cada handler:
- Primera instrucción: await exigirSesion().
- conManejoDeErrores; cuerpos con leerCuerpo y los esquemas de 11.4; filtros validados.
- [id] con await params.
- export const dynamic = 'force-dynamic'.
- POST de canchas, clientes, reservas y abonos responden 201; cancelar responde 200.
- GET /api/reservas/disponibilidad?canchaId=&fecha= devuelve las franjas ocupadas.

TAREA 2. Verificación sin sesión: las rutas de /api/reservas deben dar 401.

TAREA 3. Verificación con sesión: pídeme que inicie sesión. Crea una cancha y un cliente; crea una reserva; intenta una que solape (409 CHOQUE_HORARIO); registra un abono parcial (estado anticipo) y verifica el saldo; intenta un abono que excede (409 ABONO_EXCEDE_TOTAL); cancela la reserva y vuelve a reservar la franja. Documenta.

AL TERMINAR:
- npm run build y npm test sin errores.
- Crea doc/checkpoints/FASE_4_COMPLETADA.md con probar:flujo (P04) y las verificaciones.
- Marca P05 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** las rutas piden sesión; crear una reserva y registrar abonos por API funciona, y un choque o un abono que excede se rechazan.

**Commit sugerido:** `feat(api): rutas de reservas, cobros, canchas y clientes`

---

## P06 · Interfaz base, canchas y clientes

**Fase:** 5 · **Crea:** `src/components/ui/*`, layout de `/reservas`, canchas y clientes · **Modifica:** `globals.css`, `app/page.tsx`

````text
Antes de escribir código lee completos: doc/DICTAMEN.md, doc/PLAN_RESERVAGOL.md (secciones 3, 5, 11, 12, 13), doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md.

OBJETIVO: componentes reutilizables, navegación, y la gestión de canchas y clientes (soporte de las reservas).

TAREA 1. Agrega los tokens de color de la sección 13 sin borrar nada existente (Tailwind 4: @theme; Tailwind 3: tailwind.config). Respeta la paleta existente si la hay.

TAREA 2. src/components/ui/: si ya hay componentes base, reúsalos; si faltan, crea Boton, Campo, Selector, Tarjeta, Insignia, Aviso, Modal, EstadoVacio con foco visible y contraste.

TAREA 3. app/page.tsx: redirección a /reservas (o a /login si no hay sesión).

TAREA 4. src/components/reservagol/NavegacionReservaGol.tsx y src/app/reservas/layout.tsx (servidor): verifica sesión, redirige a /login si no hay. Navegación: Agenda, Canchas, Clientes (y Resumen cuando exista); cerrar sesión. Mobile-First.

TAREA 5. src/components/reservagol/InsigniaEstadoReserva.tsx y InsigniaEstadoPago.tsx (con color y texto).

TAREA 6. Canchas: src/components/reservagol/FormularioCancha.tsx y src/app/reservas/canchas/page.tsx: formulario (nombre, precio por hora opcional) y lista con estado; acción de desactivar; CANCHA_DUPLICADA muestra el mensaje. Clientes: src/components/reservagol/FormularioCliente.tsx y src/app/reservas/clientes/page.tsx: formulario (nombre, contacto) y lista; acción de desactivar.

VERIFICACIÓN: pídeme que inicie sesión si lo necesitas. Con los datos demo: ver y crear canchas y clientes; intentar una cancha con nombre repetido (error); desactivar una. Revisa en móvil.

AL TERMINAR:
- npm run build y npm test sin errores.
- Marca P06 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** crear y listar canchas y clientes; rechazar una cancha duplicada.

**Commit sugerido:** `feat(interfaz): canchas y clientes`

---

## P07 · Agenda y creación de reservas

**Fase:** 5 · **Crea:** agenda de disponibilidad y el formulario de reserva

````text
Antes de escribir código lee completos: doc/DICTAMEN.md, doc/PLAN_RESERVAGOL.md (secciones 5, 6, 6.1, 7, 11, 12), doc/ESTADO_EJECUCION.md y los componentes existentes.

OBJETIVO: ver la disponibilidad de una cancha por día y crear reservas verificando el choque.

TAREA 1. src/components/reservagol/AgendaDia.tsx y src/app/reservas/page.tsx (servidor): selector de cancha y fecha (por defecto hoy); muestra las franjas ocupadas de esa cancha ese día (cliente, horario, InsigniaEstadoPago) y deja ver los huecos libres (usa disponibilidad). Botón "Nueva reserva". EstadoVacio si no hay cancha seleccionada o no hay reservas.

TAREA 2. src/components/reservagol/FormularioReserva.tsx (cliente) y src/app/reservas/nueva/page.tsx: cancha (selector de activas), cliente (selector de activos o enlace a crear uno), fecha (no anterior a hoy), hora de inicio y de fin, valor total. Validación en vivo (fin > inicio, fecha no pasada, valor > 0); al guardar, POST /api/reservas; si hay choque, muestra el mensaje de CHOQUE_HORARIO con el texto de la sección 12.1. Opcionalmente, antes de guardar muestra la disponibilidad de esa cancha ese día para elegir un hueco.

VERIFICACIÓN: pídeme que inicie sesión si lo necesitas. Crear una reserva; ver la agenda de esa cancha; intentar una reserva que solape (error de choque); crear una consecutiva (se permite); intentar una fecha pasada (error). Documenta.

AL TERMINAR:
- npm run build y npm test sin errores.
- Marca P07 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** crear una reserva y verla en la agenda; comprobar que un solape se rechaza y una consecutiva se permite.

**Commit sugerido:** `feat(interfaz): agenda de disponibilidad y creación de reservas`

---

## P08 · Detalle, cobro y aceptación del MVP

**Fase:** 5 y 6 · **Crea:** detalle con cobro y cancelación, `doc/ACEPTACION.md` · **Modifica:** `README.md`

````text
Antes de escribir código lee completos: doc/DICTAMEN.md, doc/PLAN_RESERVAGOL.md (secciones 5, 6.2, 8, 11, 12, 14, 15 y 16), doc/ESTADO_EJECUCION.md y los componentes existentes.

OBJETIVO: el detalle de la reserva con el cobro (abonos y estado de pago) y la cancelación, y el cierre del MVP con la aceptación.

TAREA 1. src/components/reservagol/PanelCobro.tsx y src/app/reservas/[id]/page.tsx (servidor): obtenerReserva (notFound si no existe). Encabezado con cancha, cliente, fecha, franja e InsigniaEstadoReserva. PanelCobro: valor total, abonado, saldo e InsigniaEstadoPago (pendiente/anticipo/pagado); campo para registrar un abono (POST /api/reservas/[id]/abonos; si excede el saldo, muestra ABONO_EXCEDE_TOTAL); lista de abonos. Botón "Cancelar reserva" si está activa (confirmación con el texto de la sección 12.1; POST /api/reservas/[id]/cancelar). Tras cada acción, router.refresh().

TAREA 2. Revisa el código contra las secciones 7, 8 y 15. Reporta y corrige en la bitácora: verificación de choque fuera de la transacción o que no bloquee las reservas de la cancha; franjas tratadas como cerradas (que hagan chocar 18-19 con 19-20); estado de pago guardado en vez de derivado; abono que supere el total aceptado; "hoy" con new Date() fuera de fechas.ts; montos con decimales; rutas sin exigirSesion; SQL concatenado; estado comunicado solo con color.

TAREA 3. Ejecuta npm test y npm run probar:flujo; corrige fallas en el código. Prepara la aceptación: db:limpiar --prueba; conserva los demo.

TAREA 4. Crea doc/ACEPTACION.md con la tabla A-01 a A-15 de la sección 16.3 (columnas: ID, acción, resultado esperado, resultado obtenido, evidencia, observación; las tres últimas vacías) y una nota de que A-15 es de la opcional (P09).

TAREA 5. Actualiza README.md: descripción; funcionalidades; requisitos; cómo correr en local (npm install, .env.local con los NOMBRES de las variables, db:migrar, db:demo, dev); scripts; estructura; una nota sobre el choque de horarios (franjas semiabiertas) y el estado de pago derivado; enlace a doc/PLAN_RESERVAGOL.md.

TAREA 6. Verifica que .env.local esté en .gitignore y que ningún archivo versionado tenga credenciales.

AL TERMINAR:
- npm run build y npm test sin errores.
- Crea doc/checkpoints/FASE_5_COMPLETADA.md (interfaz) y doc/checkpoints/FASE_6_COMPLETADA.md (revisión y pruebas).
- Marca P08 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen y recuérdame que A-01 a A-14 se ejecutan en el despliegue de Vercel.
````

**Verificación del estudiante:** registrar abonos y ver el estado pasar de pendiente a anticipo a pagado; cancelar una reserva y volver a reservar su franja. Hacer push y ejecutar A-01 a A-14 en Vercel.

**Commit sugerido:** `feat(interfaz): cobro con abonos, cancelación y aceptación del MVP`

---

## P09 · Opcionales: agenda de todas las canchas y resumen de cobros

**Fase:** 7 · **Requisito:** `doc/checkpoints/FASE_6_COMPLETADA.md` existe y `doc/ACEPTACION.md` está diligenciado

````text
Antes de escribir código lee completos: doc/DICTAMEN.md, doc/PLAN_RESERVAGOL.md (secciones 11.3, 16.3 (A-15) y 18), doc/ESTADO_EJECUCION.md y doc/checkpoints/FASE_6_COMPLETADA.md. Si FASE_6_COMPLETADA.md no existe, detente y avísame.

OBJETIVO: las dos mejoras opcionales.

TAREA 1. F7 · Agenda de todas las canchas:
- src/lib/datos/resumen.ts: agendaDelDia(fecha): las reservas activas de todas las canchas ese día con sus franjas. Reexporta en dataService.
- En /reservas/resumen (o un modo "todas" en la agenda), una vista de rejilla canchas × horas que marque ocupado/libre.

TAREA 2. F8 · Resumen de cobros:
- resumenCobros(desde, hasta): total cobrado (suma de abonos), número de reservas, y desglose por estado de pago (pendiente/anticipo/pagado) en el periodo. Reexporta en dataService.
- Ruta GET /api/reservas/resumen; tabla en /reservas/resumen con un selector de rango.

VERIFICACIÓN: pídeme que inicie sesión si lo necesitas. Con los datos demo: ver la agenda de todas las canchas de un día; ver el resumen de cobros del periodo (verifica a mano el total cobrado). Documenta.

AL TERMINAR:
- npm run build y npm test sin errores.
- Agrega a doc/ACEPTACION.md el resultado de A-15.
- Crea doc/checkpoints/FASE_7_COMPLETADA.md.
- Marca P09 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** ver la agenda de todas las canchas de un día y el resumen de cobros del periodo.

**Commit sugerido:** `feat(opcional): agenda de todas las canchas y resumen de cobros`

---

## Prompts auxiliares

### Corrección de un error

Reemplazar `[NN]` por el número del prompt y pegar el error completo donde se indica.

````text
Durante la ejecución del prompt P[NN] apareció este error:

[PEGAR AQUÍ EL ERROR COMPLETO]

Lee doc/DICTAMEN.md, doc/PLAN_RESERVAGOL.md, doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md. Encuentra la causa y corrígela sin salir del alcance de P[NN]. No modifiques pruebas ni scripts de prueba para que pasen; corrige el código que prueban. Ejecuta npm run build y npm test. Registra en la bitácora la causa, la corrección y los archivos modificados. Muéstrame un resumen.
````

### Reanudación de un prompt interrumpido

````text
La ejecución anterior del prompt P[NN] se interrumpió. Lee doc/ESTADO_EJECUCION.md, doc/DICTAMEN.md, doc/PLAN_RESERVAGOL.md y doc/PROMPTS_RESERVAGOL.md (sección P[NN]). Revisa qué archivos de P[NN] ya existen y cuáles faltan, y continúa desde la primera tarea incompleta sin rehacer lo terminado. Al final ejecuta npm run build y npm test, y actualiza la bitácora.
````

### Despliegue fallido en Vercel

````text
El despliegue en Vercel falló con este registro:

[PEGAR AQUÍ EL REGISTRO DEL BUILD DE VERCEL]

Lee doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md. Identifica la causa (error de compilación, variable de entorno faltante en Vercel, o diferencia entre local y producción). Si es de código, corrígelo y verifica con npm run build. Si es una variable de entorno, dime exactamente qué NOMBRE de variable falta y en qué entornos de Vercel agregarla, sin pedir ni mostrar valores. Registra la causa y la solución en la bitácora.
````
