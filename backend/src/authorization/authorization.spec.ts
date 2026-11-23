import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthorizationService } from './authorization.service';
import {
  BUILT_IN_MODULES,
  INITIAL_ROLES,
  canReadSensitiveData,
  hasModuleAccess,
  hasModulePermission,
  hasSpecialPermission,
  hasWebContentPermission,
  isReservedRoleName,
  isSuperAdminUser,
  sanitizeAuditValue,
  type AuthorizedUser,
} from './module-registry';

describe('Authorization - Fuente única de verdad y reglas de seguridad', () => {
  it('define únicamente los 3 módulos y 3 cargos iniciales solicitados', () => {
    expect(BUILT_IN_MODULES.map((m) => m.key)).toEqual(['jefatura', 'secretaria', 'tesoreria']);
    expect(INITIAL_ROLES.map((r) => r.name)).toEqual(['Jefatura', 'Tesorería', 'Secretaría']);
    expect(INITIAL_ROLES.map((r) => r.defaultModuleKey)).toEqual([
      'jefatura',
      'tesoreria',
      'secretaria',
    ]);
  });

  it('deniega por defecto cuando no hay cargo o no hay permisos explícitos', () => {
    const withoutRole: AuthorizedUser = { id: 'u1', status: 'ACTIVE', isSuperAdmin: false, role: null };
    expect(hasModuleAccess(withoutRole, 'secretaria')).toBe(false);
    expect(hasModulePermission(withoutRole, 'secretaria', 'read')).toBe(false);
    expect(hasSpecialPermission(withoutRole, 'secretaria', 'manage_web_content')).toBe(false);
    expect(canReadSensitiveData(withoutRole, 'medical')).toBe(false);
    expect(canReadSensitiveData(withoutRole, 'bank')).toBe(false);
    expect(hasWebContentPermission(withoutRole, 'read')).toBe(false);
  });

  it('no autoriza jamás por el nombre del cargo (elimina bypass por nombre Secretaría)', () => {
    const fakeSecretaria: AuthorizedUser = {
      id: 'u-sec-fake',
      status: 'ACTIVE',
      isSuperAdmin: false,
      role: {
        id: 'r-sec',
        name: 'Secretaría',
        permissions: [
          {
            canAccess: false,
            canRead: true,
            canCreate: true,
            canUpdate: true,
            canDelete: true,
            specialPermissions: ['read_medical_data', 'read_bank_data', 'manage_web_content'],
            module: { key: 'secretaria', name: 'Secretaría' },
          },
        ],
      },
    };

    expect(hasModuleAccess(fakeSecretaria, 'secretaria')).toBe(false);
    expect(hasModulePermission(fakeSecretaria, 'secretaria', 'read')).toBe(false);
    expect(hasModulePermission(fakeSecretaria, 'secretaria', 'update')).toBe(false);
    expect(canReadSensitiveData(fakeSecretaria, 'medical')).toBe(false);
    expect(canReadSensitiveData(fakeSecretaria, 'bank')).toBe(false);
    expect(hasWebContentPermission(fakeSecretaria, 'update')).toBe(false);

    const customRoleAuthorized: AuthorizedUser = {
      id: 'u-custom',
      status: 'ACTIVE',
      isSuperAdmin: false,
      role: {
        id: 'r-custom',
        name: 'Comisión de Verano',
        permissions: [
          {
            canAccess: true,
            canRead: true,
            canCreate: false,
            canUpdate: false,
            canDelete: false,
            specialPermissions: ['manage_web_content'],
            module: { key: 'secretaria', name: 'Secretaría' },
          },
        ],
      },
    };

    expect(hasModuleAccess(customRoleAuthorized, 'secretaria')).toBe(true);
    expect(hasModulePermission(customRoleAuthorized, 'secretaria', 'read')).toBe(true);
    expect(hasWebContentPermission(customRoleAuthorized, 'read')).toBe(true);
    expect(hasWebContentPermission(customRoleAuthorized, 'delete')).toBe(false);
    expect(canReadSensitiveData(customRoleAuthorized, 'medical')).toBe(false);
  });

  it('aisla permisos iniciales entre Jefatura, Tesorería y Secretaría sin fugas cruzadas', () => {
    const jefaturaUser: AuthorizedUser = {
      id: 'u-jef',
      status: 'ACTIVE',
      isSuperAdmin: false,
      role: {
        name: 'Jefatura',
        permissions: [
          {
            canAccess: true,
            canRead: true,
            canCreate: true,
            canUpdate: true,
            canDelete: true,
            specialPermissions: [],
            module: { key: 'jefatura', name: 'Jefatura' },
          },
        ],
      },
    };

    expect(hasModulePermission(jefaturaUser, 'jefatura', 'read')).toBe(true);
    expect(hasModulePermission(jefaturaUser, 'secretaria', 'read')).toBe(false);
    expect(hasModulePermission(jefaturaUser, 'tesoreria', 'read')).toBe(false);
  });

  it('protege isSuperAdmin y deniega si la cuenta está inactiva', () => {
    const activeAdmin: AuthorizedUser = { id: 'sa-1', status: 'ACTIVE', isSuperAdmin: true };
    const disabledAdmin: AuthorizedUser = { id: 'sa-2', status: 'DISABLED', isSuperAdmin: true };

    expect(isSuperAdminUser(activeAdmin)).toBe(true);
    expect(hasModulePermission(activeAdmin, 'secretaria', 'delete')).toBe(true);
    expect(canReadSensitiveData(activeAdmin, 'bank')).toBe(true);

    expect(isSuperAdminUser(disabledAdmin)).toBe(false);
    expect(hasModulePermission(disabledAdmin, 'secretaria', 'read')).toBe(false);
  });

  it('detecta nombres reservados para evitar suplantación de superadministración', () => {
    expect(isReservedRoleName('SuperAdmin')).toBe(true);
    expect(isReservedRoleName('super_admin')).toBe(true);
    expect(isReservedRoleName('Superadministrador')).toBe(true);
    expect(isReservedRoleName('Administrador Absoluto')).toBe(true);
    expect(isReservedRoleName('Secretaría')).toBe(false);
  });

  it('normaliza permisos respetando capacidades del módulo y limpiando flags si canAccess=false', () => {
    const authz = new AuthorizationService({} as never);
    const moduleCapabilities = {
      supportsRead: true,
      supportsCreate: true,
      supportsUpdate: false,
      supportsDelete: false,
      specialActions: [{ key: 'export_sepa', label: 'Exportar SEPA' }],
    };

    const cleared = authz.normalizePermissionPayload(moduleCapabilities, {
      canAccess: false,
      canRead: true,
      canCreate: true,
      specialPermissions: ['export_sepa'],
    });
    expect(cleared).toEqual({
      canAccess: false,
      canRead: false,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
      specialPermissions: [],
    });

    const capped = authz.normalizePermissionPayload(moduleCapabilities, {
      canAccess: true,
      canRead: true,
      canCreate: true,
      canUpdate: true,
      canDelete: true,
      specialPermissions: ['export_sepa'],
    });
    expect(capped).toEqual({
      canAccess: true,
      canRead: true,
      canCreate: true,
      canUpdate: false,
      canDelete: false,
      specialPermissions: ['export_sepa'],
    });

    expect(() =>
      authz.normalizePermissionPayload(moduleCapabilities, {
        canAccess: true,
        specialPermissions: ['invented_action'],
      }),
    ).toThrow(BadRequestException);

    expect(() => authz.assertSuperAdmin(null)).toThrow(UnauthorizedException);
    expect(() =>
      authz.assertSuperAdmin({ id: 'u1', status: 'ACTIVE', isSuperAdmin: false }),
    ).toThrow(ForbiddenException);
  });

  it('sanitiza valores de auditoría eliminando contraseñas, tokens, secretos y datos sensibles', () => {
    const sanitized = sanitizeAuditValue({
      email: 'user@example.org',
      password: 'SecretPassword12345',
      temporaryPassword: 'TempPass999',
      mfaSecret: 'ABC',
      iban: 'ES1234567890123456789012',
      ibanLast4: '9012',
      parent1Dni: '12345678Z',
      mustChangePassword: true,
    }) as Record<string, unknown>;

    expect(sanitized.email).toBe('user@example.org');
    expect(sanitized.ibanLast4).toBe('9012');
    expect(sanitized.mustChangePassword).toBe(true);
    expect(sanitized.password).toBe('[REDACTED]');
    expect(sanitized.temporaryPassword).toBe('[REDACTED]');
    expect(sanitized.mfaSecret).toBe('[REDACTED]');
    expect(sanitized.iban).toBe('[REDACTED]');
    expect(sanitized.parent1Dni).toBe('[REDACTED]');
  });
});
