import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Application, ApplicationStatus, Member, ScoutBranch } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateApplicationDto): Promise<Application> {
    if (!dto.fatherPhone && !dto.motherPhone && !dto.fatherEmail && !dto.motherEmail) {
      throw new BadRequestException(
        'Debe proporcionarse al menos un teléfono o correo de contacto de madre, padre o tutor.',
      );
    }
    
    return this.prisma.application.create({
      data: {
        ...dto,
        childBirthDate: new Date(dto.childBirthDate),
      },
    });
  }

  async findAll(filters?: {
    status?: ApplicationStatus;
    branch?: ScoutBranch;
  }): Promise<Application[]> {
    return this.prisma.application.findMany({
      where: {
        status: filters?.status,
        requestedBranch: filters?.branch,
      },
      // Ordena primero por criterios de admisión y luego por antigüedad de solicitud
      orderBy: [
        { hasFamilyInGroup: 'desc' },
        { fromAnotherGroup: 'desc' },
        { socialInclusion: 'desc' },
        { requestDate: 'asc' },
      ],
    });
  }

  async findOne(id: string): Promise<Application> {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: { censusMember: true },
    });

    if (!application) {
      throw new NotFoundException(`La solicitud con ID "${id}" no existe`);
    }

    return application;
  }

  async update(id: string, dto: UpdateApplicationDto): Promise<Application> {
    await this.findOne(id);

    return this.prisma.application.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.childBirthDate ? { childBirthDate: new Date(dto.childBirthDate) } : {}),
      },
    });
  }

  /**
   * Paso 4 del flujo: Admite al niño de la lista de espera, lo pasa al Censo (Member)
   * y marca su solicitud como ADMITTED en una transacción atómica.
   */
  async admitToCensus(id: string): Promise<Member> {
    const app = await this.findOne(id);

    if (app.status === ApplicationStatus.ADMITTED) {
      throw new BadRequestException('Esta solicitud ya fue admitida en el censo');
    }

    const primaryPhone = app.motherPhone ?? app.fatherPhone ?? 'Sin teléfono';
    const primaryEmail = app.motherEmail ?? app.fatherEmail ?? 'Sin correo';

    return this.prisma.$transaction(async (tx) => {
      await tx.application.update({
        where: { id },
        data: { status: ApplicationStatus.ADMITTED },
      });

      return tx.member.create({
        data: {
          fullName: app.childName,
          birthDate: app.childBirthDate,
          currentBranch: app.requestedBranch,
          address: app.address,
          primaryPhone,
          primaryEmail,
          applicationId: app.id,
        },
      });
    });
  }

  async remove(id: string): Promise<Application> {
    await this.findOne(id);
    return this.prisma.application.delete({
      where: { id },
    });
  }
}