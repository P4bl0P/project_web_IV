import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationStatus, ScoutBranch } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApplicationsService } from './applications.service';

const mockApplication = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  status: ApplicationStatus.PENDING,
  requestDate: new Date('2026-10-01T10:00:00.000Z'),
  requestedBranch: ScoutBranch.LOBATO,
  childName: 'Lucas García Pérez',
  childBirthDate: new Date('2016-04-12T00:00:00.000Z'),
  address: 'Calle Gorrión 14, Montequinto',
  fatherName: 'Manuel García',
  fatherPhone: '600112233',
  fatherEmail: 'manuel@example.com',
  motherName: null,
  motherPhone: null,
  motherEmail: null,
  motivation: 'Aprender valores en la naturaleza.',
  councilNotes: null,
  hasFamilyInGroup: true,
  fromAnotherGroup: false,
  socialInclusion: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let prisma: {
    application: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      application: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
  });

  it('creates an application when valid data and tutor contact are provided', async () => {
    prisma.application.create.mockResolvedValue(mockApplication);

    const result = await service.create({
      requestedBranch: ScoutBranch.LOBATO,
      childName: 'Lucas García Pérez',
      childBirthDate: '2016-04-12',
      address: 'Calle Gorrión 14, Montequinto',
      fatherPhone: '600112233',
      motivation: 'Aprender valores en la naturaleza.',
    });

    expect(result.id).toBe(mockApplication.id);
    expect(prisma.application.create).toHaveBeenCalledTimes(1);
  });

  it('throws BadRequestException if no tutor phone or email is provided', async () => {
    await expect(
      service.create({
        requestedBranch: ScoutBranch.LOBATO,
        childName: 'Lucas García Pérez',
        childBirthDate: '2016-04-12',
        address: 'Calle Gorrión 14',
        motivation: 'Aprender valores en la naturaleza.',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('lists applications ordered by admission criteria', async () => {
    prisma.application.findMany.mockResolvedValue([mockApplication]);
    const list = await service.findAll({ status: ApplicationStatus.WAITLIST });
    expect(list).toHaveLength(1);
    expect(prisma.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: ApplicationStatus.WAITLIST, requestedBranch: undefined },
      }),
    );
  });

  it('finds one application by UUID', async () => {
    prisma.application.findUnique.mockResolvedValue(mockApplication);
    const found = await service.findOne(mockApplication.id);
    expect(found.childName).toBe('Lucas García Pérez');
  });

  it('throws NotFoundException when application does not exist', async () => {
    prisma.application.findUnique.mockResolvedValue(null);
    await expect(service.findOne(mockApplication.id)).rejects.toThrow(NotFoundException);
  });

  it('updates application status to WAITLIST', async () => {
    prisma.application.findUnique.mockResolvedValue(mockApplication);
    prisma.application.update.mockResolvedValue({
      ...mockApplication,
      status: ApplicationStatus.WAITLIST,
    });

    const updated = await service.update(mockApplication.id, {
      status: ApplicationStatus.WAITLIST,
    });
    expect(updated.status).toBe(ApplicationStatus.WAITLIST);
  });

  it('removes an existing application', async () => {
    prisma.application.findUnique.mockResolvedValue(mockApplication);
    prisma.application.delete.mockResolvedValue(mockApplication);

    const removed = await service.remove(mockApplication.id);
    expect(removed.id).toBe(mockApplication.id);
  });
});