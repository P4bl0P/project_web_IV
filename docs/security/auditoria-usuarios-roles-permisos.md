# Auditoría de Seguridad y Arquitectura: Usuarios, Cargos, Roles y Permisos

- **Fecha:** 2026-11-23
- **Rama base analizada:** `origin/develop` (`f9fbae9`)
- **Rama de trabajo:** `refactor/logica-permisos`
- **Alcance:** Backend NestJS (`backend/src/**`, `backend/prisma/**`), Frontend React (`frontend/src/**`) y documentación técnica (`backend/AUTHENTICATION.md`).

---

## 1. Arquitectura actual

### 1.1 Persistencia y modelo de datos
El backend utiliza **NestJS 12** con **Prisma 6** sobre **PostgreSQL 16**. El esquema actual (`backend/prisma/schema.prisma`) define:
- `User`: identidad (`id`, `email`, `name`), `passwordHash` (Argon2id), `status` (`INVITED | ACTIVE | BLOCKED | DISABLED`), booleano `isSuperAdmin`, `mustChangePassword`, `mfaSecret` (cifrado con AES-256-GCM mediante `MFA_ENCRYPTION_KEY`), `mfaConfiguredAt` y `roleId` opcional (relación `0..1` hacia `Role` con `onDelete: SetNull`).
- `Role`: únicamente `id`, `name` único y `createdAt` (sin descripción).
- `Module`: únicamente `id`, `name` único y `createdAt` (sin clave estable, ruta, metadatos de estado ni operaciones especiales).
- `Permission`: relación única `(roleId, moduleId)` con cuatro booleanos (`canRead`, `canCreate`, `canUpdate`, `canDelete`), sin flag explícito de acceso al módulo (`canAccess`) ni permisos específicos por módulo.
- `Session`: sesiones opacas (`tokenHash` SHA-256, `userId`, `lastSeenAt`, `expiresAt`, `revokedAt`).
- `Invitation`, `RecoveryCode`, `AuditEvent` (`id`, `actorId`, `action`, `resource`, `result`, `ipAddress`, `createdAt`).

### 1.2 Acoplamiento de módulos en backend
`AuthService` y `AuthGuard` no están encapsulados en un módulo compartido: se declaran independientemente en los arrays `providers` de:
- `backend/src/app.module.ts`
- `backend/src/applications/applications.module.ts`
- `backend/src/council/council.module.ts`

Esto genera múltiples instancias de `AuthService` y dificulta inyectar servicios transversales (autorización centralizada, registro de módulos o auditoría) con estado único por aplicación.

### 1.3 Frontend
Aplicación **React 19 + React Router 7 + Vite 8** con un único `AuthProvider` (`frontend/src/auth.tsx`) que consulta `GET /auth/me` con cookies `credentials: 'include'`, junto con componentes guard (`PrivateRoute`, `AdminRoute`, `WebContentRoute`, `ModuleRoute`) en `frontend/src/App.tsx`, barra de navegación (`frontend/src/components/shared/NavBar.tsx`), hub privado (`frontend/src/pages/GestionPage.tsx`) y panel administrativo (`frontend/src/pages/AdministracionPage.tsx`).

---

## 2. Cómo funciona actualmente la autenticación

1. **Inicio de sesión (`POST /auth/login` en `backend/src/auth.controller.ts` -> `AuthService.login`)**:
   - Busca el usuario por `email.trim().toLowerCase()`, comprueba `user.status === 'ACTIVE'` y verifica `passwordHash` con Argon2id (`argon2.verify`).
   - Si no tiene `mfaConfiguredAt` o `mfaSecret`, genera un secreto TOTP con `otplib`, lo cifra con AES-256-GCM y lo guarda directamente en `User.mfaSecret`, devolviendo `{ status: 'MFA_SETUP_REQUIRED', challenge, setup }`.
   - En cualquier login válido genera `challenge` (32 bytes base64url) y lo inserta **directamente en la tabla `Session`** (`expiresAt = now + 5 min`, `revokedAt = null`).
