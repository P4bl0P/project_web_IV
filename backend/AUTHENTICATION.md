# Autenticación, permisos y seguridad

## Arquitectura

El backend encapsula la autenticación, autorización y auditoría en `AuthModule` (`@Global()`), evitando instancias duplicadas de servicios y guards entre módulos de dominio.

### Autenticación y sesiones
- **Sesiones opacas en PostgreSQL (`Session`)**: la cookie `scout_session` es `HttpOnly`, `SameSite=Lax` y `Secure` en producción (`maxAge` sincronizado con `SESSION_MAX_MS`). Solo se almacena el hash SHA-256 del token.
- **Retos pre-MFA aislados (`MfaChallenge`)**: los retos temporales emitidos por `POST /auth/login` se almacenan en la tabla dedicada `MfaChallenge` (nunca en `Session`), con propósito explícito (`SETUP` o `LOGIN`), límite de intentos (`5`), caducidad corta (5 minutos) y consumo atómico de un solo uso. Es imposible utilizar un `challenge` como cookie `scout_session`.
- **Contraseñas y protección frente a fuerza bruta**: Argon2id con política mínima de 15 caracteres (máximo 128, sin contraseñas basadas en espacios), verificación con hash ficticio para mitigar enumeración por tiempo, bloqueo temporal por cuenta tras 5 intentos fallidos (`15 minutos`) y *rate limiting* específico en `/auth/login`, `/auth/mfa` y `/auth/invitations`.
- **MFA TOTP**: `otplib` cifrado con AES-256-GCM mediante `MFA_ENCRYPTION_KEY`. El secreto pendiente de verificación se aísla en `User.mfaPendingSecret` hasta confirmar el código TOTP; reconfigurar el segundo factor exige verificar la contraseña actual. Los códigos de recuperación son de un solo uso y se almacenan con Argon2id.
- **Rotación de sesiones**: al cambiar la contraseña (`POST /auth/password` o `POST /auth/password/initial`), se revocan todas las sesiones previas y se emite una nueva cookie rotada. Todas las respuestas de autenticación y administración incluyen `Cache-Control: no-store`.

## Modelo funcional: usuarios, cargos, módulos y permisos

1. **Usuario (`User`)**: persona con cuenta en la aplicación. Puede tener **como máximo un cargo** (`roleId`, relación `0..1` con `onDelete: Restrict`).
2. **Cargo (`Role`)**: responsabilidad dentro del grupo (`name`, `description`). Los permisos se conceden exclusivamente a los cargos, nunca a usuarios individuales.
3. **Módulo (`Module`)**: sección funcional registrada desde la fuente única de verdad (`src/authorization/module-registry.ts`) o desde el panel administrativo (`key`, `name`, `description`, `route`, `icon`, `isImplemented`, `supportsRead/Create/Update/Delete`, `specialActions`).
4. **Permiso (`Permission`)**: relaciona un `Role` con un `Module`, distinguiendo:
   - `canAccess`: acceso explícito al módulo. Si es `false`, cualquier operación CRUD o especial queda denegada.
   - Operaciones CRUD: `canRead`, `canCreate`, `canUpdate`, `canDelete` (acotadas a las operaciones soportadas por el módulo).
   - `specialPermissions`: lista JSON de claves de acciones especiales propias del módulo (por ejemplo `read_medical_data`, `read_bank_data`, `preview_aurora`, `manage_web_content` en Secretaría o `export_sepa` en Tesorería).

### Reglas de autorización e invalidación
- **Denegar por defecto**: ninguna operación está autorizada sin permiso explícito. Nunca se autoriza por el nombre del cargo (`role.name`).
- **Centralización**: `AuthorizationGuard` + `@RequireSuperAdmin()` / `@RequirePermission(moduleKey, action, specialAction?)` y las funciones de `module-registry.ts` forman la única autoridad.
- **Invalidación inmediata**: al cambiar el cargo de un usuario, desactivarlo/bloquearlo o modificar los permisos de un cargo, se revocan inmediatamente todas las sesiones activas y retos MFA pendientes afectados.
- **Superadministrador (`User.isSuperAdmin`)**: cuenta global protegida frente a escalada de privilegios, modificación/desactivación/eliminación desde el panel ordinario y frente a la pérdida del último superadministrador activo.

## Cargos iniciales y seed

`npm run db:seed` registra los módulos iniciales (`Jefatura`, `Secretaría`, `Tesorería`) y únicamente los tres cargos funcionales iniciales (`Jefatura`, `Tesorería`, `Secretaría`), otorgándoles de forma predeterminada acceso a su módulo homónimo (editable posteriormente por el superadministrador sin sobrescribir cambios previos al re-ejecutar el seed).

## Instalación, bootstrap y recuperación administrativa

1. Configura las variables del `.env.example` generando `MFA_ENCRYPTION_KEY` (y opcionalmente `DATA_ENCRYPTION_KEY`) con `openssl rand -base64 32`.
2. Ejecuta `npm run db:migrate` y `npm run db:seed`.
3. Ejecuta una única vez `ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:bootstrap`.
4. Inicia sesión y completa la configuración TOTP (guarda los 10 códigos de recuperación fuera de la aplicación).

### Recuperación administrativa segura (emergencia)
Si el superadministrador queda bloqueado o pierde su dispositivo MFA y códigos de recuperación, ejecuta desde consola autorizada en el servidor:

```bash
RECOVERY_CONFIRM=YES \
RECOVERY_ADMIN_EMAIL=admin@example.org \
RECOVERY_NEW_PASSWORD="una-contrasena-segura-de-al-menos-15-caracteres" \
RECOVERY_RESET_MFA=true \
npm run db:recover-admin
```

El procedimiento reactiva o regenera la cuenta de superadministrador, revoca todas sus sesiones y retos MFA activos y deja registro en `AuditEvent` (`SUPERADMIN_RECOVERY`).

## Auditoría

`AuditService` registra en `AuditEvent` las operaciones administrativas, de autenticación y accesos denegados (`ACCESS_DENIED`), incluyendo actor, acción, tipo/identificador objetivo, valores previos y nuevos sanitizados (eliminando automáticamente contraseñas, tokens, secretos MFA, DNI, IBAN y firmas) e IP. Los registros son de solo consulta para el superadministrador (`GET /admin/audit`).
