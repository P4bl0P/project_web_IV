# Autenticación, permisos y seguridad

## Arquitectura

El backend mantiene sesiones opacas en PostgreSQL. La cookie `scout_session` es
`HttpOnly`, `SameSite=Lax` y `Secure` en producción; solo se almacena el hash
del token. Las sesiones caducan por inactividad y por duración máxima, y se
revocan al cerrar sesión o cuando una cuenta deja de estar activa.

El frontend mantiene un único `AuthProvider` en `src/auth.tsx`. La sesión se
valida contra `GET /auth/me` antes de mostrar accesos privados y se vuelve a
comprobar periódicamente para retirar esos accesos cuando caduca. Todas las
peticiones de autenticación usan `credentials: 'include'`; los errores de red
se distinguen de los rechazos de credenciales. `NavBar` consume ese contexto y
solo muestra «Gestión» después de la validación del servidor.

`PrismaModule` es el proveedor compartido de persistencia. Los controladores y
servicios deben importar su `PrismaService` desde `src/prisma/prisma.service`;
mantener una segunda clase Prisma produciría instancias incompatibles y
pruebas E2E que no pueden sustituir el acceso a datos de forma consistente.

Las contraseñas usan Argon2id. El segundo factor es TOTP compatible con
Google Authenticator, Microsoft Authenticator y 2FAS. El secreto TOTP se
cifra con AES-256-GCM usando `MFA_ENCRYPTION_KEY`; nunca se devuelve con
`/auth/me`.

## Usuarios, cargos y permisos

`User` pertenece como máximo a un `Role`. `Role`, `Module` y `Permission`
permiten añadir cargos y módulos sin modificar el modelo de autenticación.
Cada permiso separa lectura, creación, edición y eliminación. La cuenta
absoluta se identifica con `isSuperAdmin`; el procedimiento de bootstrap
impide crear una segunda cuenta con ese privilegio.

## Instalación y cuenta inicial

1. Configura las variables del `.env.example` de la raíz en el hosting, generando
   `MFA_ENCRYPTION_KEY` con `openssl rand -base64 32`.
2. Ejecuta `npm run db:migrate` y `npm run db:seed`.
3. Ejecuta una única vez `ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:bootstrap`.
4. Inicia sesión y completa la configuración TOTP.

Con Docker Compose, ejecuta desde la raíz:

```bash
cp .env.example .env
# Edita .env y sustituye todos los valores de ejemplo.
docker compose up -d --build
docker compose exec backend npm run db:seed
docker compose exec backend npm run db:bootstrap
```

El comando `db:migrate` y el comando `db:seed` regeneran Prisma antes de
trabajar con la base de datos. Esto es importante porque el contenedor de
desarrollo conserva `node_modules` en un volumen y, sin regeneración, puede
usar un cliente Prisma antiguo que no conoce los modelos nuevos.

Si quieres empezar desde cero y borrar todos los datos locales:

```bash
docker compose down -v
docker compose up -d --build
docker compose exec backend npm run db:seed
docker compose exec backend npm run db:bootstrap
```

Si una versión anterior falló con `P3018` o `P3009`, detén el backend y marca
esa ejecución como revertida antes de volver a arrancar:

```bash
docker compose stop backend
docker compose run --rm --no-deps backend \
  npx prisma migrate resolve --rolled-back 20261103170000_authentication_security
docker compose up -d backend
docker compose exec backend npm run db:seed
```

La migración de autenticación debe ser incremental: la primera migración ya
crea `Applicant` y sus enums; la segunda solo crea `User`, `Role`, `Module`,
`Permission`, sesiones, invitaciones, códigos de recuperación y auditoría.
   La respuesta de configuración genera diez códigos de recuperación; guárdalos
   fuera de la aplicación. Cada código es de un solo uso y se almacena como
   hash.

Las altas posteriores se realizan desde `POST /admin/users`; devuelve un token
de invitación de un solo uso y 24 horas de duración para entregarlo mediante
un canal controlado. La contraseña se establece en
`POST /auth/invitations/:token/accept`; nunca se envían contraseñas por correo.

## Despliegue, backups y riesgos residuales

Sirve frontend y backend únicamente sobre HTTPS, restringe PostgreSQL a la red
privada, rota secretos fuera del repositorio y cifra/protege los backups.
La entrega de invitaciones y la recuperación de contraseña requieren integrar
un proveedor de correo transaccional del hosting. Los documentos privados deben
servirse mediante endpoints autenticados, nunca desde un directorio público.
Completa además una revisión legal de minimización y retención por tratarse de
datos de menores.