2. **Segundo factor (`POST /auth/mfa/confirm-setup` y `POST /auth/mfa`)**:
   - Valida el `challenge` contra `Session` y el código TOTP o un código de recuperación (`RecoveryCode` almacenado con Argon2id).
   - En `confirmMfaChallenge` actualiza `User` con `{ mfaConfiguredAt: new Date(), status: 'ACTIVE' }`, regenera 10 códigos de recuperación y llama a `completeMfa`.
   - En `completeMfa` reutiliza la misma fila `Session`, reemplazando `tokenHash` por un nuevo token aleatorio y fijando `expiresAt = now + maxMs`. Emite la cookie `scout_session` (`HttpOnly`, `SameSite=Lax`, `Secure` en producción).
3. **Validación de sesión (`AuthGuard` -> `AuthService.getUserBySession`)**:
   - Lee `req.cookies.scout_session`, calcula `SHA-256`, busca en `Session` incluyendo `user.role.permissions.module`.
   - Comprueba `!session || session.revokedAt || session.expiresAt < now || session.user.status !== 'ACTIVE'`, caducidad por inactividad (`idleMs`), actualiza `lastSeenAt` y restringe acceso si `user.mustChangePassword` es `true` comparando `request.path` contra una lista fija de rutas.
4. **Invitaciones y contraseñas**:
   - `POST /auth/invitations/:token/accept` exige longitud >= 15, fija `status: 'ACTIVE'`, `mustChangePassword: false` y marca la invitación usada.
   - `POST /auth/password` exige contraseña actual, actualiza el hash y revoca todas las sesiones del usuario (`revokedAt: new Date()`).
   - `POST /auth/password/initial` permite establecer contraseña cuando `mustChangePassword === true` conservando la cookie actual y revocando el resto.
5. **Bootstrap del superadministrador (`backend/src/bootstrap.ts`)**:
   - Crea el único usuario con `isSuperAdmin: true` mediante variables `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` si no existe ninguno previo en la base de datos.

---

## 3. Cómo se asignan actualmente cargos y permisos

- **Seed inicial (`backend/prisma/seed.ts`)**:
  - Inserta módulos `Jefatura`, `Secretaría`, `Tesorería` y cargos `Jefatura`, `Secretaría`, `Tesorería`.
  - Crea filas `Permission` para cada combinación cargo-módulo **sin habilitar ningún permiso** (`canRead=false`, `canCreate=false`, `canUpdate=false`, `canDelete=false` por defecto).
- **Gestión administrativa (`backend/src/admin.controller.ts` + `frontend/src/pages/AdministracionPage.tsx`)**:
  - Protegido mediante `ensureAdmin(req)` (`req.user?.isSuperAdmin`).
  - Permite listar usuarios no-superadmin, crear usuarios (devolviendo contraseña temporal de un solo uso y `mustChangePassword: true`), actualizar cargo/estado de usuario, restablecer contraseña, desactivar usuarios (`DELETE /admin/users/:id`), crear/renombrar cargos, crear módulos, listar permisos y alternar individualmente los 4 booleanos de una fila `Permission`.
- **Comprobación de permisos en runtime**:
  - `ApplicationsController` usa `ensurePermission(req, 'Secretaría', action)` para CRUD y `canReadSensitiveMedicalOrBankData(req.user, kind)` para ficha médica/IBAN.
  - `CouncilController` usa `ensureWebContentPermission(req, action)` para gestionar integrantes del Consejo de Grupo.
  - En frontend, `GestionPage` y `NavBar` ocultan los enlaces para los que `hasModulePermission` o `canAccessWebContent` devuelven `false`, y las rutas protegidas redirigen a `/gestion`.

---

## 4. Vulnerabilidades detectadas y clasificación por gravedad

### Gravedad Crítica

