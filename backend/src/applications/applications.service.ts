import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { CompleteEnrollmentDto } from './dto/complete-enrollment.dto';
import { ApplicationStatus, Applicant, EnrollmentDetails, MemberType } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { AuthenticatedRequest } from '../auth.guard';
import { AuthService } from '../auth.service';
import { CreateCensusMemberDto } from './dto/create-census-member.dto';

export type EnrichedApplicant = Applicant & {
  enrollment?: EnrollmentDetails | null;
  calculatedBranch: string;
  currentAge: number;
  priorityScore: number;
};

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  /**
   * Calcula dinámicamente la rama scout según el año de nacimiento y la Ronda Solar actual.
   * Si estamos en sept-dic, la ronda solar es el año actual; si es ene-ago, empezó el año anterior.
   */
  calculateScoutBranch(birthDate: Date): { branch: string; age: number } {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1 - 12
    const solarRoundStartYear = currentMonth >= 9 ? currentYear : currentYear - 1;

    const birthYear = birthDate.getFullYear();
    const ageInSolarRound = solarRoundStartYear - birthYear;

    let branch = 'Fuera de rango';
    if (ageInSolarRound >= 6 && ageInSolarRound <= 7) {
      branch = 'Castores';
    } else if (ageInSolarRound >= 8 && ageInSolarRound <= 10) {
      branch = 'Lobatos';
    } else if (ageInSolarRound >= 11 && ageInSolarRound <= 13) {
      branch = 'Rangers';
    } else if (ageInSolarRound >= 14 && ageInSolarRound <= 16) {
      branch = 'Pioneros';
    } else if (ageInSolarRound >= 17 && ageInSolarRound <= 19) {
      branch = 'Rutas';
    } else if (ageInSolarRound < 6) {
      branch = 'Pre-Castor (< 6 años)';
    }

    return { branch, age: ageInSolarRound };
  }

  /**
   * Enriquece un registro con su rama dinámica y puntuación de prioridad según criterios del Grupo IV
   */
  private enrichApplicant(
    applicant: Applicant & { enrollment?: EnrollmentDetails | null },
  ): EnrichedApplicant {
    const calculated = this.calculateScoutBranch(applicant.childBirthDate);
    const branch = applicant.censusBranch ?? calculated.branch;
    const age = calculated.age;

    // Puntuación base para ordenar: Familiar (+100), Inclusión (+50), Otro grupo (+25)
    let priorityScore = 0;
    if (applicant.hasFamilyInGroup) priorityScore += 100;
    if (applicant.socialInclusionPriority) priorityScore += 50;
    if (applicant.comesFromOtherGroup) priorityScore += 25;

    return {
      ...applicant,
      calculatedBranch: branch,
      currentAge: age,
      priorityScore,
    };
  }

  private duplicateWhere(dto: {
    childFirstName: string;
    childLastName: string;
    childBirthDate: string | Date;
    parent1Email: string;
    parent1Phone: string;
  }) {
    return {
      OR: [
        {
          childFirstName: { equals: dto.childFirstName.trim(), mode: 'insensitive' as const },
          childLastName: { equals: dto.childLastName.trim(), mode: 'insensitive' as const },
          childBirthDate: new Date(dto.childBirthDate),
        },
        {
          childFirstName: { equals: dto.childFirstName.trim(), mode: 'insensitive' as const },
          childLastName: { equals: dto.childLastName.trim(), mode: 'insensitive' as const },
          parent1Email: dto.parent1Email.trim().toLowerCase(),
        },
        {
          childFirstName: { equals: dto.childFirstName.trim(), mode: 'insensitive' as const },
          childLastName: { equals: dto.childLastName.trim(), mode: 'insensitive' as const },
          parent1Phone: dto.parent1Phone.replace(/\s+/g, ''),
        },
      ],
    };
  }

  private validateCensusBranch(memberType: MemberType, birthDate: Date, branch: string) {
    if (memberType === MemberType.EDUCANDO && this.calculateScoutBranch(birthDate).branch !== branch) {
      throw new BadRequestException('La rama indicada no coincide con la clasificación por edad del educando');
    }
  }

  // 1. Crear solicitud inicial (Fase 1)
  async create(dto: CreateApplicationDto): Promise<EnrichedApplicant> {
    const { childBirthDate, ...rest } = dto;
    const created = await this.prisma.applicant.create({
      data: {
        ...rest,
        childBirthDate: new Date(childBirthDate),
      },
    });
    return this.enrichApplicant(created);
  }

  // 2. Listar todas las solicitudes/miembros enriquecidos (Para el panel /gestion)
  async findAll(status?: ApplicationStatus): Promise<EnrichedApplicant[]> {
    const applicants = await this.prisma.applicant.findMany({
      where: status ? { status } : undefined,
      include: { enrollment: true },
      orderBy: { createdAt: 'asc' }, // Criterio base: fecha de solicitud
    });

    return applicants.map((app) => this.enrichApplicant(app));
  }

  // 3. Obtener el Censo oficial (Estado CENSADO)
  async findCensus(memberType?: MemberType, branch?: string): Promise<EnrichedApplicant[]> {
    const applicants = await this.prisma.applicant.findMany({
      where: {
        status: ApplicationStatus.CENSADO,
        ...(memberType ? { memberType } : {}),
        ...(branch ? { censusBranch: branch } : {}),
      },
      include: { enrollment: true },
      orderBy: [{ censusBranch: 'asc' }, { childLastName: 'asc' }],
    });
    return applicants.map((app) => this.enrichApplicant(app));
  }

  async createCensusMember(
    dto: CreateCensusMemberDto,
    req: AuthenticatedRequest,
  ): Promise<EnrichedApplicant> {
    const existing = await this.prisma.applicant.findFirst({
      where: this.duplicateWhere(dto),
      select: { id: true, childFirstName: true, childLastName: true },
    });
    if (existing) {
      throw new ConflictException(
        `Ya existe una persona coincidente: ${existing.childFirstName} ${existing.childLastName} (${existing.id})`,
      );
    }
    if (!dto.censusBranch?.trim()) {
      throw new BadRequestException('La rama es obligatoria para una ficha censal');
    }
    const { childBirthDate, memberType, censusBranch, ...rest } = dto;
    this.validateCensusBranch(memberType, new Date(childBirthDate), censusBranch.trim());
    const created = await this.prisma.applicant.create({
      data: {
        ...rest,
        childBirthDate: new Date(childBirthDate),
        memberType,
        censusBranch: censusBranch.trim(),
        status: ApplicationStatus.CENSADO,
        admittedAt: new Date(),
      },
      include: { enrollment: true },
    });
    await this.auth.audit(req.user!.id, 'CENSUS_MEMBER_CREATED', created.id, 'ALLOWED', req.ip);
    return this.enrichApplicant(created);
  }

  // 4. Obtener un solicitante por ID
  async findOne(id: string): Promise<EnrichedApplicant> {
    const applicant = await this.prisma.applicant.findUnique({
      where: { id },
      include: { enrollment: true },
    });
    if (!applicant) {
      throw new NotFoundException(`Solicitante con ID ${id} no encontrado`);
    }
    return this.enrichApplicant(applicant);
  }

  // 5. Actualizar datos o estado desde el panel del Kraal
  async update(
    id: string,
    dto: UpdateApplicationDto,
    req?: AuthenticatedRequest,
  ): Promise<EnrichedApplicant> {
    const before = await this.findOne(id);
    const { childBirthDate, status, ...rest } = dto;
    const effectiveMemberType = rest.memberType ?? before.memberType;
    const effectiveBranch = rest.censusBranch ?? before.censusBranch;
    const effectiveBirthDate = childBirthDate ? new Date(childBirthDate) : before.childBirthDate;
    if (effectiveMemberType === MemberType.RESPONSABLE && !effectiveBranch) {
      throw new BadRequestException('La rama es obligatoria para una persona responsable');
    }
    if (effectiveMemberType === MemberType.EDUCANDO && effectiveBranch) {
      this.validateCensusBranch(effectiveMemberType, effectiveBirthDate, effectiveBranch);
    }

    const updated = await this.prisma.applicant.update({
      where: { id },
      data: {
        ...Object.fromEntries(Object.entries(rest).filter(([, value]) => value !== undefined)),
        ...(status ? { status } : {}),
        ...(status === ApplicationStatus.CENSADO ? { admittedAt: new Date() } : {}),
        ...(childBirthDate ? { childBirthDate: new Date(childBirthDate) } : {}),
      },
      include: { enrollment: true },
    });

    if (req) {
      const changedFields = Object.keys(dto).filter(
        (key) =>
          JSON.stringify((before as Record<string, unknown>)[key]) !==
          JSON.stringify((updated as Record<string, unknown>)[key]),
      );
      await this.auth.audit(
        req.user!.id,
        'CENSUS_MEMBER_UPDATED',
        id,
        `ALLOWED:${changedFields.join(',')}`,
        req.ip,
      );
    }
    return this.enrichApplicant(updated);
  }

  // 6. Ofertar plaza y generar Enlace Mágico (+7 días de validez)
  async offerSpot(id: string, daysValid = 7): Promise<EnrichedApplicant> {
    await this.findOne(id);
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysValid);

    const updated = await this.prisma.applicant.update({
      where: { id },
      data: {
        status: ApplicationStatus.PLAZA_OFERTADA,
        enrollmentToken: token,
        tokenExpiresAt: expiresAt,
      },
      include: { enrollment: true },
    });

    return this.enrichApplicant(updated);
  }

  // 7. Validar y obtener datos públicos mediante el Token Mágico (Para los padres)
  async findByMagicToken(token: string): Promise<EnrichedApplicant> {
    const applicant = await this.prisma.applicant.findUnique({
      where: { enrollmentToken: token },
      include: { enrollment: true },
    });

    if (!applicant) {
      throw new NotFoundException('El enlace de inscripción no es válido.');
    }

    if (
      applicant.tokenExpiresAt &&
      new Date() > new Date(applicant.tokenExpiresAt) &&
      applicant.status === ApplicationStatus.PLAZA_OFERTADA
    ) {
      throw new BadRequestException(
        'El plazo para rellenar esta inscripción ha expirado. Contacta con el Grupo IV.',
      );
    }

    return this.enrichApplicant(applicant);
  }

  // 8. Guardar la Fase 2 (Hoja de Inscripción, Ficha Médica, SEPA y Firmas)
  async completeMagicEnrollment(
    token: string,
    dto: CompleteEnrollmentDto,
  ): Promise<EnrichedApplicant> {
    const applicant = await this.findByMagicToken(token);

    if (
      dto.custodyType === 'CUSTODIA_CONJUNTA' &&
      !dto.signatureParent2
    ) {
      throw new BadRequestException(
        'En caso de custodia conjunta es obligatoria la firma de ambos progenitores.',
      );
    }

    const {
      streetAddress,
      streetNumber,
      ApartmentDoor,
      postalCode,
      municipality,
      province,
      parent1Phone,
      parent1Email,
      parent2Phone,
      parent2Email,
      ...enrollmentData
    } = dto;

    const cleanIban = enrollmentData.iban.replace(/\s+/g, '').toUpperCase();

    const updated = await this.prisma.applicant.update({
      where: { id: applicant.id },
      data: {
        status: ApplicationStatus.INSCRIPCION_COMPLETADA,
        ...(streetAddress ? { streetAddress } : {}),
        ...(streetNumber !== undefined ? { streetNumber } : {}),
        ...(ApartmentDoor !== undefined ? { ApartmentDoor } : {}),
        ...(postalCode ? { postalCode } : {}),
        ...(municipality ? { municipality } : {}),
        ...(province ? { province } : {}),
        ...(parent1Phone ? { parent1Phone } : {}),
        ...(parent1Email ? { parent1Email } : {}),
        ...(parent2Phone !== undefined ? { parent2Phone } : {}),
        ...(parent2Email !== undefined ? { parent2Email } : {}),
        enrollment: {
          upsert: {
            create: {
              ...enrollmentData,
              iban: cleanIban,
              ...(enrollmentData.signatureParent2
                ? { signedAtParent2: new Date() }
                : {}),
            },
            update: {
              ...enrollmentData,
              iban: cleanIban,
              ...(enrollmentData.signatureParent2
                ? { signedAtParent2: new Date() }
                : {}),
            },
          },
        },
      },
      include: { enrollment: true },
    });

    return this.enrichApplicant(updated);
  }

  // 9. Eliminar solicitud
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.applicant.delete({
      where: { id },
    });
  }

  // 10. Importación masiva desde Excel (Censo actual o Lista de Espera histórica)
  async bulkImport(
    items: Array<
      CreateApplicationDto & {
        status?: ApplicationStatus;
        createdAt?: string;
        childDni?: string;
        parent1Dni?: string;
        iban?: string;
        memberType?: MemberType;
        censusBranch?: string;
      }
    >,
  ) {
    return this.prisma.$transaction(async (tx) => {
      let importedCount = 0;
      let skippedCount = 0;

      for (const item of items) {
        const { childBirthDate, status, createdAt, memberType, censusBranch, ...rest } = item;
        const parsedBirth = new Date(childBirthDate);
        const validBirth = isNaN(parsedBirth.getTime()) ? new Date('2015-01-01') : parsedBirth;
        const parsedCreated = createdAt ? new Date(createdAt) : new Date();
        const targetStatus = status || ApplicationStatus.LISTA_ESPERA;
        const duplicate = await tx.applicant.findFirst({
          where: this.duplicateWhere({
            childFirstName: rest.childFirstName,
            childLastName: rest.childLastName,
            childBirthDate: validBirth,
            parent1Email: rest.parent1Email,
            parent1Phone: rest.parent1Phone,
          }),
          select: { id: true },
        });
        if (duplicate) {
          skippedCount++;
          continue;
        }

        await tx.applicant.create({
          data: {
            ...rest,
            childBirthDate: validBirth,
            createdAt: isNaN(parsedCreated.getTime()) ? new Date() : parsedCreated,
            status: targetStatus,
            memberType: memberType === MemberType.RESPONSABLE ? MemberType.RESPONSABLE : MemberType.EDUCANDO,
            censusBranch: censusBranch || undefined,
            ...(targetStatus === ApplicationStatus.CENSADO ? { admittedAt: new Date() } : {}),
          },
        });
        importedCount++;
      }

      return { importedCount, skippedCount };
    });
  }
}