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
import { ApplicationsController } from './applications.controller';
import type { ApplicationsService } from './applications.service';
import type { DeactivateApplicationDto } from './dto/lifecycle-actions.dto';

function makeAuthReq(overrides: Record<string, unknown>): AuthenticatedRequest {
  return {
    ip: '127.0.0.1',
    user: {
      id: 'user-1',
      isSuperAdmin: false,
      role: {
        name: 'Secretaría',
        permissions: [],
      },
      ...overrides,
    },
  } as unknown as AuthenticatedRequest;
}

describe('ApplicationsController - Permisos y endpoints de Secretaría', () => {
  let controller: ApplicationsController;
  let mockService: Record<string, jest.Mock>;

  beforeEach(() => {
    mockService = {
      create: jest.fn().mockResolvedValue({ id: 'app-1' }),
      findAll: jest.fn().mockResolvedValue([]),
      findPaginated: jest.fn().mockResolvedValue({ items: [], totalMatching: 0 }),
      findCensus: jest.fn().mockResolvedValue([]),
      createDirectCensus: jest.fn().mockResolvedValue({ id: 'app-1' }),
      findByMagicToken: jest.fn().mockResolvedValue({ id: 'app-1' }),
      completeMagicEnrollment: jest.fn().mockResolvedValue({ id: 'app-1' }),
      findOne: jest.fn().mockResolvedValue({ id: 'app-1' }),
      getHistory: jest.fn().mockResolvedValue([]),
      getAuroraPreview: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({ id: 'app-1' }),
      validateApplication: jest.fn().mockResolvedValue({ id: 'app-1' }),
      offerSpot: jest.fn().mockResolvedValue({ id: 'app-1' }),
      renewMagicLink: jest.fn().mockResolvedValue({ id: 'app-1' }),
      returnToWaitlist: jest.fn().mockResolvedValue({ id: 'app-1' }),
      markEnrollmentReviewed: jest.fn().mockResolvedValue({ id: 'app-1' }),
      admitToCensus: jest.fn().mockResolvedValue({ id: 'app-1' }),
      deactivate: jest.fn().mockResolvedValue({ id: 'app-1' }),
      reactivate: jest.fn().mockResolvedValue({ id: 'app-1' }),
      updateCensus: jest.fn().mockResolvedValue({ id: 'app-1' }),
      remove: jest.fn().mockResolvedValue({ id: 'app-1' }),
    };

    controller = new ApplicationsController(mockService as unknown as ApplicationsService);
  });

  it('deniega con UnauthorizedException si el usuario no está autenticado', () => {
    const req = { ip: '127.0.0.1' } as unknown as AuthenticatedRequest;
    expect(() => controller.findAll(undefined, req)).toThrow(UnauthorizedException);
    expect(() => controller.findPaginated(undefined, req)).toThrow(UnauthorizedException);
    expect(() => controller.findOne('app-1', req)).toThrow(UnauthorizedException);
    expect(() => controller.admitToCensus('app-1', req)).toThrow(UnauthorizedException);
  });

  it('deniega con ForbiddenException a usuarios de Tesorería o Jefatura sin permisos en Secretaría', () => {
    const tesoreriaReq = makeAuthReq({
      role: {
        name: 'Tesorería',
        permissions: [
          {
            canRead: true,
            canCreate: true,
            canUpdate: true,
            canDelete: true,
            module: { name: 'Tesorería' },
          },
        ],
      },
    });
    const jefaturaReq = makeAuthReq({
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
    });

    expect(() => controller.findAll(undefined, tesoreriaReq)).toThrow(ForbiddenException);
    expect(() => controller.findPaginated(undefined, jefaturaReq)).toThrow(ForbiddenException);
    expect(() => controller.findOne('app-1', tesoreriaReq)).toThrow(ForbiddenException);
    expect(() => controller.offerSpot('app-1', {}, jefaturaReq)).toThrow(ForbiddenException);
    expect(() => controller.admitToCensus('app-1', tesoreriaReq)).toThrow(ForbiddenException);
    expect(() =>
      controller.deactivate('app-1', { closureReason: 'OTRO' } as DeactivateApplicationDto, jefaturaReq),
    ).toThrow(ForbiddenException);
    expect(() => controller.remove('app-1', tesoreriaReq)).toThrow(ForbiddenException);
  });

  it('aplica mínimo privilegio: un lector de Secretaría (canRead=true, canUpdate=false) no puede mutar ni censar', () => {
    const readOnlyReq = makeAuthReq({
      role: {
        name: 'Kraal Lectura',
        permissions: [
          {
            canRead: true,
            canCreate: false,
            canUpdate: false,
            canDelete: false,
            module: { name: 'Secretaría' },
          },
        ],
      },
    });

    void controller.findPaginated({}, readOnlyReq);
    void controller.findOne('app-1', readOnlyReq);
    expect(mockService.findPaginated).toHaveBeenCalledTimes(1);
    expect(mockService.findOne).toHaveBeenCalledTimes(1);

    expect(() => controller.validateApplication('app-1', readOnlyReq)).toThrow(ForbiddenException);
    expect(() => controller.offerSpot('app-1', {}, readOnlyReq)).toThrow(ForbiddenException);
    expect(() => controller.admitToCensus('app-1', readOnlyReq)).toThrow(ForbiddenException);
    expect(() => controller.remove('app-1', readOnlyReq)).toThrow(ForbiddenException);
  });

  it('permite acciones de Secretaría cuando el rol tiene los permisos correspondientes', async () => {
    const fullSecReq = makeAuthReq({
      role: {
        name: 'Secretaría',
        permissions: [
          {
            canRead: true,
            canCreate: true,
            canUpdate: true,
            canDelete: true,
            module: { name: 'Secretaría' },
          },
        ],
      },
    });

    await controller.validateApplication('app-1', fullSecReq);
    await controller.offerSpot('app-1', { daysValid: 7 }, fullSecReq);
    await controller.renewToken('app-1', { daysValid: 7 }, fullSecReq);
    await controller.returnToWaitlist('app-1', { reason: 'Posponen' }, fullSecReq);
    await controller.markReviewed('app-1', fullSecReq);
    await controller.admitToCensus('app-1', fullSecReq);
    await controller.deactivate('app-1', { closureReason: 'BAJA_VOLUNTARIA' } as DeactivateApplicationDto, fullSecReq);
    await controller.reactivate('app-1', {}, fullSecReq);
    await controller.remove('app-1', fullSecReq);

    expect(mockService.validateApplication).toHaveBeenCalledTimes(1);
    expect(mockService.offerSpot).toHaveBeenCalledTimes(1);
    expect(mockService.renewMagicLink).toHaveBeenCalledTimes(1);
    expect(mockService.returnToWaitlist).toHaveBeenCalledTimes(1);
    expect(mockService.markEnrollmentReviewed).toHaveBeenCalledTimes(1);
    expect(mockService.admitToCensus).toHaveBeenCalledTimes(1);
    expect(mockService.deactivate).toHaveBeenCalledTimes(1);
    expect(mockService.reactivate).toHaveBeenCalledTimes(1);
    expect(mockService.remove).toHaveBeenCalledTimes(1);
  });
});
