import { BadRequestException, ConflictException } from '@nestjs/common';
import { MemberType } from '@prisma/client';
import { ApplicationsService } from './applications.service';

const censusDto = (overrides: Record<string, unknown> = {}) => ({
  childFirstName: 'Ana',
  childLastName: 'Scout',
  childBirthDate: '1990-01-01',
  gender: 'OTRO',
  streetAddress: 'Calle Scout',
  postalCode: '41089',
  municipality: 'Dos Hermanas',
  province: 'Sevilla',
  parent1FirstName: 'Ana',
  parent1LastName: 'Scout',
  parent1Phone: '600000000',
  parent1Email: 'ana@example.org',
  memberType: MemberType.RESPONSABLE,
  censusBranch: 'Lobatos',
  ...overrides,
});

describe('ApplicationsService census management', () => {
  it('creates a responsible in the selected branch without an enrollment', async () => {
    const prisma = {
      applicant: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
          ...data,
          id: 'member-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          enrollment: null,
          hasFamilyInGroup: false,
          socialInclusionPriority: false,
          comesFromOtherGroup: false,
        })),
      },
    };
    const auth = { audit: jest.fn().mockResolvedValue(undefined) };
    const service = new ApplicationsService(prisma as never, auth as never);

    const result = await service.createCensusMember(censusDto(), {
      user: { id: 'actor-1' },
      ip: '127.0.0.1',
    } as never);

    expect(result.memberType).toBe(MemberType.RESPONSABLE);
    expect(result.calculatedBranch).toBe('Lobatos');
    expect(prisma.applicant.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'CENSADO', censusBranch: 'Lobatos' }),
    }));
    expect(auth.audit).toHaveBeenCalledWith('actor-1', 'CENSUS_MEMBER_CREATED', 'member-1', 'ALLOWED', '127.0.0.1');
  });

  it('applies age classification to educandos but not responsables', async () => {
    const prisma = { applicant: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn() } };
    const service = new ApplicationsService(prisma as never, { audit: jest.fn() } as never);

    await expect(service.createCensusMember(censusDto({ memberType: MemberType.EDUCANDO }), {} as never))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a possible duplicate instead of creating another person', async () => {
    const prisma = {
      applicant: {
        findFirst: jest.fn().mockResolvedValue({ id: 'existing', childFirstName: 'Ana', childLastName: 'Scout' }),
      },
    };
    const service = new ApplicationsService(prisma as never, { audit: jest.fn() } as never);

    await expect(service.createCensusMember(censusDto(), {} as never))
      .rejects.toBeInstanceOf(ConflictException);
  });
});