#### C1. Bypass completo de MFA mediante reutilización de la tabla `Session` para retos pre-MFA
- **Ubicación:** `backend/src/auth.service.ts` (líneas 29, 82-88).
- **Descripción:** `AuthService.login()` almacena el token temporal `challenge` (destinado únicamente a identificar la segunda fase de autenticación MFA) como una fila normal en la tabla `Session`, sin ningún marcador de estado pendiente (`isMfaVerified` o tabla separada). `AuthService.getUserBySession()` acepta cualquier fila en `Session` que no esté revocada ni expirada y cuyo usuario esté `ACTIVE`.
- **Explotación y consecuencias:**
  1. Un atacante (o usuario legítimo antes de completar TOTP) envía `POST /auth/login` con email y contraseña y recibe `{ challenge }`.
  2. Sin resolver ni configurar MFA, envía cualquier petición autenticada con la cabecera `Cookie: scout_session=<challenge>` durante los 5 minutos de validez del reto.
  3. `AuthGuard` valida `<challenge>` como una sesión completa. Si el atacante además llama a `POST /auth/mfa/setup` y `POST /auth/mfa/confirm` usando esa cookie, sobrescribe el secreto MFA de la víctima y toma el control permanente de su cuenta (incluida la del **superadministrador**).

#### C2. Bypass de autorización por nombre de cargo (`role.name === 'secretaria'`)
- **Ubicación:** `backend/src/auth.guard.ts` (líneas 83 y 97); `frontend/src/auth.tsx` (línea 60).
- **Descripción:**
  - `ensureWebContentPermission()` autoriza todas las operaciones de `CouncilController` (lectura de gestión, creación, edición, reordenación y borrado) si `normalizeName(request.user.role?.name) === 'secretaria'`, **antes siquiera de consultar `Permission`**.
  - `canReadSensitiveMedicalOrBankData()` concede lectura completa de historial médico, alergias, medicación, DNI e IBAN completo si `normalizeName(user.role?.name) === 'secretaria'`, incluso si el usuario solo tiene `canRead` general y no tiene permiso de actualización o acceso sensible.
  - En frontend, `canAccessWebContent()` replica la misma excepción por nombre de cargo.
- **Explotación y consecuencias:**
  1. Si el superadministrador revoca todos los permisos del cargo `Secretaría` (o le quita acceso al módulo `Secretaría`), cualquier usuario con ese cargo sigue accediendo a toda la gestión de contenido web (`/council/*`) y datos médicos/bancarios si conserva lectura básica.
  2. Renombrar cualquier otro cargo a `Secretaría` o `Secretaria` concede implícitamente privilegios de contenido web y datos sensibles sin haber concedido ningún permiso en la matriz.

#### C3. Reactivación de cuentas desactivadas/bloqueadas y sobrescritura de MFA sin protección
- **Ubicación:** `backend/src/auth.service.ts` (líneas 24-28, 33-43, 56-59, 123-134).
- **Descripción:**
  - `confirmMfaChallenge()` no comprueba `pending.revokedAt === null`, ni `pending.user.status === 'ACTIVE'`, ni `!pending.user.mfaConfiguredAt`, y fuerza `status: 'ACTIVE'` al validar el código.
  - `completeMfa()` no comprueba `pending.revokedAt === null` ni consume el reto de forma atómica antes de emitir la sesión, permitiendo condiciones de carrera o uso de retos revocados.
  - `login()` escribe `mfaSecret` directamente sobre el usuario si falta `mfaConfiguredAt` y `setupMfa()` sobrescribe el `mfaSecret` activo sin exigir contraseña actual ni separar `mfaPendingSecret`.
- **Explotación y consecuencias:**
  - Si un usuario inicia login (`challenge` creado) y un administrador desactiva su cuenta antes de que confirme el setup MFA, `confirmMfaChallenge` vuelve a poner `status: 'ACTIVE'` en la cuenta desactivada.
  - Un usuario con sesión activa (o aprovechando C1) puede invalidar su MFA o registrar un dispositivo atacante mediante `POST /auth/mfa/setup` sin confirmar su contraseña.

---

### Gravedad Alta

