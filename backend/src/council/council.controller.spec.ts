jest.mock('@nestjs/common', () => {
  const actual = jest.requireActual('@nestjs/common');
  return {
    ...actual,
  };
});

jest.mock('../auth.service', () => ({
  AuthService: class AuthService {},
}));

import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth.guard';
import { CouncilController } from './council.controller';
import type { CouncilService } from './council.service';

describe('CouncilController - Seguridad y permisos de Contenido de la web', () => {
  let controller: CouncilController;
  let mockService: {
    findAll: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    reorder: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(() => {
    mockService = {
      findAll: jest.fn().mockResolvedValue({ members: [] }),
      create: jest.fn().mockResolvedValue({ id: '1' }),
      update: jest.fn().mockResolvedValue({ id: '1' }),
      reorder: jest.fn().mockResolvedValue({ members: [] }),
      remove: jest.fn().mockResolvedValue({ ok: true }),
    };

    controller = new CouncilController(mockService as unknown as CouncilService);
  });

  it('permite consultar el Consejo públicamente sin autenticación', async () => {
    await controller.findPublic();
    expect(mockService.findAll).toHaveBeenCalledTimes(1);
  });

  it('permite gestionar integrantes cuando el cargo tiene permiso explícito de Secretaría + manage_web_content sin importar el nombre', async () => {
    const customWebEditorReq = {
      user: {
        id: 'u-sec',
        status: 'ACTIVE',
        isSuperAdmin: false,
        role: {
          name: 'Responsable Web',
          permissions: [
            {
              canAccess: true,
              canRead: true,
              canCreate: true,
              canUpdate: true,
              canDelete: true,
              specialPermissions: ['manage_web_content'],
              module: { key: 'secretaria', name: 'Secretaría' },
            },
          ],
        },
      },
    } as unknown as AuthenticatedRequest;

    await controller.findManage(customWebEditorReq);
    await controller.create(
      { fullName: 'Nombre Ejemplo', role: 'Jefatura' },
      customWebEditorReq,
    );
    await controller.update('1', { fullName: 'Editado' }, customWebEditorReq);
    await controller.reorder({ orderedIds: ['1'] }, customWebEditorReq);
    await controller.remove('1', customWebEditorReq);

    expect(mockService.create).toHaveBeenCalledTimes(1);
    expect(mockService.update).toHaveBeenCalledTimes(1);
    expect(mockService.reorder).toHaveBeenCalledTimes(1);
    expect(mockService.remove).toHaveBeenCalledTimes(1);
  });

  it('rechaza incluso a un cargo llamado Secretaría si no tiene permiso explícito manage_web_content o canAccess', () => {
    const secretariaNameBypassAttempt = {
      user: {
        id: 'u-sec-empty',
        status: 'ACTIVE',
        isSuperAdmin: false,
        role: { name: 'Secretaría', permissions: [] },
      },
    } as unknown as AuthenticatedRequest;

    const secretariaWithoutSpecial = {
      user: {
        id: 'u-sec-nospecial',
        status: 'ACTIVE',
        isSuperAdmin: false,
        role: {
          name: 'Secretaría',
          permissions: [
            {
              canAccess: true,
              canRead: true,
              canCreate: true,
              canUpdate: true,
              canDelete: true,
              specialPermissions: [],
              module: { key: 'secretaria', name: 'Secretaría' },
            },
          ],
        },
      },
    } as unknown as AuthenticatedRequest;

    expect(() => controller.findManage(secretariaNameBypassAttempt)).toThrow(ForbiddenException);
    expect(() => controller.findManage(secretariaWithoutSpecial)).toThrow(ForbiddenException);
  });

  it('permite gestionar integrantes a superadministradores', async () => {
    const adminReq = {
      user: {
        id: 'u-admin',
        status: 'ACTIVE',
        isSuperAdmin: true,
        role: null,
      },
    } as unknown as AuthenticatedRequest;

    await controller.findManage(adminReq);
    await controller.create(
      { fullName: 'Superadmin Test', role: 'Tesorería' },
      adminReq,
    );

    expect(mockService.findAll).toHaveBeenCalledTimes(1);
    expect(mockService.create).toHaveBeenCalledTimes(1);
  });

  it('bloquea con 403 ForbiddenException a usuarios normales o de otros cargos sin permiso', async () => {
    const jefaturaReq = {
      user: {
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
      },
    } as unknown as AuthenticatedRequest;

    const normalUserReq = {
      user: {
        id: 'u-normal',
        status: 'ACTIVE',
        isSuperAdmin: false,
        role: null,
      },
    } as unknown as AuthenticatedRequest;

    expect(() => controller.findManage(jefaturaReq)).toThrow(ForbiddenException);
    await expect(
      controller.create({ fullName: 'Intento', role: 'Jefatura' }, normalUserReq),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      controller.update('1', { fullName: 'Intento' }, jefaturaReq),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      controller.reorder({ orderedIds: ['1'] }, normalUserReq),
    ).rejects.toThrow(ForbiddenException);
    await expect(controller.remove('1', normalUserReq)).rejects.toThrow(
      ForbiddenException,
    );

    expect(mockService.create).not.toHaveBeenCalled();
    expect(mockService.update).not.toHaveBeenCalled();
    expect(mockService.reorder).not.toHaveBeenCalled();
    expect(mockService.remove).not.toHaveBeenCalled();
  });

  it('lanza UnauthorizedException si falta el usuario autenticado en la petición', () => {
    const unauthReq = {} as AuthenticatedRequest;
    expect(() => controller.findManage(unauthReq)).toThrow(
      UnauthorizedException,
    );
  });
});
