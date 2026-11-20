jest.mock('@nestjs/common', () => {
  class HttpTestException extends Error {
    constructor(message?: string) {
      super(message);
      this.name = new.target.name;
    }
  }
  const noopDecorator = () => () => undefined;
  return {
    Injectable: noopDecorator,
    Controller: noopDecorator,
    UseGuards: noopDecorator,
    Get: noopDecorator,
    Post: noopDecorator,
    Patch: noopDecorator,
    Delete: noopDecorator,
    Body: noopDecorator,
    Param: noopDecorator,
    Req: noopDecorator,
    BadRequestException: class BadRequestException extends HttpTestException {},
    NotFoundException: class NotFoundException extends HttpTestException {},
    ForbiddenException: class ForbiddenException extends HttpTestException {},
    UnauthorizedException: class UnauthorizedException extends HttpTestException {},
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

  it('permite gestionar integrantes a usuarios con rol Secretaría', async () => {
    const secretariaReq = {
      user: {
        id: 'u-sec',
        isSuperAdmin: false,
        role: { name: 'Secretaría', permissions: [] },
      },
    } as unknown as AuthenticatedRequest;

    await controller.findManage(secretariaReq);
    await controller.create(
      { fullName: 'Nombre Ejemplo', role: 'Jefatura' },
      secretariaReq,
    );
    await controller.update('1', { fullName: 'Editado' }, secretariaReq);
    await controller.reorder({ orderedIds: ['1'] }, secretariaReq);
    await controller.remove('1', secretariaReq);

    expect(mockService.create).toHaveBeenCalledTimes(1);
    expect(mockService.update).toHaveBeenCalledTimes(1);
    expect(mockService.reorder).toHaveBeenCalledTimes(1);
    expect(mockService.remove).toHaveBeenCalledTimes(1);
  });

  it('permite gestionar integrantes a superadministradores', async () => {
    const adminReq = {
      user: {
        id: 'u-admin',
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

  it('bloquea con 403 ForbiddenException a usuarios normales o de otros roles sin permiso de Secretaría', () => {
    const jefaturaReq = {
      user: {
        id: 'u-jef',
        isSuperAdmin: false,
        role: {
          name: 'Jefatura',
          permissions: [
            {
              canRead: true,
              canCreate: true,
              canUpdate: true,
              canDelete: true,
              module: { name: 'Jefatura' },
            },
          ],
        },
      },
    } as unknown as AuthenticatedRequest;

    const normalUserReq = {
      user: {
        id: 'u-normal',
        isSuperAdmin: false,
        role: null,
      },
    } as unknown as AuthenticatedRequest;

    expect(() => controller.findManage(jefaturaReq)).toThrow(ForbiddenException);
    expect(() =>
      controller.create(
        { fullName: 'Intento', role: 'Jefatura' },
        normalUserReq,
      ),
    ).toThrow(ForbiddenException);
    expect(() =>
      controller.update('1', { fullName: 'Intento' }, jefaturaReq),
    ).toThrow(ForbiddenException);
    expect(() =>
      controller.reorder({ orderedIds: ['1'] }, normalUserReq),
    ).toThrow(ForbiddenException);
    expect(() => controller.remove('1', normalUserReq)).toThrow(
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