#### A1. Sesiones activas no invalidadas al cambiar cargo, modificar permisos o desactivar/bloquear vía `PATCH`
- **Ubicación:** `backend/src/admin.controller.ts` (líneas 60-88 y 169-176).
- **Descripción:**
  - `PATCH /admin/users/:id` cambia `roleId` o `status` (por ejemplo a `BLOCKED` o `DISABLED`) sin revocar las filas de `Session` del usuario. Aunque `getUserBySession` comprueba `user.status === 'ACTIVE'` en cada petición, las sesiones previas permanecen vivas en la tabla `Session` (si el usuario vuelve a activarse, sus cookies antiguas siguen válidas) y un cambio de `roleId` mantiene la sesión anterior vigente sin forzar revalidación ni rotar credenciales.
  - `PATCH /admin/permissions/:id` actualiza los permisos de un cargo sin revocar las sesiones activas de los usuarios que pertenecen a ese cargo, manteniendo sesiones abiertas tras revocaciones críticas de seguridad.
- **Explotación y consecuencias:** Tras degradar un cargo o revocar permisos críticos (lectura médica, IBAN, creación/borrado), los usuarios con sesiones abiertas siguen operando hasta la expiración de su sesión (hasta 8 horas) sin requerir nueva autenticación.

#### A2. Ausencia de protección real contra fuerza bruta en login, códigos MFA y códigos de recuperación
- **Ubicación:** `backend/src/main.ts` (línea 13), `backend/src/auth.service.ts`.
- **Descripción:** Solo existe un `rateLimit` global genérico (120 peticiones por minuto por IP). No existe conteo de intentos fallidos por cuenta en `login`, ni límite de intentos por reto `MfaChallenge` (un código TOTP de 6 dígitos tiene $10^6$ combinaciones; con múltiples IPs o varios minutos antes de expirar el reto de 5 min pueden probarse miles de códigos o contraseñas sin bloqueo de cuenta).
- **Explotación y consecuencias:** Ataques distribuidos de fuerza bruta o credential stuffing contra cuentas del equipo (incluido el superadministrador) o intentos repetidos de adivinación de códigos TOTP sobre un mismo `challenge`.

#### A3. Ausencia de DTOs con `class-validator` en `AuthController` y `AdminController` y errores 500 sin capturar
- **Ubicación:** `backend/src/auth.controller.ts` (líneas 11-33, 43-58, 72-73), `backend/src/admin.controller.ts` (líneas 40-177).
- **Descripción:** Aunque `main.ts` registra `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`, los controladores de autenticación y administración declaran tipos TypeScript en línea (`@Body() body: { ... }`), no clases DTO con metadatos de validación. Además lanzan `new Error(...)` (generando respuestas HTTP `500 Internal Server Error`) y no capturan errores Prisma (`P2002`, `P2025`) en `updateUser`, `updateRole`, `createModule` ni `updatePermission`.
- **Explotación y consecuencias:** Posible inyección de propiedades inesperadas, omisión de validación estricta en `status`, `email`, `name`, `roleId`, exposición de códigos 500 y enumeración de errores internos de base de datos.

#### A4. Falta de protección al último superadministrador y ausencia de procedimiento de recuperación seguro
- **Ubicación:** `backend/src/admin.controller.ts`, `backend/src/bootstrap.ts`.
- **Descripción:** Si el único superadministrador pierde su dispositivo MFA y códigos de recuperación, o queda bloqueado/desactivado por error o acción directa en base de datos, `bootstrap.ts` impide crear otro (`The absolute administrator already exists`) y no existe un procedimiento CLI documentado y auditado de recuperación administrativa. Asimismo, el sistema no implementa explícitamente el invariante transaccional que garantice que siempre exista al menos una cuenta de superadministrador activa e inmutable frente a desactivación/eliminación.
- **Explotación y consecuencias:** Pérdida total de acceso administrativo al sistema (denegación de servicio administrativa) o situación de bloqueo irreversible ante pérdida de TOTP del superadmin.

