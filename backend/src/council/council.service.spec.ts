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
    BadRequestException: class BadRequestException extends HttpTestException {},
    NotFoundException: class NotFoundException extends HttpTestException {},
    ForbiddenException: class ForbiddenException extends HttpTestException {},
    UnauthorizedException: class UnauthorizedException extends HttpTestException {},
  };
});

import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import {
  COUNCIL_ROLES,
  COUNCIL_ROLE_DESCRIPTIONS,
} from './council.constants';
import { CouncilService } from './council.service';

describe('CouncilService', () => {
  let service: CouncilService;
  let mockPrisma: {
    councilMember: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    mockPrisma = {
      councilMember: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    };

    service = new CouncilService(mockPrisma as unknown as PrismaService);
  });

  it('devuelve integrantes ordenados junto a las descripciones fijas compartidas por cargo', async () => {
    const members = [
      {
        id: 'm1',
        fullName: 'Persona Uno',
        role: 'Jefatura',
        personalBio: null,
        displayOrder: 0,
      },
      {
        id: 'm2',
        fullName: 'Persona Dos',
        role: 'Jefatura',
        personalBio: 'Presentación opcional',
        displayOrder: 1,
      },
    ];
    mockPrisma.councilMember.findMany.mockResolvedValue(members);

    const result = await service.findAll();

    expect(mockPrisma.councilMember.findMany).toHaveBeenCalledWith({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });
    expect(result.members).toEqual(members);
    expect(result.availableRoles).toEqual([...COUNCIL_ROLES]);
    expect(result.roleDescriptions).toEqual(COUNCIL_ROLE_DESCRIPTIONS);
  });

  it('permite crear varios integrantes con el mismo cargo y presentación opcional nula', async () => {
    mockPrisma.councilMember.findFirst.mockResolvedValue({ displayOrder: 2 });
    mockPrisma.councilMember.create.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'new-id',
        ...data,
      }),
    );

    const created = await service.create({
      fullName: '  Responsable Ejemplo  ',
      role: 'Secretaría',
      personalBio: '   ',
    });

    expect(mockPrisma.councilMember.create).toHaveBeenCalledWith({
      data: {
        fullName: 'Responsable Ejemplo',
        role: 'Secretaría',
        personalBio: null,
        displayOrder: 3,
      },
    });
    expect(created.displayOrder).toBe(3);
  });

  it('permite actualizar cargo, orden y limpiar o editar la presentación personal', async () => {
    mockPrisma.councilMember.findUnique.mockResolvedValue({
      id: 'm1',
      fullName: 'Persona Uno',
      role: 'Jefatura',
      personalBio: 'Anterior',
      displayOrder: 0,
    });
    mockPrisma.councilMember.update.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'm1',
        ...data,
      }),
    );

    await service.update('m1', {
      role: 'Tesorería',
      personalBio: '',
      displayOrder: 2,
    });

    expect(mockPrisma.councilMember.update).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: {
        role: 'Tesorería',
        personalBio: null,
        displayOrder: 2,
      },
    });
  });

  it('lanza NotFoundException al editar o eliminar un integrante inexistente', async () => {
    mockPrisma.councilMember.findUnique.mockResolvedValue(null);

    await expect(
      service.update('missing-id', { fullName: 'Otro nombre' }),
    ).rejects.toThrow(NotFoundException);

    await expect(service.remove('missing-id')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('reordena integrantes secuencialmente y rechaza identificadores duplicados o inexistentes', async () => {
    mockPrisma.councilMember.findMany
      .mockResolvedValueOnce([{ id: 'a' }, { id: 'b' }, { id: 'c' }])
      .mockResolvedValueOnce([
        { id: 'c', displayOrder: 0 },
        { id: 'a', displayOrder: 1 },
        { id: 'b', displayOrder: 2 },
      ]);
    mockPrisma.councilMember.update.mockResolvedValue({});

    const result = await service.reorder(['c', 'a', 'b']);

    expect(mockPrisma.councilMember.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'c' },
      data: { displayOrder: 0 },
    });
    expect(mockPrisma.councilMember.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'a' },
      data: { displayOrder: 1 },
    });
    expect(mockPrisma.councilMember.update).toHaveBeenNthCalledWith(3, {
      where: { id: 'b' },
      data: { displayOrder: 2 },
    });
    expect(result.members.map((m) => m.id)).toEqual(['c', 'a', 'b']);

    await expect(service.reorder(['a', 'a'])).rejects.toThrow(
      BadRequestException,
    );

    mockPrisma.councilMember.findMany.mockResolvedValueOnce([{ id: 'a' }]);
    await expect(service.reorder(['a', 'unknown'])).rejects.toThrow(
      BadRequestException,
    );
  });

  it('elimina un integrante y reindexa los restantes', async () => {
    mockPrisma.councilMember.findUnique.mockResolvedValue({ id: 'b' });
    mockPrisma.councilMember.delete.mockResolvedValue({ id: 'b' });
    mockPrisma.councilMember.findMany.mockResolvedValue([
      { id: 'a' },
      { id: 'c' },
    ]);
    mockPrisma.councilMember.update.mockResolvedValue({});

    const res = await service.remove('b');

    expect(res).toEqual({ ok: true });
    expect(mockPrisma.councilMember.delete).toHaveBeenCalledWith({
      where: { id: 'b' },
    });
    expect(mockPrisma.councilMember.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'a' },
      data: { displayOrder: 0 },
    });
    expect(mockPrisma.councilMember.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'c' },
      data: { displayOrder: 1 },
    });
  });
});
