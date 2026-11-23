import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import {
  AdminRoute,
  AuthProvider,
  DEFAULT_REGISTERED_MODULES,
  getModuleCapabilities,
  ModuleRoute,
  WebContentRoute,
  type User,
} from '../auth';
import AdminPermissionsTable from '../components/administracion/AdminPermissionsTable';
import AdminRolesSection from '../components/administracion/AdminRolesSection';
import CouncilMemberList from '../components/contenido-web/CouncilMemberList';
import GestionPage from '../pages/GestionPage';
import type { AdminRole } from '../services/api';

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
  equal<T>(actual: T, expected: T) {
    if (actual !== expected) {
      throw new Error(`Expected ${String(actual)} to equal ${String(expected)}`);
    }
  },
};

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
          canRead: false,
          canCreate: false,
          canUpdate: false,
          canDelete: false,
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

  test('GestionPage muestra candado y bloquea la navegación en módulos sin acceso', () => {
    const blockedHtml = renderWithAuth(userWithoutPermissions, '/gestion', <GestionPage />);
    assert.match(blockedHtml, /Jefatura/);
    assert.match(blockedHtml, /Secretaría/);
    assert.match(blockedHtml, /Tesorería/);
    assert.match(blockedHtml, /Contenido de la web/);
    assert.match(blockedHtml, /Sin acceso habilitado para tu cargo/);
    assert.match(blockedHtml, /aria-disabled="true"/);
    assert.match(blockedHtml, /aria-label="Sin acceso"/);
    assert.doesNotMatch(blockedHtml, /href="\/gestion\/secretaria"/);
    assert.doesNotMatch(blockedHtml, /href="\/gestion\/jefatura"/);
    assert.doesNotMatch(blockedHtml, /href="\/gestion\/tesoreria"/);
    assert.doesNotMatch(blockedHtml, /href="\/gestion\/contenido-web"/);
    assert.doesNotMatch(blockedHtml, /Administración/);

    const secHtml = renderWithAuth(secretariaAuthorizedUser, '/gestion', <GestionPage />);
    assert.match(secHtml, /href="\/gestion\/secretaria"/);
    assert.match(secHtml, /href="\/gestion\/contenido-web"/);
    assert.doesNotMatch(secHtml, /href="\/gestion\/jefatura"/);
  });

  test('Entrar por URL a módulos sin permiso redirige a /gestion y no muestra pantalla de acceso denegado', () => {
    const routes = (
      <Routes>
        <Route path="/gestion" element={<div>PANEL_GESTION</div>} />
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
    assert.doesNotMatch(secHtml, /No tienes acceso/);
    assert.doesNotMatch(secHtml, /CONTENIDO_PRIVADO_SECRETARIA/);

    const jefHtml = renderWithAuth(userWithoutPermissions, '/gestion/jefatura', routes);
    assert.doesNotMatch(jefHtml, /No tienes acceso/);
    assert.doesNotMatch(jefHtml, /CONTENIDO_PRIVADO_JEFATURA/);

    const webHtml = renderWithAuth(userWithoutPermissions, '/gestion/contenido-web', routes);
    assert.doesNotMatch(webHtml, /No tienes acceso/);
    assert.doesNotMatch(webHtml, /CONTENIDO_PRIVADO_WEB/);

    const adminHtml = renderWithAuth(secretariaAuthorizedUser, '/gestion/administracion', routes);
    assert.doesNotMatch(adminHtml, /No tienes acceso/);
    assert.doesNotMatch(adminHtml, /CONTENIDO_PRIVADO_ADMIN/);
  });

  test('Usuario con canAccess accede a Secretaría, Contenido web y recibe todas las capacidades del módulo', () => {
    const caps = getModuleCapabilities(secretariaAuthorizedUser, 'secretaria');
    assert.equal(caps.canAccess, true);
    assert.equal(caps.canRead, true);
    assert.equal(caps.canCreate, true);
    assert.equal(caps.canUpdate, true);
    assert.equal(caps.canDelete, true);

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

  test('La configuración de cargos solo permite activar o desactivar el acceso por módulo', () => {
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
            canDelete: true,
            specialPermissions: [],
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

    const rolesHtml = renderToStaticMarkup(
      <AdminRolesSection
        roles={roles}
        modules={modulesWithIds}
        roleForm={{ name: '', description: '' }}
        onRoleFormChange={() => undefined}
        onCreateRole={async () => undefined}
        onUpdateRole={async () => undefined}
        onToggleRoleModuleAccess={async () => undefined}
        onRequestDeleteRole={() => undefined}
      />,
    );

    assert.match(rolesHtml, /Acceso a módulos/);
    assert.match(rolesHtml, /aria-label="Acceso de Secretaría a Secretaría"[^>]*checked=""/);
    assert.doesNotMatch(rolesHtml, /aria-label="Acceso de Secretaría a Jefatura"[^>]*checked=""/);
    assert.doesNotMatch(rolesHtml, /Operaciones especiales/);

    const tableHtml = renderToStaticMarkup(
      <AdminPermissionsTable
        roles={roles}
        modules={modulesWithIds}
        selectedRoleId="role-sec"
        onSelectRole={() => undefined}
        onSaveRolePermissions={async () => undefined}
      />,
    );

    assert.match(tableHtml, /Acceso a módulos por cargo/);
    assert.match(tableHtml, /aria-label="Secretaría Acceso"[^>]*checked=""/);
    assert.doesNotMatch(tableHtml, /aria-label="Jefatura Acceso"[^>]*checked=""/);
    assert.doesNotMatch(tableHtml, />Leer</);
    assert.doesNotMatch(tableHtml, />Crear</);
    assert.doesNotMatch(tableHtml, />Editar</);
    assert.doesNotMatch(tableHtml, />Eliminar</);
  });

  test('CouncilMemberList respeta capacidades CRUD cuando el componente las recibe', () => {
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