#### A5. Controles de autorización defectuosos o *fail-open*
- **Ubicación:**
  - `backend/src/applications/applications.controller.ts` (líneas 124-135): `getAuroraPreview` ejecuta `ensurePermission(req, 'Secretaría', 'canUpdate')` y luego un `if (!canReadSensitiveMedicalOrBankData(...) && !req.user?.isSuperAdmin)` que **vuelve a llamar exactamente a `ensurePermission(req, 'Secretaría', 'canUpdate')`**. Nunca bloquea datos sensibles aunque se pretendiera restringirlos.
  - `backend/src/applications/applications.service.ts` (líneas 569-570): `buildEnrollmentDetail()` usa `const allowMedical = user ? canReadSensitiveMedicalOrBankData(user, 'medical') : true;` y lo mismo para `allowBank`. Si algún camino interno invoca `findOne` o `enrichApplicant(..., { projection: 'detail' })` sin `user`, devuelve en claro todos los datos médicos, DNI e IBAN (**fail-open**).
  - `backend/src/auth.guard.ts` (líneas 74-78): consulta submódulos inexistentes (`'Secretaría - Datos Médicos'`, `'Secretaría - Datos Bancarios'`) que no están registrados en el catálogo de módulos ni en el panel de administración.
- **Explotación y consecuencias:** Cualquier invocación interna sin contexto `user` expone información altamente confidencial de menores (salud y datos bancarios SEPA), y no es posible autorizar ni revocar de forma granular la vista previa de Aurora o la lectura médica/bancaria desde el panel.

#### A6. Defectos en ciclo de vida de contraseñas, sesiones e invitaciones
- **Ubicación:** `backend/src/auth.service.ts` (líneas 17-21, 45-54, 90, 92-106), `backend/src/auth.controller.ts` (líneas 24, 31, 61-66).
- **Descripción:**
  1. `changePassword()` revoca **todas** las sesiones del usuario (`revokedAt: new Date()`), incluida la sesión actual del navegador, sin emitir una cookie rotada ni limpiar la cookie. En `frontend/src/pages/PerfilPage.tsx:35`, inmediatamente después se llama a `refreshUser()` (`/auth/me`), que falla con `401 Unauthorized` y rompe la experiencia de cambio de contraseña.
  2. `acceptInvitation()` no verifica `user.status === 'INVITED'`, no revoca sesiones previas ni registra evento de auditoría.
  3. `login()` omite `argon2.verify()` cuando el email no existe o el usuario está inactivo, creando una diferencia medible de tiempo (timing attack para enumerar correos registrados).
  4. `maxAge` de la cookie en `AuthController` está fijado en `28800000` ignorando `process.env.SESSION_MAX_MS`.
  5. Falta cabecera `Cache-Control: no-store` en endpoints de sesión y administración, y `logout()` no registra evento en `AuditEvent`.

---

### Gravedad Media

#### M1. Seed inicial con permisos vacíos y creación de cargos sin matriz de permisos
- **Ubicación:** `backend/prisma/seed.ts` (líneas 9-14), `backend/src/admin.controller.ts` (líneas 127-141).
- **Descripción:**
  - El seed inicial crea `Jefatura`, `Secretaría` y `Tesorería` con todos los permisos en `false`, por lo que ningún cargo inicial puede acceder a su propio módulo tras desplegar.
  - Cuando el superadmin crea un nuevo cargo con `POST /admin/roles`, **no se crean filas `Permission`** para los módulos existentes, por lo que el cargo recién creado no aparece en `AdminPermissionsTable` y no puede recibir permisos desde la interfaz.

