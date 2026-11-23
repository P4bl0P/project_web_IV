import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import cookieParser from 'cookie-parser';
import { generateSync } from 'otplib';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { BUILT_IN_MODULES } from '../src/authorization/module-registry';
import { PrismaService } from '../src/prisma/prisma.service';

interface MemUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  status: 'INVITED' | 'ACTIVE' | 'BLOCKED' | 'DISABLED';
  isSuperAdmin: boolean;
  mustChangePassword: boolean;
  mfaSecret: string | null;
  mfaPendingSecret: string | null;
  mfaConfiguredAt: Date | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  roleId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface MemRole {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface MemModule {
  id: string;
  key: string;
  name: string;
  description: string | null;
  route: string | null;
  icon: string | null;
  isImplemented: boolean;
  isSystem: boolean;
  displayOrder: number;
  supportsRead: boolean;
  supportsCreate: boolean;
  supportsUpdate: boolean;
  supportsDelete: boolean;
  specialActions: unknown;
  createdAt: Date;
  updatedAt: Date;
}

interface MemPermission {
  id: string;
  roleId: string;
  moduleId: string;
  canAccess: boolean;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  specialPermissions: unknown;
  updatedAt: Date;
}

interface MemSession {
  id: string;
  tokenHash: string;
  userId: string;
  createdAt: Date;
  lastSeenAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
}

interface MemChallenge {
  id: string;
  tokenHash: string;
  userId: string;
  purpose: string;
  attempts: number;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
}

function extractSessionCookie(setCookieHeader?: string[] | string): string {
  const list = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : setCookieHeader
      ? [setCookieHeader]
      : [];
  const match = list.find((c) => c.startsWith('scout_session='));
  if (!match) return '';
  return match.split(';')[0];
}

jest.setTimeout(60_000);

describe('Auth, Roles, Permissions & Security E2E', () => {
  let app: INestApplication;

  const users: MemUser[] = [];
  const roles: MemRole[] = [];
  const modules: MemModule[] = [];
  let permissions: MemPermission[] = [];
  const sessions: MemSession[] = [];
  const challenges: MemChallenge[] = [];
  const recoveryCodes: Array<{ id: string; codeHash: string; userId: string; usedAt: Date | null }> =
    [];
  const audits: Array<Record<string, unknown>> = [];

  const ADMIN_PASS = 'SuperAdminPassword12345!';
  const USER_PASS = 'SecretariaUserPass12345!';

  function buildPrismaMock() {
    const hydratePermission = (p: MemPermission) => ({
      ...p,
      role: roles.find((r) => r.id === p.roleId) ?? null,
      module: modules.find((m) => m.id === p.moduleId)!,
    });

    const hydrateRole = (r: MemRole) => ({
      ...r,
      _count: { users: users.filter((u) => u.roleId === r.id).length },
      permissions: permissions.filter((p) => p.roleId === r.id).map(hydratePermission),
    });

    const hydrateUser = (u: MemUser) => {
      const role = u.roleId ? roles.find((r) => r.id === u.roleId) : null;
      return {
        ...u,
        role: role ? hydrateRole(role) : null,
      };
    };

    const mock: Record<string, unknown> = {
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      user: {
        findMany: async ({ where }: { where?: { roleId?: string; isSuperAdmin?: boolean } } = {}) =>
          users
            .filter((u) => {
              if (where?.roleId !== undefined && u.roleId !== where.roleId) return false;
              if (where?.isSuperAdmin !== undefined && u.isSuperAdmin !== where.isSuperAdmin)
                return false;
              return true;
            })
            .map(hydrateUser),
        findUnique: async ({ where }: { where: { id?: string; email?: string } }) => {
          const found = users.find(
            (u) => (where.id && u.id === where.id) || (where.email && u.email === where.email),
          );
          return found ? hydrateUser(found) : null;
        },
        count: async ({ where }: { where?: { roleId?: string; isSuperAdmin?: boolean; status?: string } } = {}) =>
          users.filter((u) => {
            if (where?.roleId !== undefined && u.roleId !== where.roleId) return false;
            if (where?.isSuperAdmin !== undefined && u.isSuperAdmin !== where.isSuperAdmin)
              return false;
            if (where?.status !== undefined && u.status !== where.status) return false;
            return true;
          }).length,
        create: async ({ data }: { data: Partial<MemUser> }) => {
          const row: MemUser = {
            id: `user-${users.length + 1}`,
            email: data.email!,
            name: data.name!,
            passwordHash: data.passwordHash!,
            status: data.status ?? 'ACTIVE',
            isSuperAdmin: Boolean(data.isSuperAdmin),
            mustChangePassword: Boolean(data.mustChangePassword),
            mfaSecret: null,
            mfaPendingSecret: null,
            mfaConfiguredAt: null,
            failedLoginAttempts: 0,
            lockedUntil: null,
            roleId: data.roleId ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          users.push(row);
          return hydrateUser(row);
        },
        update: async ({ where, data }: { where: { id: string }; data: Partial<MemUser> }) => {
          const row = users.find((u) => u.id === where.id)!;
          Object.assign(row, data, { updatedAt: new Date() });
          return hydrateUser(row);
        },
        delete: async ({ where }: { where: { id: string } }) => {
          const idx = users.findIndex((u) => u.id === where.id);
          const [removed] = users.splice(idx, 1);
          return removed;
        },
      },
      role: {
        findMany: async ({ where }: { where?: { id?: { not?: string } } } = {}) =>
          roles
            .filter((r) => !where?.id?.not || r.id !== where.id.not)
            .map(hydrateRole),
        findUnique: async ({ where }: { where: { id: string } }) => {
          const r = roles.find((item) => item.id === where.id);
          return r ? hydrateRole(r) : null;
        },
        findUniqueOrThrow: async ({ where }: { where: { id: string } }) =>
          hydrateRole(roles.find((item) => item.id === where.id)!),
        create: async ({ data }: { data: { name: string; description?: string | null } }) => {
          const row: MemRole = {
            id: `role-${roles.length + 1}`,
            name: data.name,
            description: data.description ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          roles.push(row);
          return row;
        },
        update: async ({ where, data }: { where: { id: string }; data: Partial<MemRole> }) => {
          const row = roles.find((r) => r.id === where.id)!;
          Object.assign(row, data, { updatedAt: new Date() });
          return hydrateRole(row);
        },
        delete: async ({ where }: { where: { id: string } }) => {
          const idx = roles.findIndex((r) => r.id === where.id);
          const [removed] = roles.splice(idx, 1);
          permissions = permissions.filter((p) => p.roleId !== where.id);
          return removed;
        },
      },
      module: {
        findMany: async ({ where }: { where?: { id?: { in?: string[]; not?: string } } } = {}) =>
          modules
            .filter((m) => {
              if (where?.id?.in && !where.id.in.includes(m.id)) return false;
              if (where?.id?.not && m.id === where.id.not) return false;
              return true;
            })
            .sort((a, b) => a.displayOrder - b.displayOrder),
        findUnique: async ({ where }: { where: { id: string } }) =>
          modules.find((m) => m.id === where.id) ?? null,
        upsert: async ({
          where,
          create,
          update,
        }: {
          where: { key: string };
          create: Partial<MemModule>;
          update: Partial<MemModule>;
        }) => {
          const existing = modules.find((m) => m.key === where.key);
          if (existing) {
            Object.assign(existing, update, { updatedAt: new Date() });
            return existing;
          }
          const row: MemModule = {
            id: `mod-${modules.length + 1}`,
            key: create.key!,
            name: create.name!,
            description: create.description ?? null,
            route: create.route ?? null,
            icon: create.icon ?? null,
            isImplemented: Boolean(create.isImplemented),
            isSystem: Boolean(create.isSystem),
            displayOrder: create.displayOrder ?? 0,
            supportsRead: create.supportsRead ?? true,
            supportsCreate: create.supportsCreate ?? true,
            supportsUpdate: create.supportsUpdate ?? true,
            supportsDelete: create.supportsDelete ?? true,
            specialActions: create.specialActions ?? [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          modules.push(row);
          return row;
        },
        create: async ({ data }: { data: Partial<MemModule> }) => {
          const row: MemModule = {
            id: `mod-${modules.length + 1}`,
            key: data.key!,
            name: data.name!,
            description: data.description ?? null,
            route: data.route ?? null,
            icon: data.icon ?? null,
            isImplemented: Boolean(data.isImplemented),
            isSystem: Boolean(data.isSystem),
            displayOrder: data.displayOrder ?? modules.length + 1,
            supportsRead: data.supportsRead ?? true,
            supportsCreate: data.supportsCreate ?? true,
            supportsUpdate: data.supportsUpdate ?? true,
            supportsDelete: data.supportsDelete ?? true,
            specialActions: data.specialActions ?? [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          modules.push(row);
          return row;
        },
      },
      permission: {
        findMany: async () => permissions.map(hydratePermission),
        createMany: async ({ data }: { data: Array<Omit<MemPermission, 'id' | 'updatedAt'>> }) => {
          for (const item of data) {
            permissions.push({
              id: `perm-${permissions.length + 1}`,
              updatedAt: new Date(),
              ...item,
            });
          }
          return { count: data.length };
        },
        upsert: async ({
          where,
          create,
          update,
        }: {
          where: { roleId_moduleId: { roleId: string; moduleId: string } };
          create: Omit<MemPermission, 'id' | 'updatedAt'>;
          update: Partial<MemPermission>;
        }) => {
          const existing = permissions.find(
            (p) =>
              p.roleId === where.roleId_moduleId.roleId &&
              p.moduleId === where.roleId_moduleId.moduleId,
          );
          if (existing) {
            Object.assign(existing, update, { updatedAt: new Date() });
            return existing;
          }
          const row: MemPermission = {
            id: `perm-${permissions.length + 1}`,
            updatedAt: new Date(),
            ...create,
          };
          permissions.push(row);
          return row;
        },
      },
      session: {
        create: async ({ data }: { data: Omit<MemSession, 'id' | 'createdAt' | 'revokedAt'> }) => {
          const row: MemSession = {
            id: `sess-${sessions.length + 1}`,
            createdAt: new Date(),
            revokedAt: null,
            ...data,
          };
          sessions.push(row);
          return row;
        },
        findUnique: async ({ where }: { where: { tokenHash: string } }) => {
          const row = sessions.find((s) => s.tokenHash === where.tokenHash);
          if (!row) return null;
          const user = users.find((u) => u.id === row.userId)!;
          return { ...row, user: hydrateUser(user) };
        },
        update: async ({ where, data }: { where: { id: string }; data: Partial<MemSession> }) => {
          const row = sessions.find((s) => s.id === where.id)!;
          Object.assign(row, data);
          return row;
        },
        updateMany: async ({
          where,
          data,
        }: {
          where: { userId?: string | { in: string[] }; tokenHash?: string; revokedAt?: null };
          data: Partial<MemSession>;
        }) => {
          const targetIds =
            typeof where.userId === 'object' && where.userId?.in
              ? where.userId.in
              : where.userId
                ? [where.userId]
                : null;
          let count = 0;
          for (const row of sessions) {
            if (targetIds && !targetIds.includes(row.userId)) continue;
            if (where.tokenHash && row.tokenHash !== where.tokenHash) continue;
            if (where.revokedAt === null && row.revokedAt !== null) continue;
            Object.assign(row, data);
            count += 1;
          }
          return { count };
        },
      },
      mfaChallenge: {
        create: async ({
          data,
        }: {
          data: Omit<MemChallenge, 'id' | 'attempts' | 'consumedAt' | 'createdAt'>;
        }) => {
          const row: MemChallenge = {
            id: `ch-${challenges.length + 1}`,
            attempts: 0,
            consumedAt: null,
            createdAt: new Date(),
            ...data,
          };
          challenges.push(row);
          return row;
        },
        findUnique: async ({ where }: { where: { tokenHash: string } }) => {
          const row = challenges.find((c) => c.tokenHash === where.tokenHash);
          if (!row) return null;
          const user = users.find((u) => u.id === row.userId)!;
          return { ...row, user };
        },
        update: async ({ where, data }: { where: { id: string }; data: Partial<MemChallenge> }) => {
          const row = challenges.find((c) => c.id === where.id)!;
          Object.assign(row, data);
          return row;
        },
        updateMany: async ({
          where,
          data,
        }: {
          where: { id?: string; userId?: string | { in: string[] }; consumedAt?: null };
          data: Partial<MemChallenge>;
        }) => {
          const targetIds =
            typeof where.userId === 'object' && where.userId?.in
              ? where.userId.in
              : where.userId
                ? [where.userId]
                : null;
          let count = 0;
          for (const row of challenges) {
            if (where.id && row.id !== where.id) continue;
            if (targetIds && !targetIds.includes(row.userId)) continue;
            if (where.consumedAt === null && row.consumedAt !== null) continue;
            Object.assign(row, data);
            count += 1;
          }
          return { count };
        },
      },
      recoveryCode: {
        findMany: async ({ where }: { where: { userId: string; usedAt: null } }) =>
          recoveryCodes.filter((rc) => rc.userId === where.userId && rc.usedAt === null),
        deleteMany: async ({ where }: { where: { userId: string } }) => {
          let count = 0;
          for (let i = recoveryCodes.length - 1; i >= 0; i--) {
            if (recoveryCodes[i].userId === where.userId) {
              recoveryCodes.splice(i, 1);
              count += 1;
            }
          }
          return { count };
        },
        createMany: async ({ data }: { data: Array<{ userId: string; codeHash: string }> }) => {
          for (const item of data) {
            recoveryCodes.push({
              id: `rc-${recoveryCodes.length + 1}`,
              userId: item.userId,
              codeHash: item.codeHash,
              usedAt: null,
            });
          }
          return { count: data.length };
        },
        updateMany: async ({
          where,
          data,
        }: {
          where: { id: string; usedAt: null };
          data: { usedAt: Date };
        }) => {
          let count = 0;
          for (const rc of recoveryCodes) {
            if (rc.id === where.id && rc.usedAt === null) {
              rc.usedAt = data.usedAt;
              count += 1;
            }
          }
          return { count };
        },
      },
      auditEvent: {
        create: async ({ data }: { data: Record<string, unknown> }) => {
          const row = { id: `audit-${audits.length + 1}`, createdAt: new Date(), ...data };
          audits.push(row);
          return row;
        },
        findMany: async () =>
          [...audits].reverse().map((ev) => ({
            ...ev,
            actor: ev.actorId
              ? users.find((u) => u.id === ev.actorId)
                ? {
                    id: ev.actorId,
                    name: users.find((u) => u.id === ev.actorId)!.name,
                    email: users.find((u) => u.id === ev.actorId)!.email,
                  }
                : null
              : null,
          })),
      },
      applicant: {
        findMany: async () => [],
      },
      councilMember: {
        findMany: async () => [],
      },
      $transaction: async (input: unknown) => {
        if (typeof input === 'function') {
          return (input as (tx: Record<string, unknown>) => Promise<unknown>)(mock);
        }
        return Promise.all(input as Array<Promise<unknown>>);
      },
    };
    return mock;
  }

  const secretsByEmail = new Map<string, string>();

  async function authenticateUser(
    email: string,
    password: string,
  ): Promise<{ cookie: string; recoveryCodes: string[] }> {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    const { status, challenge, setup } = loginRes.body as {
      status: 'MFA_REQUIRED' | 'MFA_SETUP_REQUIRED';
      challenge: string;
      setup?: { secret: string };
    };

    if (status === 'MFA_SETUP_REQUIRED' && setup?.secret) {
      secretsByEmail.set(email, setup.secret);
      const code = generateSync({ secret: setup.secret });
      const confirmRes = await request(app.getHttpServer())
        .post('/auth/mfa/confirm-setup')
        .send({ challenge, code })
        .expect(201);
      return {
        cookie: extractSessionCookie(confirmRes.headers['set-cookie']),
        recoveryCodes: (confirmRes.body as { recoveryCodes?: string[] }).recoveryCodes ?? [],
      };
    }

    const secret = secretsByEmail.get(email);
    if (!secret) {
      throw new Error(`Missing cached MFA secret for ${email}`);
    }
    const code = generateSync({ secret });
    const mfaRes = await request(app.getHttpServer())
      .post('/auth/mfa')
      .send({ challenge, code })
      .expect(201);
    return {
      cookie: extractSessionCookie(mfaRes.headers['set-cookie']),
      recoveryCodes: [],
    };
  }

  beforeAll(async () => {
    process.env.MFA_ENCRYPTION_KEY = Buffer.alloc(32, 11).toString('base64');

    const adminHash = await argon2.hash(ADMIN_PASS);
    const userHash = await argon2.hash(USER_PASS);

    for (const mod of BUILT_IN_MODULES) {
      modules.push({
        id: `mod-${mod.key}`,
        key: mod.key,
        name: mod.name,
        description: mod.description,
        route: mod.route,
        icon: mod.icon,
        isImplemented: mod.isImplemented,
        isSystem: mod.isSystem,
        displayOrder: mod.displayOrder,
        supportsRead: mod.supportsRead,
        supportsCreate: mod.supportsCreate,
        supportsUpdate: mod.supportsUpdate,
        supportsDelete: mod.supportsDelete,
        specialActions: mod.specialActions,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    roles.push(
      {
        id: 'role-jef',
        name: 'Jefatura',
        description: 'Jefatura',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'role-sec',
        name: 'Secretaría',
        description: 'Secretaría',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'role-tes',
        name: 'Tesorería',
        description: 'Tesorería',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    );

    permissions.push(
      {
        id: 'p-jef-jef',
        roleId: 'role-jef',
        moduleId: 'mod-jefatura',
        canAccess: true,
        canRead: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
        specialPermissions: [],
        updatedAt: new Date(),
      },
      {
        id: 'p-sec-sec',
        roleId: 'role-sec',
        moduleId: 'mod-secretaria',
        canAccess: true,
        canRead: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
        specialPermissions: ['read_medical_data', 'read_bank_data', 'manage_web_content'],
        updatedAt: new Date(),
      },
      {
        id: 'p-tes-tes',
        roleId: 'role-tes',
        moduleId: 'mod-tesoreria',
        canAccess: true,
        canRead: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
        specialPermissions: ['export_sepa'],
        updatedAt: new Date(),
      },
    );

    users.push(
      {
        id: 'sa-1',
        email: 'superadmin@example.org',
        name: 'Superadmin',
        passwordHash: adminHash,
        status: 'ACTIVE',
        isSuperAdmin: true,
        mustChangePassword: false,
        mfaSecret: null,
        mfaPendingSecret: null,
        mfaConfiguredAt: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        roleId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'u-sec',
        email: 'sec@example.org',
        name: 'Responsable Secretaría',
        passwordHash: userHash,
        status: 'ACTIVE',
        isSuperAdmin: false,
        mustChangePassword: false,
        mfaSecret: null,
        mfaPendingSecret: null,
        mfaConfiguredAt: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        roleId: 'role-sec',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'u-jef',
        email: 'jef@example.org',
        name: 'Responsable Jefatura',
        passwordHash: userHash,
        status: 'ACTIVE',
        isSuperAdmin: false,
        mustChangePassword: false,
        mfaSecret: null,
        mfaPendingSecret: null,
        mfaConfiguredAt: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        roleId: 'role-jef',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(buildPrismaMock())
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  }, 45_000);

  afterAll(async () => {
    await app?.close();
  });

  it('impide usar el token challenge pre-MFA como cookie de sesión en endpoints protegidos', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'jef@example.org', password: USER_PASS })
      .expect(201);

    const challengeCookie = `scout_session=${(loginRes.body as { challenge: string }).challenge}`;
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', challengeCookie)
      .expect(401);

    await request(app.getHttpServer())
      .get('/admin/users')
      .set('Cookie', challengeCookie)
      .expect(401);

    await request(app.getHttpServer())
      .get('/applications')
      .set('Cookie', challengeCookie)
      .expect(401);
  });

  it('bloquea acceso a administración y escalada de privilegios por usuarios no superadministradores', async () => {
    const { cookie: jefCookie } = await authenticateUser('jef@example.org', USER_PASS);

    await request(app.getHttpServer())
      .get('/admin/users')
      .set('Cookie', jefCookie)
      .expect(403);

    await request(app.getHttpServer())
      .post('/admin/roles')
      .set('Cookie', jefCookie)
      .send({ name: 'Cargo No Autorizado' })
      .expect(403);

    // Un usuario de Jefatura no puede acceder al módulo Secretaría ni a Contenido web
    await request(app.getHttpServer())
      .get('/applications')
      .set('Cookie', jefCookie)
      .expect(403);

    await request(app.getHttpServer())
      .get('/council/manage')
      .set('Cookie', jefCookie)
      .expect(403);

    expect(audits.some((a) => a.action === 'ACCESS_DENIED' && a.result === 'DENIED')).toBe(true);
  });

  it('rechaza peticiones manipuladas que intenten inyectar isSuperAdmin o proteger al último superadmin', async () => {
    const { cookie: adminCookie } = await authenticateUser('superadmin@example.org', ADMIN_PASS);

    // ValidationPipe(forbidNonWhitelisted) bloquea intento de asignar isSuperAdmin en POST /admin/users
    await request(app.getHttpServer())
      .post('/admin/users')
      .set('Cookie', adminCookie)
      .send({
        name: 'Escalado',
        email: 'escalado@example.org',
        isSuperAdmin: true,
      })
      .expect(400);

    // No se puede desactivar ni eliminar al último superadministrador
    await request(app.getHttpServer())
      .post('/admin/users/sa-1/deactivate')
      .set('Cookie', adminCookie)
      .expect(400);

    await request(app.getHttpServer())
      .delete('/admin/users/sa-1')
      .set('Cookie', adminCookie)
      .expect(400);
  });

  it('revoca sesiones activas cuando se retiran permisos al cargo Secretaría (sin bypass por nombre) o se desactiva una cuenta', async () => {
    const { cookie: adminCookie } = await authenticateUser('superadmin@example.org', ADMIN_PASS);
    const { cookie: secCookie } = await authenticateUser('sec@example.org', USER_PASS);

    // Inicialmente Secretaría accede a /applications y /council/manage
    await request(app.getHttpServer())
      .get('/applications')
      .set('Cookie', secCookie)
      .expect(200);
    await request(app.getHttpServer())
      .get('/council/manage')
      .set('Cookie', secCookie)
      .expect(200);

    // Superadmin retira al cargo Secretaría el acceso a su módulo
    await request(app.getHttpServer())
      .put('/admin/roles/role-sec/permissions')
      .set('Cookie', adminCookie)
      .send({
        permissions: [
          {
            moduleId: 'mod-secretaria',
            canAccess: false,
            canRead: false,
            canCreate: false,
            canUpdate: false,
            canDelete: false,
            specialPermissions: [],
          },
        ],
      })
      .expect(200);

    // La sesión previa queda invalidada inmediatamente (401)
    await request(app.getHttpServer())
      .get('/applications')
      .set('Cookie', secCookie)
      .expect(401);

    // Incluso tras volver a autenticarse, el cargo llamado "Secretaría" ya no tiene acceso (403)
    const { cookie: secCookieAfterRevoke } = await authenticateUser('sec@example.org', USER_PASS);
    await request(app.getHttpServer())
      .get('/applications')
      .set('Cookie', secCookieAfterRevoke)
      .expect(403);
    await request(app.getHttpServer())
      .get('/council/manage')
      .set('Cookie', secCookieAfterRevoke)
      .expect(403);

    // Desactivar la cuenta invalida su sesión activa inmediatamente (401)
    await request(app.getHttpServer())
      .post('/admin/users/u-sec/deactivate')
      .set('Cookie', adminCookie)
      .expect(201);
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', secCookieAfterRevoke)
      .expect(401);

    const auditRes = await request(app.getHttpServer())
      .get('/admin/audit')
      .set('Cookie', adminCookie)
      .expect(200);
    expect(
      (auditRes.body as Array<{ action: string }>).some(
        (ev) => ev.action === 'ROLE_PERMISSIONS_UPDATED',
      ),
    ).toBe(true);
  });

  it('impide eliminar un cargo con usuarios asignados y permite crear nuevo módulo + cargo y consultar auditoría', async () => {
    const { cookie: adminCookie } = await authenticateUser('superadmin@example.org', ADMIN_PASS);

    await request(app.getHttpServer())
      .delete('/admin/roles/role-jef')
      .set('Cookie', adminCookie)
      .expect(409);

    const newModRes = await request(app.getHttpServer())
      .post('/admin/modules')
      .set('Cookie', adminCookie)
      .send({
        name: 'Intendencia',
        description: 'Material de acampada',
        supportsDelete: false,
      })
      .expect(201);

    const newRoleRes = await request(app.getHttpServer())
      .post('/admin/roles')
      .set('Cookie', adminCookie)
      .send({
        name: 'Equipo Material',
        description: 'Responsable de material',
      })
      .expect(201);

    await request(app.getHttpServer())
      .put(`/admin/roles/${(newRoleRes.body as { id: string }).id}/permissions`)
      .set('Cookie', adminCookie)
      .send({
        permissions: [
          {
            moduleId: (newModRes.body as { id: string }).id,
            canAccess: true,
            canRead: true,
            canCreate: true,
            canUpdate: true,
            canDelete: true,
            specialPermissions: [],
          },
        ],
      })
      .expect(200)
      .expect((res) => {
        const perms = (res.body as { permissions: Array<{ moduleId: string; canDelete: boolean; canRead: boolean }> })
          .permissions;
        const modPerm = perms.find((p) => p.moduleId === (newModRes.body as { id: string }).id);
        expect(modPerm?.canRead).toBe(true);
        expect(modPerm?.canDelete).toBe(false);
      });
  });
});
