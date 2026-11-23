import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const assert = {
  match(actual: string, pattern: RegExp) {
    if (!pattern.test(actual)) {
      throw new Error(`Expected output to match ${pattern.toString()}, got: ${actual.slice(0, 300)}`);
    }
  },
  doesNotMatch(actual: string, pattern: RegExp) {
    if (pattern.test(actual)) {
      throw new Error(`Expected output NOT to match ${pattern.toString()}`);
    }
  },
};
import {
  AdminRoute,
  AuthProvider,
  DEFAULT_REGISTERED_MODULES,
  ModuleRoute,
  WebContentRoute,
  type User,
} from '../auth';
import AdminPermissionsTable from '../components/administracion/AdminPermissionsTable';
import CouncilMemberList from '../components/contenido-web/CouncilMemberList';
import GestionPage from '../pages/GestionPage';
import type { AdminRole } from '../services/api';

function renderWithAuth(user: User | null, initialEntry: string, element: React.ReactNode) {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider initialUser={user} skipInitialFetch>
        {element}
      </AuthProvider>
    </MemoryRouter>,
  );
}

export async function runPermissionTests() {
  const cases: Array<{ name: string; fn: () => void | Promise<void> }> = [];
  const test = (name: string, fn: () => void | Promise<void>) => {
    cases.push({ name, fn });
  };

  const userWithoutPermissions: User = {
    id: 'u-empty',
    email: 'sinpermisos@example.org',
    name: 'Usuario Sin Permisos',
    status: 'ACTIVE',
    isSuperAdmin: false,
    mustChangePassword: false,
    role: {
      id: 'r-empty',
      name: 'Secretaría',
      permissions: [
        {
          canAccess: false,
          canRead: true,
          canCreate: true,
          canUpdate: true,
          canDelete: true,
          specialPermissions: ['manage_web_content'],
          module: { key: 'secretaria', name: 'Secretaría' },
        },
      ],
    },
    modules: DEFAULT_REGISTERED_MODULES,
  };

  const secretariaAuthorizedUser: User = {
    id: 'u-sec',
    email: 'sec@example.org',
    name: 'Equipo Secretaría',
    status: 'ACTIVE',
    isSuperAdmin: false,
    mustChangePassword: false,
    role: {
      id: 'r-sec',
      name: 'Gestión Documental',
      permissions: [
        {
          canAccess: true,
          canRead: true,
          canCreate: true,
          canUpdate: true,
          canDelete: false,
          specialPermissions: ['manage_web_content'],
          module: { key: 'secretaria', name: 'Secretaría' },
        },
      ],
    },
    modules: DEFAULT_REGISTERED_MODULES,
  };

  const superAdminUser: User = {
    id: 'sa-1',
    email: 'admin@example.org',
    name: 'Superadministrador',
    status: 'ACTIVE',
    isSuperAdmin: true,
    mustChangePassword: false,
    role: null,
    modules: DEFAULT_REGISTERED_MODULES,
  };

  test('GestionPage mantiene todos los módulos visibles aunque el usuario no tenga acceso', () => {
    const html = renderWithAuth(userWithoutPermissions, '/gestion', <GestionPage />);
    assert.match(html, /Jefatura/);
    assert.match(html, /Secretaría/);
    assert.match(html, /Tesorería/);
    assert.match(html, /Contenido de la web/);
    assert.match(html, /Sin acceso habilitado para tu cargo/);
    assert.doesNotMatch(html, /Administración/);
  });

  test('Entrar por URL a módulos sin permiso muestra AccessDeniedView y no monta el contenido privado (ni siquiera por nombre Secretaría)', () => {
    const routes = (
      <Routes>
        <Route
          path="/gestion/secretaria"
          element={
            <ModuleRoute moduleKey="secretaria" moduleLabel="Secretaría">
              <div>CONTENIDO_PRIVADO_SECRETARIA</div>
            </ModuleRoute>
          }
        />
        <Route
          path="/gestion/jefatura"
          element={
            <ModuleRoute moduleKey="jefatura" moduleLabel="Jefatura">
              <div>CONTENIDO_PRIVADO_JEFATURA</div>
            </ModuleRoute>
          }
        />
        <Route
          path="/gestion/contenido-web"
          element={
            <WebContentRoute>
              <div>CONTENIDO_PRIVADO_WEB</div>
            </WebContentRoute>
          }
        />
        <Route
          path="/gestion/administracion"
          element={
            <AdminRoute>
              <div>CONTENIDO_PRIVADO_ADMIN</div>
            </AdminRoute>
          }
        />
      </Routes>
    );

    const secHtml = renderWithAuth(userWithoutPermissions, '/gestion/secretaria', routes);
    assert.match(secHtml, /No tienes acceso a Secretaría/);
    assert.match(secHtml, /Volver al panel de gestión/);
    assert.doesNotMatch(secHtml, /CONTENIDO_PRIVADO_SECRETARIA/);

    const jefHtml = renderWithAuth(userWithoutPermissions, '/gestion/jefatura', routes);
    assert.match(jefHtml, /No tienes acceso a Jefatura/);
    assert.doesNotMatch(jefHtml, /CONTENIDO_PRIVADO_JEFATURA/);

    const webHtml = renderWithAuth(userWithoutPermissions, '/gestion/contenido-web', routes);
    assert.match(webHtml, /No tienes acceso a Contenido de la web/);
    assert.doesNotMatch(webHtml, /CONTENIDO_PRIVADO_WEB/);

    const adminHtml = renderWithAuth(secretariaAuthorizedUser, '/gestion/administracion', routes);
    assert.match(adminHtml, /No tienes acceso a Administración/);
    assert.doesNotMatch(adminHtml, /CONTENIDO_PRIVADO_ADMIN/);
  });

  test('Usuario autorizado accede normalmente a Secretaría, Contenido web y Superadmin a Administración', () => {
    const secHtml = renderWithAuth(
      secretariaAuthorizedUser,
      '/gestion/secretaria',
      <ModuleRoute moduleKey="secretaria" moduleLabel="Secretaría">
        <div>CONTENIDO_PRIVADO_SECRETARIA</div>
      </ModuleRoute>,
    );
    assert.match(secHtml, /CONTENIDO_PRIVADO_SECRETARIA/);

    const webHtml = renderWithAuth(
      secretariaAuthorizedUser,
      '/gestion/contenido-web',
      <WebContentRoute>
        <div>CONTENIDO_PRIVADO_WEB</div>
      </WebContentRoute>,
    );
    assert.match(webHtml, /CONTENIDO_PRIVADO_WEB/);

    const adminHtml = renderWithAuth(
      superAdminUser,
      '/gestion/administracion',
      <AdminRoute>
        <div>CONTENIDO_PRIVADO_ADMIN</div>
      </AdminRoute>,
    );
    assert.match(adminHtml, /CONTENIDO_PRIVADO_ADMIN/);
  });

  test('AdminPermissionsTable refleja exactamente los permisos guardados del cargo', () => {
    const roles: AdminRole[] = [
      {
        id: 'role-sec',
        name: 'Secretaría',
        description: 'Cargo Secretaría',
        _count: { users: 2 },
        permissions: [
          {
            id: 'p-1',
            roleId: 'role-sec',
            moduleId: 'mod-sec',
            canAccess: true,
            canRead: true,
            canCreate: true,
            canUpdate: true,
            canDelete: false,
            specialPermissions: ['read_medical_data', 'manage_web_content'],
            module: { ...DEFAULT_REGISTERED_MODULES[1], id: 'mod-sec' },
          },
          {
            id: 'p-2',
            roleId: 'role-sec',
            moduleId: 'mod-jef',
            canAccess: false,
            canRead: false,
            canCreate: false,
            canUpdate: false,
            canDelete: false,
            specialPermissions: [],
            module: { ...DEFAULT_REGISTERED_MODULES[0], id: 'mod-jef' },
          },
        ],
      },
    ];

    const modulesWithIds = [
      { ...DEFAULT_REGISTERED_MODULES[0], id: 'mod-jef' },
      { ...DEFAULT_REGISTERED_MODULES[1], id: 'mod-sec' },
    ];

    const html = renderToStaticMarkup(
      <AdminPermissionsTable
        roles={roles}
        modules={modulesWithIds}
        selectedRoleId="role-sec"
        onSelectRole={() => undefined}
        onSaveRolePermissions={async () => undefined}
      />,
    );

    assert.match(html, /Secretaría/);
    assert.match(html, /Jefatura/);
    assert.match(html, /Datos médicos/);
    assert.match(html, /Contenido de la web/);
    assert.match(html, /aria-label="Acceso al módulo Secretaría"[^>]*checked=""/);
    assert.match(html, /aria-label="Secretaría Datos médicos"[^>]*checked=""/);
  });

  test('CouncilMemberList respeta capacidades CRUD granulares en la UI', () => {
    const members = [
      {
        id: 'm-1',
        fullName: 'Ana Prueba',
        role: 'Jefatura' as const,
        personalBio: 'Bio',
        displayOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const readOnlyHtml = renderToStaticMarkup(
      <CouncilMemberList
        members={members}
        loading={false}
        saving={false}
        canCreate={false}
        canUpdate={false}
        canDelete={false}
        onAdd={() => undefined}
        onEdit={() => undefined}
        onDelete={() => undefined}
        onMove={() => undefined}
      />,
    );
    assert.match(readOnlyHtml, /Ana Prueba/);
    assert.doesNotMatch(readOnlyHtml, /Editar/);
    assert.doesNotMatch(readOnlyHtml, /Eliminar/);

    const fullHtml = renderToStaticMarkup(
      <CouncilMemberList
        members={members}
        loading={false}
        saving={false}
        canCreate
        canUpdate
        canDelete
        onAdd={() => undefined}
        onEdit={() => undefined}
        onDelete={() => undefined}
        onMove={() => undefined}
      />,
    );
    assert.match(fullHtml, /Editar/);
    assert.match(fullHtml, /Eliminar/);
  });

  let passed = 0;
  for (const c of cases) {
    await c.fn();
    passed += 1;
    console.log(`PASS: ${c.name}`);
  }
  console.log(`\n${passed}/${cases.length} frontend permission tests passed.`);
}