#### M2. Ausencia de fuente única de verdad para módulos, permisos de acceso y acciones especiales
- **Ubicación:** `backend/prisma/schema.prisma`, `backend/src/auth.guard.ts`, `frontend/src/auth.tsx`, `frontend/src/pages/GestionPage.tsx`.
- **Descripción:**
  - Los módulos se comparan mediante cadenas con normalización ad-hoc (`'Secretaría'`, `'Jefatura'`, `'Tesorería'`) replicadas entre backend y frontend, en lugar de usar un identificador estable (`key`) y un registro centralizado.
  - No existe distinción entre **acceso al módulo** (`canAccess`) y permisos CRUD (`canRead`, `canCreate`, `canUpdate`, `canDelete`), ni un mecanismo declarativo para **permisos especiales** propios de cada módulo (datos médicos, datos bancarios/IBAN, vista previa Aurora, gestión de contenido web, exportación SEPA, etc.).
  - Añadir un nuevo módulo exige modificar manualmente múltiples archivos (`GestionPage`, `App.tsx`, `seed.ts`, `NavBar`, controladores).

#### M3. Panel administrativo incompleto e inconsistente
- **Ubicación:** `backend/src/admin.controller.ts`, `frontend/src/pages/AdministracionPage.tsx`, `AdminUsersSection.tsx`, `AdminRolesSection.tsx`, `AdminPermissionsTable.tsx`.
- **Descripción:**
  - **Usuarios:** No permite editar `name` ni `email` desde UI; elegir `"Sin cargo"` envía `roleId: ""`, que el backend ignora silenciosamente (`...(body.roleId ? ... : {})`) dejando el cargo anterior; oculta cuentas superadmin; no permite eliminar permanentemente un usuario ni restablecer su MFA; no muestra si la cuenta tiene MFA configurado o cambio inicial pendiente.
  - **Cargos:** No permite editar nombre/descripción ni eliminar cargos no asignados; no muestra qué puede hacer cada cargo.
  - **Permisos:** Aplica cambios por cada clic sin vista consolidada por cargo, no distingue acceso al módulo ni permisos especiales, y no soporta módulos con subconjunto de operaciones CRUD.
  - **Módulos y Auditoría:** No hay sección en UI para ver/registrar módulos ni para consultar `GET /admin/audit`.

#### M4. Ocultación de módulos en navegación y redirección silenciosa en lugar de acceso denegado explícito
- **Ubicación:** `frontend/src/pages/GestionPage.tsx` (líneas 13-21), `frontend/src/auth.tsx` (líneas 182-216), `frontend/src/pages/ContenidoWebPage.tsx`.
- **Descripción:**
  - `GestionPage.tsx` filtra y oculta completamente los módulos para los que el usuario no tiene `canRead`, y `ModuleRoute` / `AdminRoute` / `WebContentRoute` redirigen silenciosamente a `/gestion` si un usuario entra por URL directa, sin mostrarle una pantalla informativa ni explicarle el motivo.
  - `ContenidoWebPage.tsx` y `CouncilMemberList.tsx` muestran botones de crear, editar, reordenar y eliminar sin respetar los flags `canCreate`, `canUpdate` y `canDelete`.

#### M5. Auditoría insuficiente
- **Ubicación:** `backend/prisma/schema.prisma`, `backend/src/auth.service.ts`, `backend/src/admin.controller.ts`, `backend/src/council/council.controller.ts`.
- **Descripción:** `AuditEvent` solo guarda strings `action`, `resource`, `result`, sin `targetType`, `targetId`, `previousValues` ni `newValues`. No se registran cambios específicos de cargo (`roleId`), contenido web (`CouncilController`), accesos denegados en guards (`403`), cierre de sesión ni creación/actualización de módulos.

---

### Gravedad Baja

#### B1. Fallos de flujo y validación en `LoginPage.tsx`
- **Ubicación:** `frontend/src/pages/LoginPage.tsx` (líneas 20 y 131).
- **Descripción:**
  - `if (user) return <Navigate to="/gestion" replace />;` se evalúa antes de comprobar `recoveryCodes.length`. Como `completeMfa()` actualiza `user` antes de devolver `recoveryCodes`, al configurar MFA por primera vez el componente redirige inmediatamente a `/gestion` (o `/perfil`) y **el usuario nunca ve sus 10 códigos de recuperación**.
  - El campo de código MFA tiene `pattern="[0-9]{6}"`, lo que impide introducir mediante el formulario un código de recuperación hexadecimal de 10 caracteres.

