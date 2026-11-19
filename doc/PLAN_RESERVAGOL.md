# ReservaGol · Plan técnico de implementación

> Sistema de Control de Reservas y Cobros para Canchas Sintéticas · versión técnica 1.0, derivada del plan funcional de Sebastián Ponce (segunda versión)
> Asignatura: Lógica y Programación (SIST0200) · Universidad Sergio Arboleda, Santa Marta · Docente: Jhonatan Castro Polo
> Stack: Next.js (App Router) + TypeScript + Tailwind CSS + Supabase Postgres · Despliegue en Vercel
> Ejecución: GitHub Copilot en modo Agente, con los prompts de `doc/PROMPTS_RESERVAGOL.md`

---

## Índice

0. [Cómo se usa este documento](#0-cómo-se-usa-este-documento)
1. [Punto de partida y conciliación](#1-punto-de-partida-y-conciliación)
2. [Alcance](#2-alcance)
3. [Acceso](#3-acceso)
4. [Estados](#4-estados)
5. [Reglas de negocio](#5-reglas-de-negocio)
6. [Casos de uso](#6-casos-de-uso)
7. [El choque de horarios](#7-el-choque-de-horarios)
8. [El estado del pago](#8-el-estado-del-pago)
9. [Modelo de datos](#9-modelo-de-datos)
10. [Arquitectura del código](#10-arquitectura-del-código)
11. [Contratos de API](#11-contratos-de-api)
12. [Pantallas](#12-pantallas)
13. [Identidad visual](#13-identidad-visual)
14. [Dinero, fechas y zona horaria](#14-dinero-fechas-y-zona-horaria)
15. [Seguridad e integridad](#15-seguridad-e-integridad)
16. [Pruebas](#16-pruebas)
17. [Plan de ejecución](#17-plan-de-ejecución)
18. [Funcionalidades opcionales](#18-funcionalidades-opcionales)
19. [Glosario](#19-glosario)

---

## 0. Cómo se usa este documento

Este plan es el documento rector del proyecto. Copilot lo lee antes de cada tarea y los prompts remiten a sus secciones por número. Si un prompt y este plan no coinciden, prevalece el plan.

El plan funcional de ReservaGol define las funcionalidades (reservas, cobros, clientes) y el stack, pero no detalla las reglas finas ni el modelo de datos. Este plan técnico las deriva del dominio de reservas: sobre todo el choque de horarios (que no se reserve una cancha ya ocupada en esa franja) y el estado del pago con anticipos. El primer prompt (P00) concilia: audita qué hay montado en el repositorio (el plan menciona que ya existe estructura `/src`, `/doc`, `/public`) y decide en cada paso si crear o adaptar.

| Archivo en el repositorio | Función |
|---|---|
| `doc/PLAN_RESERVAGOL.md` | Este documento |
| `doc/PROMPTS_RESERVAGOL.md` | Prompts en orden de ejecución |
| `doc/ESTADO_ACTUAL.md` | Radiografía del repositorio antes de empezar (lo crea P00) |
| `doc/DICTAMEN.md` | Qué existe, qué falta y qué se crea o adapta |
| `doc/ESTADO_EJECUCION.md` | Avance prompt por prompt |
| `doc/checkpoints/FASE_N_COMPLETADA.md` | Evidencia del cierre de cada fase |
| `.github/copilot-instructions.md` | Reglas permanentes que Copilot aplica en todas las conversaciones |

---

## 1. Punto de partida y conciliación

### 1.1 Lo que el proyecto necesita

- Proyecto Next.js con TypeScript (el plan lo nombra, con estructura `/src`, `/doc`, `/public`), desplegado en Vercel.
- Proyecto Supabase para la base de datos.
- Un login como puerta de acceso.

P00 verifica qué hay y el dictamen marca cada pieza como existe / falta / se crea. El plan es la meta; el camino se ajusta a lo que el repositorio tenga.

### 1.2 Lo que P00 verifica (y el dictamen resuelve)

| Aspecto | Qué decide |
|---|---|
| Si existe el proyecto Next.js con TypeScript y compila | Si hay base o hay que crearla |
| Si existe conexión a Supabase/Postgres | Si se usa o hay que crearla y conectarla |
| Si hay login | Si se envuelve (sin reescribir) o se agrega uno mínimo en P03 |
| Mecanismo de migraciones | Si existe se usa; si no, se crea `npm run db:migrar` |
| Versión de Tailwind | Define dónde se declaran los colores (sección 13) |
| Qué del dominio ya está construido (canchas, clientes, reservas, cobros) | Para adaptarlo en vez de rehacerlo |
| Si usa Vite además de Next (el plan nombra Vite y Vitest) | Vitest se usa para pruebas; el servidor es Next, no Vite. P00 aclara la configuración real |

### 1.3 Regla sobre el login

El plan funcional no incluye autenticación en el MVP. En el stack del curso la aplicación queda publicada en una URL de Vercel; dejarla abierta expondría las reservas y los cobros a cualquiera. Se usa un login como puerta única de acceso para el administrador de las canchas, sin roles. Los clientes del plan son datos que el administrador registra, no usuarios que inician sesión. Si P00 encuentra login, se envuelve con `lib/auth/sesion.ts` sin reescribirlo; si no, P03 agrega uno mínimo. En ambos casos, `/reservas/*` y `/api/reservas/*` quedan protegidas.

---

## 2. Alcance

### 2.1 Módulo mínimo (el MVP del plan funcional)

| ID | Funcionalidad (plan funcional) | Casos de uso | Prompts |
|---|---|---|---|
| F1 | Registrar canchas (soporte para la gestión de reservas) | CU-01 | P04, P05, P06 |
| F2 | Registrar clientes (nombre, contacto) | CU-02 | P04, P05, P07 |
| F3 | Crear una reserva (cancha, cliente, fecha, franja horaria), verificando disponibilidad | CU-03 | P02, P04, P05, P08 |
| F4 | Consultar disponibilidad y reservas por cancha y día | CU-04 | P04, P08 |
| F5 | Cancelar una reserva | CU-05 | P04, P08 |
| F6 | Controlar el cobro de la reserva (pendiente / anticipo / pagado) con registro de abonos | CU-06, CU-07 | P02, P04, P08 |

El plan nombra tres módulos (reservas, cobros, clientes). "Registrar canchas" se añade como soporte: sin canchas no hay qué reservar; el plan asume que existen. La verificación de disponibilidad (parte de la gestión de reservas del plan) es el corazón del MVP.

### 2.2 Funcionalidades opcionales

| ID | Funcionalidad | Prompts |
|---|---|---|
| F7 | Agenda del día: ver todas las canchas y sus franjas ocupadas en una fecha | P09 |
| F8 | Resumen de cobros: total cobrado, anticipos y pendiente por periodo | P09 |

Se construyen solo con la fase 5 cerrada. Del "fuera de alcance" del plan quedan excluidas la pasarela de pagos en línea y la gestión de torneos, ligas o estadísticas.

### 2.3 Fuera de alcance

Se mantiene la lista del plan funcional: pasarela de pagos bancarios en línea automatizada, y gestión de torneos, ligas o estadísticas avanzadas de jugadores.

### 2.4 Decisiones de alcance de esta versión técnica

| Decisión | Motivo |
|---|---|
| Los datos viven en Supabase Postgres | Para que persistan en producción; es el estándar del curso |
| Montos en pesos enteros | El peso colombiano no usa centavos; evita errores de redondeo en abonos y saldos |
| La franja horaria se guarda como hora de inicio y hora de fin; las franjas son semiabiertas `[inicio, fin)` | Dos reservas consecutivas (una termina a las 19:00, otra empieza a las 19:00) no chocan (sección 7) |
| Dos reservas chocan si son de la misma cancha, el mismo día, estado activo, y sus franjas se solapan | Es la regla central de un sistema de reservas (sección 7) |
| El estado del pago se deriva de lo abonado frente al total; no se edita a mano | pendiente / anticipo / pagado salen de comparar abonado con total (sección 8) |
| Una reserva cancelada libera su franja | Permite volver a reservar ese horario |
| Las reservas y los abonos no se editan ni se borran; una reserva se cancela, no se elimina | Son el registro de la operación |
| Una cancha o un cliente no se eliminan si tienen reservas; se pueden desactivar | Conserva el historial |

---

## 3. Acceso

| Actor | Acceso | Puede hacer |
|---|---|---|
| Administrador | Login como puerta | Registrar canchas y clientes, crear y cancelar reservas, registrar abonos, consultar disponibilidad |
| Sistema | Interno | Valida entradas, verifica la disponibilidad (choque de horarios), deriva el estado del pago |

| Ruta | Sin sesión | Con sesión |
|---|:-:|:-:|
| `/` | Redirige al login | Redirige a `/reservas` |
| `/reservas/*` | Redirige al login | Sí |
| `/api/reservas/*` | 401 | Sí |

---

## 4. Estados

### 4.1 Estado de la reserva (`reservas.estado`)

| Código | Etiqueta | Significado |
|---|---|---|
| `activa` | Activa | Reserva vigente; ocupa su franja |
| `cancelada` | Cancelada | Anulada; libera la franja |

### 4.2 Estado del pago (derivado, no se guarda como editable)

| Código | Etiqueta | Cuándo |
|---|---|---|
| `pendiente` | Pendiente | No se ha abonado nada |
| `anticipo` | Anticipo | Se ha abonado algo, pero menos del total |
| `pagado` | Pagado | Lo abonado cubre el total |

El estado del pago se calcula comparando la suma de los abonos con el valor total de la reserva (sección 8). No es un campo que se edite; cambia al registrar un abono.

---

## 5. Reglas de negocio

| ID | Regla | Origen | Dónde se aplica |
|---|---|---|---|
| RN-01 | Una reserva es de una cancha, un cliente, una fecha y una franja `[hora_inicio, hora_fin)` | Plan (gestión de reservas) | `lib/reglas/reserva.ts`; BD |
| RN-02 | La hora de fin debe ser posterior a la de inicio | Agregada | `lib/reglas/reserva.ts`; BD CHECK |
| RN-03 | No se puede crear una reserva que choque con otra activa de la misma cancha el mismo día (franjas solapadas) | Plan (disponibilidad) | `lib/reglas/horario.ts` + verificación transaccional (sección 7) |
| RN-04 | Dos franjas consecutivas no chocan (semiabiertas): una que termina a las H puede seguir con otra que empieza a las H | Derivada de RN-03 | `lib/reglas/horario.ts` |
| RN-05 | Una reserva nace `activa`; cancelarla la pasa a `cancelada` y libera su franja | Plan (cancelación) | Servicio; RN-03 solo cuenta activas |
| RN-06 | El valor total de la reserva es un entero mayor que 0 | Agregada | `lib/reglas/reserva.ts`; BD CHECK |
| RN-07 | Un abono es un entero mayor que 0; la suma de abonos no puede superar el total de la reserva | Plan (anticipo/abono) | `lib/reglas/pago.ts`; servicio `registrarAbono` |
| RN-08 | El estado del pago se deriva: sin abonos → pendiente; abonos < total → anticipo; abonos ≥ total → pagado | Plan (estados de cobro) | `lib/reglas/pago.ts` `estadoPago` |
| RN-09 | No se registran abonos a una reserva cancelada | Agregada | Servicio `registrarAbono` |
| RN-10 | El nombre del cliente es obligatorio; el contacto también | Plan (registro de clientes) | `lib/reglas/cliente.ts`; Zod; BD CHECK |
| RN-11 | El nombre de la cancha es único | Agregada | BD índice único |
| RN-12 | La fecha de la reserva no puede ser anterior a hoy | Agregada | `lib/reglas/reserva.ts` (con `hoyBogota()`) |
| RN-13 | Las reservas y los abonos son inmutables; una reserva se cancela, no se elimina; canchas y clientes se desactivan, no se eliminan | Agregada (2.4) | Servicio; BD `ON DELETE RESTRICT` |
| RN-14 | Solo se reserva sobre canchas activas y para clientes activos | Agregada | Servicio |

### 5.1 Casos límite

| Caso | Resultado |
|---|---|
| Reservar una franja idéntica a una activa | Rechazo (`CHOQUE_HORARIO`) |
| Reservar una franja que solapa parcialmente otra activa | Rechazo (`CHOQUE_HORARIO`) |
| Reservar justo después de otra (18-19 y 19-20) | Se permite (RN-04) |
| Reservar una franja que chocaba con una ya cancelada | Se permite (la cancelada no ocupa) |
| Hora de fin ≤ hora de inicio | Rechazo (`DATOS_INVALIDOS`) |
| Abono mayor al saldo pendiente | Rechazo (`ABONO_EXCEDE_TOTAL`) |
| Abono que completa exactamente el total | La reserva queda `pagado` |
| Registrar un abono en una reserva cancelada | Rechazo (`RESERVA_CANCELADA`) |
| Reservar para una fecha pasada | Rechazo (`FECHA_INVALIDA`) |

---

## 6. Casos de uso

| ID | Entrada | Precondición | Efecto | Errores posibles |
|---|---|---|---|---|
| CU-01 Registrar cancha | nombre, (precio por hora opcional) | nombre no repetido | Cancha creada, activa | `DATOS_INVALIDOS`, `CANCHA_DUPLICADA` |
| CU-02 Registrar cliente | nombre, contacto | — | Cliente creado | `DATOS_INVALIDOS` |
| CU-03 Crear reserva | cancha, cliente, fecha, hora inicio, hora fin, valor total | cancha y cliente activos; fecha ≥ hoy; franja libre | Reserva `activa` (pago pendiente) | `CANCHA_NO_ENCONTRADA`, `CLIENTE_NO_ENCONTRADO`, `FECHA_INVALIDA`, `CHOQUE_HORARIO`, `DATOS_INVALIDOS` |
| CU-04 Consultar disponibilidad | cancha, fecha | — | Reservas activas de esa cancha ese día, con sus franjas; franjas libres | `CANCHA_NO_ENCONTRADA` |
| CU-05 Cancelar reserva | reserva | la reserva está activa | Reserva `cancelada`; libera la franja | `RESERVA_NO_ENCONTRADA`, `RESERVA_CANCELADA` |
| CU-06 Registrar abono | reserva, monto | la reserva está activa; monto ≤ saldo | Abono registrado; estado del pago recalculado | `RESERVA_NO_ENCONTRADA`, `RESERVA_CANCELADA`, `ABONO_EXCEDE_TOTAL`, `DATOS_INVALIDOS` |
| CU-07 Ver estado de cobro | reserva | la reserva existe | Total, abonado, saldo y estado (pendiente/anticipo/pagado) | `RESERVA_NO_ENCONTRADA` |
| CU-08 Desactivar cancha o cliente | cancha/cliente | existe | Inactivo (sale de las listas activas) | `CANCHA_NO_ENCONTRADA`, `CLIENTE_NO_ENCONTRADO` |

### 6.1 Secuencia de CU-03 (crear reserva, con verificación de choque)

Todo ocurre dentro de `conTransaccion`, con la cancha bloqueada para evitar dobles reservas simultáneas:

1. `validarReserva(d)` (fecha ≥ hoy; hora fin > hora inicio; valor total > 0).
2. Verificar que la cancha y el cliente existen y están activos (`CANCHA_NO_ENCONTRADA`, `CLIENTE_NO_ENCONTRADO`).
3. Bloquear las reservas activas de esa cancha y fecha (`SELECT ... FOR UPDATE`).
4. Comprobar que la nueva franja no se solapa con ninguna activa (`CHOQUE_HORARIO`, sección 7).
5. Insertar la reserva en estado `activa`.
6. Confirmar y devolver la reserva (pago pendiente).

```ts
export async function crearReserva(d: DatosReserva): Promise<Reserva> {
  validarReserva(d);  // RN-02, RN-06, RN-12
  return conTransaccion(async (tx) => {
    await exigirCanchaActiva(tx, d.canchaId);     // CANCHA_NO_ENCONTRADA (RN-14)
    await exigirClienteActivo(tx, d.clienteId);   // CLIENTE_NO_ENCONTRADO (RN-14)
    const activas = await reservasActivasDeCanchaYDia(tx, d.canchaId, d.fecha);  // FOR UPDATE
    for (const r of activas) {
      if (haySolape(d.horaInicio, d.horaFin, r.horaInicio, r.horaFin)) {        // RN-03, RN-04
        throw new ErrorDeNegocio('CHOQUE_HORARIO', undefined, { conflicto: r.id });
      }
    }
    return insertarReserva(tx, { ...d, estado: 'activa' });   // RN-05
  });
}
```

### 6.2 Secuencia de CU-06 (registrar abono)

1. Bloquear la reserva; si no existe, `RESERVA_NO_ENCONTRADA`.
2. Si está cancelada, `RESERVA_CANCELADA` (RN-09).
3. Validar el monto (entero > 0).
4. Calcular lo ya abonado; si `abonado + monto > total`, `ABONO_EXCEDE_TOTAL` (RN-07).
5. Insertar el abono.
6. Devolver el estado de cobro recalculado (total, abonado, saldo, estado derivado).

---

## 7. El choque de horarios

Es la regla central del sistema y la que más fácil se implementa mal. Las franjas son intervalos semiabiertos `[inicio, fin)`: incluyen el inicio pero no el fin, de modo que una reserva de 18:00 a 19:00 y otra de 19:00 a 20:00 no se pisan.

```ts
// lib/reglas/horario.ts
// Las horas se comparan como texto 'HH:MM' (orden lexicográfico = orden cronológico con ceros a la izquierda).
export function haySolape(aInicio: string, aFin: string, bInicio: string, bFin: string): boolean {
  return aInicio < bFin && bInicio < aFin;   // dos intervalos [a) y [b) se solapan
}

export function finPosteriorAInicio(inicio: string, fin: string): boolean {
  return fin > inicio;   // RN-02
}
```

Dos reservas de la misma cancha y el mismo día chocan si ambas están activas y `haySolape` es verdadero. Ejemplos verificables:

| Franja A | Franja B | ¿Choca? |
|---|---|---|
| 18:00-19:00 | 18:00-19:00 | sí (idéntica) |
| 18:00-19:00 | 18:30-19:30 | sí (parcial) |
| 18:00-20:00 | 18:30-19:00 | sí (contenida) |
| 18:00-19:00 | 19:00-20:00 | no (consecutivas, RN-04) |
| 18:00-19:00 | 20:00-21:00 | no (separadas) |

La verificación se hace dentro de la transacción de creación, con las reservas activas de la cancha bloqueadas, para que dos reservas simultáneas del mismo horario no se cuelen (una tendrá que esperar y verá a la otra ya insertada). Las horas se guardan como texto `HH:MM` y se comparan como texto, lo que equivale al orden cronológico.

---

## 8. El estado del pago

Todo en pesos enteros. El estado se deriva de la suma de abonos frente al valor total; no se guarda como campo editable.

```ts
// lib/reglas/pago.ts
export type EstadoPago = 'pendiente' | 'anticipo' | 'pagado';

export function estadoPago(total: number, abonado: number): EstadoPago {
  if (abonado <= 0) return 'pendiente';   // RN-08
  if (abonado >= total) return 'pagado';
  return 'anticipo';
}

export function saldo(total: number, abonado: number): number {
  return Math.max(0, total - abonado);
}

export function abonoValido(total: number, abonadoActual: number, monto: number): boolean {
  return monto > 0 && abonadoActual + monto <= total;   // RN-07
}
```

Ejemplos (total $50.000):

| Abonado | Estado | Saldo |
|---|---|---|
| 0 | pendiente | 50.000 |
| 20.000 | anticipo | 30.000 |
| 50.000 | pagado | 0 |

Un abono que haría superar el total se rechaza (`ABONO_EXCEDE_TOTAL`). El estado se recalcula al leer la reserva o tras registrar un abono, sumando los abonos guardados.

---

## 9. Modelo de datos

### 9.1 Relaciones

```text
canchas 1 ──── N reservas
clientes 1 ─── N reservas
reservas 1 ─── N abonos

v_reservas = reservas + nombre de cancha y cliente + abonado (suma de abonos) + estado de pago derivado
```

Las migraciones se guardan en `supabase/migrations/`. En este documento se nombran M1 y M2. P00 confirma la numeración.

### 9.2 M1 · Tablas

```sql
-- M1: tablas de ReservaGol

CREATE TABLE IF NOT EXISTS canchas (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      VARCHAR(100)  NOT NULL,
  precio_hora INTEGER,                                 -- opcional; pesos enteros
  activa      BOOLEAN       NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT canchas_nombre_minimo CHECK (char_length(btrim(nombre)) >= 1),
  CONSTRAINT canchas_precio_ok CHECK (precio_hora IS NULL OR precio_hora > 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_canchas_nombre ON canchas (lower(btrim(nombre)));  -- RN-11

CREATE TABLE IF NOT EXISTS clientes (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      VARCHAR(120)  NOT NULL,
  contacto    VARCHAR(120)  NOT NULL,
  activo      BOOLEAN       NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT clientes_nombre_minimo   CHECK (char_length(btrim(nombre)) >= 1),    -- RN-10
  CONSTRAINT clientes_contacto_minimo CHECK (char_length(btrim(contacto)) >= 1)   -- RN-10
);

CREATE TABLE IF NOT EXISTS reservas (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  cancha_id    UUID          NOT NULL REFERENCES canchas(id) ON DELETE RESTRICT,   -- RN-13
  cliente_id   UUID          NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,  -- RN-13
  fecha        DATE          NOT NULL,
  hora_inicio  TIME          NOT NULL,
  hora_fin     TIME          NOT NULL,
  valor_total  INTEGER       NOT NULL,                 -- pesos enteros (RN-06)
  estado       VARCHAR(10)   NOT NULL DEFAULT 'activa',
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT reservas_horas_ok    CHECK (hora_fin > hora_inicio),                  -- RN-02
  CONSTRAINT reservas_valor_ok    CHECK (valor_total > 0),                         -- RN-06
  CONSTRAINT reservas_estado_ok   CHECK (estado IN ('activa', 'cancelada'))        -- RN-05
);
CREATE INDEX IF NOT EXISTS idx_reservas_cancha_fecha ON reservas (cancha_id, fecha, estado);
CREATE INDEX IF NOT EXISTS idx_reservas_cliente ON reservas (cliente_id);
-- Evita en la base dos reservas activas idénticas (misma cancha, día y hora de inicio);
-- el solapamiento parcial lo controla el servidor en la transacción (sección 7).
CREATE UNIQUE INDEX IF NOT EXISTS ux_reservas_slot_activo
  ON reservas (cancha_id, fecha, hora_inicio) WHERE estado = 'activa';

CREATE TABLE IF NOT EXISTS abonos (
  id          BIGSERIAL     PRIMARY KEY,
  reserva_id  UUID          NOT NULL REFERENCES reservas(id) ON DELETE RESTRICT,   -- RN-13
  monto       INTEGER       NOT NULL,
  fecha       DATE          NOT NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT abonos_monto_positivo CHECK (monto > 0)   -- RN-07
);
CREATE INDEX IF NOT EXISTS idx_abonos_reserva ON abonos (reserva_id);

CREATE OR REPLACE FUNCTION reservagol_actualizar_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reservas_updated_at ON reservas;
CREATE TRIGGER trg_reservas_updated_at BEFORE UPDATE ON reservas
  FOR EACH ROW EXECUTE FUNCTION reservagol_actualizar_updated_at();
```

### 9.3 M2 · Vista de reservas y seguridad

```sql
-- M2: vista con abonado y estado de pago derivado, y cierre de acceso público

CREATE OR REPLACE VIEW v_reservas
WITH (security_invoker = true) AS
SELECT
  r.*,
  c.nombre  AS cancha_nombre,
  cl.nombre AS cliente_nombre,
  cl.contacto AS cliente_contacto,
  COALESCE((SELECT SUM(a.monto) FROM abonos a WHERE a.reserva_id = r.id), 0) AS abonado  -- sección 8
FROM reservas r
JOIN canchas c   ON c.id = r.cancha_id
JOIN clientes cl ON cl.id = r.cliente_id;

ALTER TABLE canchas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE abonos   ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON canchas, clientes, reservas, abonos FROM anon, authenticated;
REVOKE ALL ON v_reservas FROM anon, authenticated;
```

El estado de pago (pendiente/anticipo/pagado) no se guarda: se calcula en el servidor con `estadoPago(valor_total, abonado)` a partir del `abonado` que trae la vista. Las tablas quedan sin políticas: la clave pública de Supabase no puede leerlas ni escribirlas; todo el acceso ocurre en el servidor con la conexión directa a Postgres.

### 9.4 Traducción de errores de la base de datos

| Código Postgres | Restricción | Código de negocio |
|---|---|---|
| `23505` | `ux_canchas_nombre` | `CANCHA_DUPLICADA` |
| `23505` | `ux_reservas_slot_activo` | `CHOQUE_HORARIO` (respaldo del control transaccional) |
| `23503` | llaves foráneas (`ON DELETE RESTRICT`) | `TIENE_DEPENDENCIAS` |
| `23514` | `reservas_horas_ok` | `DATOS_INVALIDOS` (fin ≤ inicio) |
| `23514` | cualquier otro CHECK | `DATOS_INVALIDOS` |
| Otro | | `ERROR_INTERNO` (se registra en consola, no se muestra al usuario) |

---

## 10. Arquitectura del código

### 10.1 Capas

```text
Pantallas (app/reservas/*) ──┐
                             ├──► Rutas API (app/api/reservas/*) ──► lib/dataService.ts ──► lib/datos/* ──► Postgres
Componentes (components/*) ──┘          │                               │
                                        └──── lib/validacion (Zod)      └──── lib/reglas/* (funciones puras)
```

El plan usa `/src`, así que `lib`, `components` y `app` cuelgan de `src/`.

- `lib/reglas/`: reglas puras (solape de horarios, estado del pago, validaciones). No importan datos, ni red, ni el reloj (salvo `fechas.ts`). Se prueban con Vitest. El solape es la pieza más probada.
- `lib/datos/`: consultas SQL y casos de uso con transacciones. Solo este directorio importa `lib/db/conexion.ts`.
- `lib/dataService.ts`: fachada única.
- Rutas API: validan con Zod, verifican sesión, llaman a `dataService`, responden con `lib/http/respuestas.ts`.

### 10.2 Árbol de archivos nuevos (bajo `src/`, salvo doc/ y supabase/)

```text
.github/copilot-instructions.md
doc/ESTADO_ACTUAL.md
doc/DICTAMEN.md
doc/ESTADO_EJECUCION.md
doc/checkpoints/FASE_N_COMPLETADA.md

supabase/migrations/NNNN_reservagol_tablas.sql
supabase/migrations/NNNN_reservagol_vista_seguridad.sql

scripts/migrar.mjs                 (solo si no existe mecanismo de migraciones)
scripts/verificar-bd.mjs
scripts/probar-flujo.ts
scripts/limpiar-prueba.mjs
scripts/cargar-demo.ts

src/lib/config/reservagol.ts
src/lib/reglas/errores.ts
src/lib/reglas/fechas.ts
src/lib/reglas/horario.ts
src/lib/reglas/reserva.ts
src/lib/reglas/pago.ts
src/lib/reglas/cliente.ts
src/lib/validacion/esquemas.ts
src/lib/db/conexion.ts
src/lib/auth/sesion.ts
src/lib/http/respuestas.ts
src/lib/formato.ts
src/lib/datos/tipos.ts
src/lib/datos/canchas.ts
src/lib/datos/clientes.ts
src/lib/datos/reservas.ts
src/lib/datos/resumen.ts           (opcional)
src/lib/dataService.ts

src/tests/reglas/ayudas.ts
src/tests/reglas/horario.test.ts
src/tests/reglas/pago.test.ts
src/tests/reglas/reserva.test.ts
(o la carpeta de tests que el repo use)
vitest.config.ts

src/app/page.tsx                                  (redirige a /reservas)
src/app/reservas/layout.tsx
src/app/reservas/page.tsx                         (agenda / disponibilidad)
src/app/reservas/nueva/page.tsx
src/app/reservas/[id]/page.tsx                    (detalle + cobro)
src/app/reservas/canchas/page.tsx
src/app/reservas/clientes/page.tsx
src/app/reservas/resumen/page.tsx                 (opcional)

src/app/api/reservas/sesion/route.ts
src/app/api/reservas/canchas/route.ts
src/app/api/reservas/clientes/route.ts
src/app/api/reservas/route.ts                     (GET por cancha+fecha, POST crear)
src/app/api/reservas/[id]/route.ts                (GET detalle)
src/app/api/reservas/[id]/cancelar/route.ts
src/app/api/reservas/[id]/abonos/route.ts         (POST registrar abono)
src/app/api/reservas/disponibilidad/route.ts      (GET cancha+fecha)
src/app/api/reservas/resumen/route.ts             (opcional)

src/components/ui/*  (Boton, Campo, Selector, Tarjeta, Insignia, Aviso, Modal, EstadoVacio)
src/components/reservagol/NavegacionReservaGol.tsx
src/components/reservagol/InsigniaEstadoReserva.tsx
src/components/reservagol/InsigniaEstadoPago.tsx
src/components/reservagol/FormularioCancha.tsx
src/components/reservagol/FormularioCliente.tsx
src/components/reservagol/FormularioReserva.tsx
src/components/reservagol/AgendaDia.tsx
src/components/reservagol/TablaReservas.tsx
src/components/reservagol/PanelCobro.tsx
src/components/reservagol/TablaResumen.tsx         (opcional)
```

### 10.3 Responsabilidades y prohibiciones

| Regla de código | Motivo |
|---|---|
| Identificadores, comentarios y mensajes en español | Coherencia con el dominio |
| El solape de horarios y el estado del pago viven en `lib/reglas/` y se prueban | Núcleo verificable |
| La verificación de choque se hace en la transacción, con las reservas activas de la cancha bloqueadas | Evita dobles reservas simultáneas (sección 7) |
| El estado del pago se deriva de los abonos; no se guarda | Sección 8 |
| Las horas como texto `HH:MM`; las fechas como texto `YYYY-MM-DD` | Comparación simple y sin errores de zona |
| Montos en pesos enteros; nunca decimales | Sección 14 |
| Solo `lib/datos/` importa `lib/db/conexion.ts` | Las rutas no escriben SQL |
| Las rutas solo importan datos desde `lib/dataService.ts` | Fachada única |
| Las rutas `/api/reservas/*` llaman `exigirSesion()` como primera instrucción | Sección 3 |
| `params` de rutas dinámicas se obtiene con `await params` | Next.js entrega `params` como Promise |
| Respetar la estructura `/src` del repo | Ya definida |

### 10.4 Configuración

```ts
// src/lib/config/reservagol.ts
export const HORA_APERTURA = '06:00';   // referencia para la agenda
export const HORA_CIERRE = '23:00';
export const ZONA_HORARIA = 'America/Bogota';
export const LIMITE_LISTADO = 500;
```

### 10.5 Firmas de las reglas puras

```ts
// src/lib/reglas/errores.ts
export type CodigoError =
  | 'DATOS_INVALIDOS' | 'NO_AUTORIZADO'
  | 'CANCHA_DUPLICADA' | 'CANCHA_NO_ENCONTRADA'
  | 'CLIENTE_NO_ENCONTRADO'
  | 'RESERVA_NO_ENCONTRADA' | 'CHOQUE_HORARIO' | 'FECHA_INVALIDA' | 'RESERVA_CANCELADA'
  | 'ABONO_EXCEDE_TOTAL' | 'TIENE_DEPENDENCIAS' | 'ERROR_INTERNO';
export const MENSAJES: Record<CodigoError, string>;     // sección 11.2
export const ESTADO_HTTP: Record<CodigoError, number>;  // sección 11.2
export class ErrorDeNegocio extends Error {
  constructor(public codigo: CodigoError, mensaje?: string, public detalles?: unknown);
}

// src/lib/reglas/fechas.ts
export function hoyBogota(reloj?: Date): string;                 // 'YYYY-MM-DD'
export function esFechaValida(fecha: string): boolean;
export function esHoraValida(hora: string): boolean;            // 'HH:MM' 00:00–23:59
export function esFechaPasada(fecha: string, hoy: string): boolean;

// src/lib/reglas/horario.ts
export function haySolape(aInicio: string, aFin: string, bInicio: string, bFin: string): boolean;  // RN-03, RN-04
export function finPosteriorAInicio(inicio: string, fin: string): boolean;  // RN-02

// src/lib/reglas/reserva.ts
export function validarReserva(d: {
  fecha: string; horaInicio: string; horaFin: string; valorTotal: number;
}, hoy: string): void;  // fecha no pasada (FECHA_INVALIDA); horas válidas; fin>inicio; valorTotal>0 (DATOS_INVALIDOS)

// src/lib/reglas/pago.ts
export type EstadoPago = 'pendiente' | 'anticipo' | 'pagado';
export function estadoPago(total: number, abonado: number): EstadoPago;   // RN-08
export function saldo(total: number, abonado: number): number;
export function abonoValido(total: number, abonadoActual: number, monto: number): boolean;  // RN-07

// src/lib/reglas/cliente.ts
export function validarCliente(d: { nombre: string; contacto: string }): void;  // no vacíos (RN-10)
```

### 10.6 Firmas de `dataService`

```ts
// Sesión
obtenerSesion(): Promise<{ email: string } | null>

// Canchas y clientes
listarCanchas(f?: { incluirInactivas?: boolean }): Promise<Cancha[]>
crearCancha(d: DatosCancha): Promise<{ id: string }>
desactivarCancha(id: string): Promise<void>
listarClientes(f?: { incluirInactivos?: boolean }): Promise<Cliente[]>
crearCliente(d: DatosCliente): Promise<{ id: string }>
desactivarCliente(id: string): Promise<void>

// Reservas
crearReserva(d: DatosReserva): Promise<Reserva>                        // CU-03, verifica choque
disponibilidad(canchaId: string, fecha: string): Promise<{ ocupadas: Franja[] }>  // CU-04
obtenerReserva(id: string): Promise<ReservaConCobro>                   // detalle + cobro
cancelarReserva(id: string): Promise<Reserva>                         // CU-05
registrarAbono(id: string, monto: number): Promise<Cobro>             // CU-06
listarReservas(f?: { canchaId?: string; fecha?: string; estado?: EstadoReserva }): Promise<Reserva[]>

// Resumen (opcional)
agendaDelDia(fecha: string): Promise<AgendaDia>                        // F7
resumenCobros(desde: string, hasta: string): Promise<ResumenCobros>   // F8
```

Tipos (`src/lib/datos/tipos.ts`): `Cancha { id, nombre, precioHora }`; `Cliente { id, nombre, contacto }`; `Franja { horaInicio, horaFin }`; `Reserva { id, canchaId, canchaNombre, clienteId, clienteNombre, fecha, horaInicio, horaFin, valorTotal, estado, abonado, estadoPago, saldo }`; `ReservaConCobro`, `Cobro { total, abonado, saldo, estadoPago, abonos: Abono[] }`; `DatosCancha`, `DatosCliente`, `DatosReserva`, `AgendaDia`, `ResumenCobros`.

### 10.7 Conexión y transacciones

```ts
// src/lib/db/conexion.ts
import { Pool, types, type PoolClient } from 'pg';

types.setTypeParser(1082, (v) => v);                 // DATE → 'YYYY-MM-DD'
types.setTypeParser(1083, (v) => (v as string).slice(0, 5));  // TIME → 'HH:MM'
types.setTypeParser(1114, (v) => v);                 // TIMESTAMP → texto
types.setTypeParser(1184, (v) => v);                 // TIMESTAMPTZ → texto
types.setTypeParser(20, (v) => parseInt(v, 10));     // BIGINT (ids, COUNT, SUM) → number

const globalParaPool = globalThis as unknown as { poolReservaGol?: Pool };

export const pool = globalParaPool.poolReservaGol ?? new Pool({
  connectionString: process.env.DATABASE_URL,        // el nombre real lo confirma P00
  ssl: { rejectUnauthorized: false },
  max: 3,
  idleTimeoutMillis: 10_000,
});
if (process.env.NODE_ENV !== 'production') globalParaPool.poolReservaGol = pool;

export async function consultar<T>(sql: string, valores: unknown[] = []): Promise<T[]> { /* pool.query */ }
export async function conTransaccion<T>(trabajo: (tx: PoolClient) => Promise<T>): Promise<T> { /* BEGIN/COMMIT/ROLLBACK */ }
```

El parser de `TIME` recorta a `HH:MM` (Postgres devuelve `HH:MM:SS`), para que las horas se comparen como texto en el formato que usa el dominio. `SUM(monto)` devuelve `BIGINT`; el parser lo pasa a número.

---

## 11. Contratos de API

### 11.1 Formato de respuesta

```json
{ "ok": true, "datos": { } }
```

```json
{ "ok": false, "error": { "codigo": "CHOQUE_HORARIO", "mensaje": "Esa cancha ya está reservada en ese horario.", "detalles": null } }
```

Todas las respuestas llevan `Cache-Control: no-store`.

### 11.2 Códigos de error

| Código | HTTP | Mensaje para el usuario |
|---|---|---|
| `DATOS_INVALIDOS` | 400 | Revise los datos ingresados. |
| `NO_AUTORIZADO` | 401 | Debe iniciar sesión. |
| `CANCHA_DUPLICADA` | 409 | Ya existe una cancha con ese nombre. |
| `CANCHA_NO_ENCONTRADA` | 404 | La cancha no existe. |
| `CLIENTE_NO_ENCONTRADO` | 404 | El cliente no existe. |
| `RESERVA_NO_ENCONTRADA` | 404 | La reserva no existe. |
| `CHOQUE_HORARIO` | 409 | Esa cancha ya está reservada en ese horario. |
| `FECHA_INVALIDA` | 422 | No se puede reservar en una fecha pasada. |
| `RESERVA_CANCELADA` | 409 | La reserva está cancelada. |
| `ABONO_EXCEDE_TOTAL` | 409 | El abono supera el saldo pendiente de la reserva. |
| `TIENE_DEPENDENCIAS` | 409 | No se puede eliminar: tiene reservas asociadas. |
| `ERROR_INTERNO` | 500 | Ocurrió un error inesperado. Intente de nuevo. |

### 11.3 Endpoints (todos requieren sesión)

| Método y ruta | Cuerpo o parámetros | Respuesta `datos` |
|---|---|---|
| `GET /api/reservas/sesion` | | `{ email }` |
| `GET /api/reservas/canchas?incluirInactivas=` | | `Cancha[]` |
| `POST /api/reservas/canchas` | `{ nombre, precioHora? }` | `{ id }` (201) |
| `GET /api/reservas/clientes?incluirInactivos=` | | `Cliente[]` |
| `POST /api/reservas/clientes` | `{ nombre, contacto }` | `{ id }` (201) |
| `GET /api/reservas/disponibilidad?canchaId=&fecha=` | | `{ ocupadas: Franja[] }` |
| `GET /api/reservas?canchaId=&fecha=&estado=` | | `Reserva[]` |
| `POST /api/reservas` | `{ canchaId, clienteId, fecha, horaInicio, horaFin, valorTotal }` | `Reserva` (201) |
| `GET /api/reservas/[id]` | | `ReservaConCobro` |
| `POST /api/reservas/[id]/cancelar` | | `Reserva` |
| `POST /api/reservas/[id]/abonos` | `{ monto }` | `Cobro` (201) |
| `GET /api/reservas/resumen?desde=&hasta=` | | `ResumenCobros` (opcional) |

### 11.4 Esquemas Zod (`src/lib/validacion/esquemas.ts`)

| Esquema | Reglas |
|---|---|
| `esquemaCancha` | nombre (1 a 100), precioHora entero ≥ 1 opcional |
| `esquemaCliente` | nombre (1 a 120), contacto (1 a 120) |
| `esquemaReserva` | canchaId uuid, clienteId uuid, fecha (fecha válida), horaInicio y horaFin (`HH:MM`), valorTotal entero ≥ 1 |
| `esquemaAbono` | monto entero ≥ 1 |
| `esquemaDisponibilidad` | canchaId uuid, fecha válida |
| `esquemaFiltrosReservas` | canchaId, fecha, estado opcionales |

La fecha no pasada, fin > inicio y el choque de horarios se verifican en `lib/reglas/` y en el servicio (el choque necesita la base); la base refuerza fin > inicio con un CHECK.

---

## 12. Pantallas

| Ruta | Contenido |
|---|---|
| `/` | Redirige a `/reservas`. |
| Layout `/reservas` | Verifica la sesión; sin sesión redirige al login. Barra con "ReservaGol", navegación (Agenda, Canchas, Clientes; Resumen cuando esté activo), y cerrar sesión. Mobile-First (se usa en el celular en la cancha). |
| `/reservas` · Agenda | Selector de cancha y fecha (por defecto hoy). `AgendaDia`: las franjas del día para esa cancha, mostrando las ocupadas (cliente y horario, con `InsigniaEstadoPago`) y los huecos libres. Botón "Nueva reserva". |
| `/reservas/nueva` · Nueva reserva | `FormularioReserva`: cancha (selector de activas), cliente (selector de activos, o enlace a crear uno), fecha (no anterior a hoy), hora de inicio y de fin, valor total. Antes de guardar puede mostrar la disponibilidad de esa cancha ese día. Al guardar, si hay choque muestra el mensaje de `CHOQUE_HORARIO`. |
| `/reservas/[id]` · Detalle y cobro | Encabezado con cancha, cliente, fecha, franja y `InsigniaEstadoReserva`. `PanelCobro`: valor total, abonado, saldo y `InsigniaEstadoPago` (pendiente/anticipo/pagado); campo para registrar un abono (rechaza si excede el saldo); lista de abonos. Botón "Cancelar reserva" (si está activa, con confirmación). |
| `/reservas/canchas` · Canchas | `FormularioCancha` (nombre, precio por hora opcional) y lista de canchas con su estado; acción de desactivar. Nombre duplicado muestra el mensaje. |
| `/reservas/clientes` · Clientes | `FormularioCliente` (nombre, contacto) y lista de clientes; acción de desactivar. |
| `/reservas/resumen` · Resumen (opcional) | Agenda de todas las canchas en un día, y resumen de cobros del periodo (cobrado, anticipos, pendiente). |

### 12.1 Textos fijos

Choque de horario:

> La cancha {cancha} ya tiene una reserva de {inicio} a {fin} ese día. Elige otro horario.

Confirmación de cancelación:

> Cancelar la reserva de {cliente} el {fecha} de {inicio} a {fin}. El horario quedará libre.

---

## 13. Identidad visual

| Token | Valor | Uso |
|---|---|---|
| `--color-primario` | `#1E8449` | Verde cancha: botones principales, barra superior |
| `--color-primario-suave` | `#E4F2EA` | Fondos de selección, hover |
| `--color-activa` | `#2F7D4F` | Reserva activa |
| `--color-cancelada` | `#5B6770` | Reserva cancelada |
| `--color-pendiente` | `#B83232` | Pago pendiente |
| `--color-anticipo` | `#B7791F` | Pago con anticipo |
| `--color-pagado` | `#2F7D4F` | Pago completo |
| `--color-fondo` | `#F4F8F5` | Fondo de página |
| `--color-superficie` | `#FFFFFF` | Tarjetas |
| `--color-texto` | `#1F2933` | Texto principal |
| `--color-texto-suave` | `#52606D` | Texto secundario |
| `--color-borde` | `#D9E2DC` | Bordes y divisores |

Los tokens se agregan a `globals.css` sin borrar estilos existentes. Si el repo ya tiene paleta, se respeta la suya.

Criterios: Mobile-First (el administrador reserva desde el celular); la agenda del día con las franjas ocupadas y libres bien diferenciadas; montos con fuente tabular y `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })`; las horas en formato `HH:MM`; el estado de la reserva y del pago con color y texto (nunca solo color); bordes redondeados de 8 px; sin emojis; tarjetas apiladas en móvil.

---

## 14. Dinero, fechas y zona horaria

| Regla | Implementación |
|---|---|
| Montos | Pesos enteros (`INTEGER`); sin centavos |
| Presentación de montos | `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })` |
| Fechas | Texto `YYYY-MM-DD`; "hoy" con `hoyBogota()`; una reserva no puede ser para una fecha pasada (RN-12) |
| Horas | Texto `HH:MM`; se comparan como texto (orden cronológico); el parser de `pg` recorta `TIME` a `HH:MM` |
| Lectura desde BD | Parsers de `pg` devuelven texto para fechas, horas y marcas de tiempo (sección 10.7) |

Vercel corre en UTC; Colombia es UTC-5 sin horario de verano. "Hoy" (para rechazar fechas pasadas) usa Bogotá. Las horas no dependen de zona porque se guardan y comparan como texto `HH:MM`.

---

## 15. Seguridad e integridad

| Medida | Detalle |
|---|---|
| Acceso solo con sesión | Login como puerta y `exigirSesion()` en cada ruta de `/api/reservas` |
| Base de datos cerrada al público | RLS activo sin políticas y permisos revocados a `anon` y `authenticated` |
| Sin dobles reservas | La verificación de choque se hace en una transacción con las reservas activas de la cancha bloqueadas; además, un índice único parcial impide dos reservas activas con la misma cancha, fecha y hora de inicio (sección 7, 9.2) |
| Estado del pago derivado | Se calcula de los abonos; no hay un campo que pueda contradecir lo abonado |
| Abonos acotados | Un abono no puede superar el saldo; no se abona a una reserva cancelada |
| Datos inmutables | Reservas y abonos no se editan ni se borran; una reserva se cancela; canchas y clientes se desactivan |
| Validación en tres puntos | Formulario (Zod y reglas), API (Zod y reglas) y base (CHECK, UNIQUE, llaves foráneas) |
| SQL parametrizado | Ningún valor se concatena |
| Errores internos | Se registran con `console.error`; el usuario recibe `ERROR_INTERNO` sin detalles técnicos |

---

## 16. Pruebas

### 16.1 Pruebas unitarias de reglas (Vitest)

Fecha de referencia: `hoy = '2026-06-15'`. El solape de horarios es el centro; se prueba a fondo.

| ID | Función | Entrada | Resultado esperado |
|---|---|---|---|
| T-01 | `haySolape` | 18:00-19:00, 18:00-19:00 | `true` (idéntica) |
| T-02 | `haySolape` | 18:00-19:00, 18:30-19:30 | `true` (parcial) |
| T-03 | `haySolape` | 18:00-20:00, 18:30-19:00 | `true` (contenida) |
| T-04 | `haySolape` | 18:00-19:00, 19:00-20:00 | `false` (consecutivas, RN-04) |
| T-05 | `haySolape` | 18:00-19:00, 20:00-21:00 | `false` (separadas) |
| T-06 | `haySolape` | 18:00-19:00, 17:00-18:00 | `false` (pega antes) |
| T-07 | `finPosteriorAInicio` | 18:00, 19:00 | `true` |
| T-08 | `finPosteriorAInicio` | 19:00, 18:00 | `false` |
| T-09 | `finPosteriorAInicio` | 18:00, 18:00 | `false` |
| T-10 | `estadoPago` | total 50000, abonado 0 | `pendiente` |
| T-11 | `estadoPago` | 50000, 20000 | `anticipo` |
| T-12 | `estadoPago` | 50000, 50000 | `pagado` |
| T-13 | `estadoPago` | 50000, 60000 | `pagado` (abonado ≥ total) |
| T-14 | `saldo` | 50000, 20000 | 30000 |
| T-15 | `saldo` | 50000, 50000 | 0 |
| T-16 | `abonoValido` | total 50000, abonado 20000, monto 30000 | `true` (completa) |
| T-17 | `abonoValido` | 50000, 20000, 40000 | `false` (excede) |
| T-18 | `abonoValido` | 50000, 0, 0 | `false` (monto 0) |
| T-19 | `validarReserva` | fecha "2026-06-14" (pasada) | `FECHA_INVALIDA` |
| T-20 | `validarReserva` | fecha hoy, fin ≤ inicio | `DATOS_INVALIDOS` |
| T-21 | `validarReserva` | fecha hoy, valorTotal 0 | `DATOS_INVALIDOS` |
| T-22 | `validarReserva` | fecha futura, 18:00-19:00, valor 50000 | sin error |
| T-23 | `esHoraValida` | "25:00" / "18:60" | `false` en ambas |
| T-24 | `validarCliente` | nombre " " | `DATOS_INVALIDOS` |
| T-25 | `validarCliente` | contacto " " | `DATOS_INVALIDOS` |

Comando: `npm test`. Las 25 pruebas deben pasar antes de continuar con la fase 3.

### 16.2 Prueba de flujo contra la base de datos

`scripts/probar-flujo.ts` (`npm run probar:flujo`) usa `dataService` con nombres `Prueba *` y fechas futuras. Imprime `OK` o `FALLA` por paso y limpia al final.

| Paso | Operación | Esperado |
|---|---|---|
| 1 | Crear cancha "Prueba Cancha 1" | Creada |
| 2 | Crear "prueba cancha 1" otra vez | `CANCHA_DUPLICADA` |
| 3 | Crear cliente "Prueba Cliente" (contacto 300...) | Creado |
| 4 | Crear reserva: Cancha 1, Cliente, fecha hoy+3, 18:00-19:00, valor 50000 | Reserva activa; pago pendiente |
| 5 | Crear reserva en la misma cancha, mismo día, 18:30-19:30 | `CHOQUE_HORARIO` |
| 6 | Crear reserva en la misma cancha, mismo día, 19:00-20:00 | Activa (consecutiva, no choca) |
| 7 | Crear reserva con fecha pasada | `FECHA_INVALIDA` |
| 8 | Crear reserva con 19:00-18:00 | `DATOS_INVALIDOS` |
| 9 | Consultar disponibilidad de Cancha 1 ese día | Dos franjas ocupadas (18-19 y 19-20) |
| 10 | Registrar abono de 20000 en la reserva del paso 4 | estadoPago anticipo; saldo 30000 |
| 11 | Registrar abono de 40000 en esa reserva | `ABONO_EXCEDE_TOTAL` (20000+40000 > 50000) |
| 12 | Registrar abono de 30000 en esa reserva | estadoPago pagado; saldo 0 |
| 13 | Cancelar la reserva del paso 6 (19-20) | Cancelada |
| 14 | Crear reserva 19:00-20:00 de nuevo (la franja quedó libre) | Activa (la cancelada no ocupa) |
| 15 | Registrar un abono en una reserva cancelada | `RESERVA_CANCELADA` |

### 16.3 Aceptación (criterio de terminado)

Se ejecuta en el despliegue de Vercel y se documenta en `doc/ACEPTACION.md`.

| ID | Acción | Resultado esperado |
|---|---|---|
| A-01 | Abrir `/reservas` sin sesión | Redirección al login |
| A-02 | Crear la cancha "Cancha 1" | Aparece en Canchas |
| A-03 | Crear el cliente "Juan" con su contacto | Aparece en Clientes |
| A-04 | Crear una reserva: Cancha 1, Juan, mañana, 18:00-19:00, $50.000 | Reserva activa, pago pendiente |
| A-05 | Intentar otra reserva que solape (18:30-19:30) | Rechazo por choque de horario |
| A-06 | Crear una reserva consecutiva (19:00-20:00) | Se permite |
| A-07 | Intentar reservar en una fecha pasada | Rechazo con mensaje |
| A-08 | Consultar la agenda de Cancha 1 para mañana | Muestra las dos franjas ocupadas y los huecos libres |
| A-09 | Registrar un abono de $20.000 en la reserva | Estado pasa a Anticipo; saldo $30.000 |
| A-10 | Intentar un abono de $40.000 (excede) | Rechazo |
| A-11 | Registrar un abono de $30.000 | Estado pasa a Pagado; saldo $0 |
| A-12 | Cancelar la reserva consecutiva | Queda cancelada; su franja se libera |
| A-13 | Reservar de nuevo esa franja liberada | Se permite |
| A-14 | Cerrar el navegador y volver a entrar | Los datos persisten |
| A-15 | (Opcional) Ver el resumen de cobros del periodo | Total cobrado, anticipos y pendiente |

A-15 corresponde a las opcionales; se verifica tras P09.

---

## 17. Plan de ejecución

| Fase | Prompt | Resultado | Cierre |
|---|---|---|---|
| 0 · Conciliación | P00 | `ESTADO_ACTUAL.md`, `DICTAMEN.md`, `copilot-instructions.md`, `ESTADO_EJECUCION.md`; estado de compilación | `FASE_0_COMPLETADA.md` |
| 1 · Base de datos | P01 | M1 y M2 aplicadas; `npm run db:verificar` sin fallas | `FASE_1_COMPLETADA.md` |
| 2 · Reglas | P02 | `lib/config`, `lib/reglas` (solape y pago), 25 pruebas en verde | `FASE_2_COMPLETADA.md` |
| 3 · Servidor | P03 | Conexión, sesión (login como puerta), respuestas, esquemas, formato; sesión protegida | `FASE_3_COMPLETADA.md` |
| 4 · Datos y API | P04, P05 | `lib/datos/*`, `dataService`, rutas; `npm run probar:flujo` sin fallas | `FASE_4_COMPLETADA.md` |
| 5 · Interfaz | P06, P07, P08 | Componentes base, canchas, clientes, agenda, reserva, cobro | `FASE_5_COMPLETADA.md` |
| 6 · Aceptación | (en P08) | `ACEPTACION.md` con A-01 a A-14; README | `FASE_6_COMPLETADA.md` |
| 7 · Opcionales | P09 | Agenda de todas las canchas y resumen de cobros | `FASE_7_COMPLETADA.md` |

Condiciones entre fases: no se inicia una fase sin el archivo de cierre de la anterior; `npm run build` sin errores al final de cada prompt; `npm test` en verde desde P02; cada prompt termina con commit y push, y un fallo de despliegue en Vercel se corrige antes del siguiente prompt.

---

## 18. Funcionalidades opcionales

Se construyen solo con la fase 6 cerrada.

| Prompt | Funcionalidad | Implementación |
|---|---|---|
| P09 | F7 · Agenda de todas las canchas | `agendaDelDia(fecha)`: para una fecha, las reservas activas de todas las canchas con sus franjas; una vista de rejilla (canchas × horas) que muestra ocupado/libre. Ruta y pantalla en `/reservas/resumen` o `/reservas` con modo "todas" |
| P09 | F8 · Resumen de cobros | `resumenCobros(desde, hasta)`: total cobrado (suma de abonos), número de reservas, y desglose por estado de pago (pendiente/anticipo/pagado) en el periodo. Ruta `/api/reservas/resumen`; tabla en `/reservas/resumen` |

---

## 19. Glosario

| Término | Definición |
|---|---|
| Cancha | Un campo sintético que se reserva por franjas horarias |
| Cliente | Persona que reserva; el administrador registra su nombre y contacto |
| Reserva | El uso de una cancha por un cliente en una fecha y una franja horaria |
| Franja | Intervalo de hora de inicio a hora de fin, semiabierto `[inicio, fin)` |
| Choque de horario | Dos reservas activas de la misma cancha y día cuyas franjas se solapan |
| Abono | Un pago parcial o total de una reserva |
| Estado del pago | pendiente, anticipo o pagado, derivado de lo abonado frente al total |
| Saldo | Lo que falta por pagar: total menos abonado |
| Regla pura | Función de `lib/reglas/` que solo depende de sus parámetros |
| Transacción | Conjunto de escrituras que se confirma completo o se revierte completo |
| Copilot en modo Agente | Modo de GitHub Copilot Chat que lee el repositorio, edita varios archivos y ejecuta comandos de terminal con aprobación |