#### B2. Polling innecesario de `/auth/me` para usuarios anónimos
- **Ubicación:** `frontend/src/auth.tsx` (líneas 126-128).
- **Descripción:** `AuthProvider` ejecuta `GET /auth/me` cada 60 segundos incluso para visitantes públicos no autenticados, generando tráfico innecesario y respuestas `401` continuas en consola del navegador.

#### B3. Validaciones menores de entrada
- **Ubicación:** `backend/src/bootstrap.ts` (línea 6), `backend/src/auth.service.ts` (líneas 46, 93, 109).
- **Descripción:** `bootstrap.ts` no hace `.trim()` del email y la política de contraseñas acepta cadenas de 15 espacios en blanco.

---

## 5. Archivos y componentes afectados

| Capa | Archivo | Estado / Problema principal |
|---|---|---|
| Base de datos | `backend/prisma/schema.prisma` | Falta `MfaChallenge`, `canAccess`, `specialPermissions`, metadatos de `Module`, `Role.description`, `onDelete: Restrict`, campos de auditoría estructurados |
| Seeds | `backend/prisma/seed.ts` | Inicializa todos los permisos a `false`; desconectado de un registro único de módulos |
| Autenticación | `backend/src/auth.service.ts` | Reutiliza `Session` para retos MFA; timing side-channel; sin bloqueo por intentos; `changePassword` rompe sesión actual; `confirmMfaChallenge` reactiva cuentas |
| Controlador Auth | `backend/src/auth.controller.ts` | Sin DTOs `class-validator`; lanza `Error` 500; `maxAge` fijo; sin `no-store` |
| Guards | `backend/src/auth.guard.ts` | Bypass por `role.name === 'secretaria'`; submódulos inexistentes; rutas onboarding hardcodeadas |
| Administración | `backend/src/admin.controller.ts` | Sin DTOs; sin revocación de sesiones al cambiar cargo/permisos; sin edición/borrado de cargos; sin borrado seguro ni protección de último superadmin |
| Módulos App | `backend/src/app.module.ts`, `applications.module.ts`, `council.module.ts` | Duplicación de `AuthService` y `AuthGuard` |
| Secretaría | `backend/src/applications/applications.controller.ts`, `applications.service.ts` | Check redundante en `aurora-preview`; fallback `true` (*fail-open*) en `buildEnrollmentDetail` |
| Consejo Web | `backend/src/council/council.controller.ts` | Autorización delegada en bypass de nombre `secretaria`; sin auditoría |
| Bootstrap | `backend/src/bootstrap.ts` | Sin recuperación administrativa ni auditoría |
| Frontend Auth | `frontend/src/auth.tsx` | Bypass por nombre `secretaria`; redirecciones silenciosas; polling anónimo |
| Navegación y Hub | `frontend/src/App.tsx`, `NavBar.tsx`, `GestionPage.tsx` | Oculta módulos sin permiso; sin pantalla de acceso denegado; rutas rígidas |
| Panel Admin | `frontend/src/pages/AdministracionPage.tsx`, `components/administracion/*` | Incompleto para cargos, permisos por módulo/especiales, módulos y auditoría |
| Login / Perfil | `frontend/src/pages/LoginPage.tsx`, `PerfilPage.tsx` | Oculta códigos de recuperación; bloquea hex en input MFA; `PerfilPage` no muestra resumen de permisos |
| Contenido Web | `frontend/src/pages/ContenidoWebPage.tsx`, `CouncilMemberList.tsx` | No aplica restricciones CRUD en UI |

---

## 6. Riesgos de migración

1. **Preservación de usuarios, cargos y permisos existentes:** No se puede reiniciar la base de datos. La migración SQL debe añadir columnas nullable o con valores por defecto seguros, rellenar `Module.key` a partir de los nombres existentes y migrar `Permission.canAccess = true` cuando alguna operación CRUD previa estuviera activa.
2. **Transición desde el seed previo con permisos en `false`:** En entornos donde se ejecutó `seed.ts` anterior y los 3 cargos iniciales (`Jefatura`, `Secretaría`, `Tesorería`) quedaron con todos los permisos en `false`, la migración debe activar sus permisos predeterminados **únicamente si no existen permisos configurados manualmente**, preservando intacta cualquier personalización existente.
3. **Compatibilidad de tests existentes (`applications.service.spec.ts`, `applications.controller.spec.ts`, `council.controller.spec.ts`, `app.e2e-spec.ts`):** Algunos tests unitarios actuales simulan usuarios con `role: { name: 'Secretaría', permissions: [...] }` sin `module.key` ni `specialPermissions`. Los helpers centrales deben resolver claves normalizadas sin depender del nombre del rol, y las suites de pruebas deben actualizarse para validar el nuevo modelo explícito (incluyendo casos negativos donde un rol llamado `Secretaría` sin permisos es rechazado).

---

## 7. Propuesta de solución

1. **Separación estricta de autenticación y autorización:**
   - Extraer los retos pre-MFA a un modelo dedicado `MfaChallenge` en Prisma, consumido atómicamente y con límite de intentos.
   - Añadir bloqueo temporal por intentos fallidos en login, `DummyHash` anti-enumeración, DTOs `class-validator`, rate limiters específicos por ruta sensible, rotación de cookie al cambiar contraseña y cabeceras `Cache-Control: no-store`.
2. **Única fuente de verdad para módulos y permisos (`authorization/module-registry.ts`):**
   - Definir de forma declarativa cada módulo (`key`, `name`, `description`, `route`, `icon`, `isImplemented`, `supportsRead/Create/Update/Delete`, `specialActions`) y los 3 cargos iniciales (`Jefatura`, `Tesorería`, `Secretaría`) con acceso inicial editable a su respectivo módulo.
   - Eliminar **toda** comprobación basada en `role.name` en backend y frontend.
   - Sincronizar automáticamente los módulos registrados al iniciar la aplicación (`AuthorizationService.onModuleInit`) y permitir registrar módulos adicionales desde administración.
3. **Modelo funcional de un único cargo por usuario y autorización centralizada:**
   - Un usuario tiene como máximo un `roleId` (`onDelete: Restrict`). Los permisos pertenecen exclusivamente a `Role` (`canAccess`, `canRead`, `canCreate`, `canUpdate`, `canDelete`, `specialPermissions`).
   - Implementar `@RequireSuperAdmin()`, `@RequirePermission(moduleKey, action, specialAction?)` y `AuthorizationGuard` centralizado con auditoría automática de denegaciones.
   - Invalidar de inmediato sesiones y retos MFA activos de los usuarios afectados cada vez que cambie su cargo, su estado o los permisos de su cargo.
   - Proteger transaccionalmente al último superadministrador activo y crear un comando CLI auditado de recuperación (`npm run db:recover-admin`).
4. **Auditoría estructurada:**
   - Ampliar `AuditEvent` con `targetType`, `targetId`, `previousValues` y `newValues` sanitizados (jamás contraseñas, tokens, secretos ni datos personales sensibles) y habilitar consulta filtrada solo para superadministrador.
5. **Experiencia coherente en frontend:**
   - Mantener todos los módulos registrados visibles en `GestionPage` y `NavBar`.
   - Crear `AccessDeniedView` integrado con la estética del proyecto para mostrar un aviso claro y rutas de regreso cuando un usuario sin permiso acceda a un módulo (por menú o URL directa) sin montar ni consultar datos del módulo restringido.
   - Ampliar `AdministracionPage` para gestionar integralmente usuarios, cargos (crear, editar, ver permisos, eliminar solo sin usuarios), matriz de permisos (acceso + CRUD + acciones especiales), módulos y registro de auditoría.
   - Corregir el flujo de códigos de recuperación en `LoginPage` y el respeto estricto de capacidades CRUD en `ContenidoWebPage` y `SecretariaPage`.
