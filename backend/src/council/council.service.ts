import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  COUNCIL_ROLES,
  COUNCIL_ROLE_DESCRIPTIONS,
} from './council.constants';
import type { CreateCouncilMemberDto } from './dto/create-council-member.dto';
import type { UpdateCouncilMemberDto } from './dto/update-council-member.dto';

@Injectable()
export class CouncilService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const members = await this.prisma.councilMember.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return {
      members,
      roleDescriptions: COUNCIL_ROLE_DESCRIPTIONS,
      availableRoles: [...COUNCIL_ROLES],
    };
  }

  async create(dto: CreateCouncilMemberDto) {
    let displayOrder = dto.displayOrder;
    if (displayOrder === undefined) {
      const last = await this.prisma.councilMember.findFirst({
        orderBy: { displayOrder: 'desc' },
        select: { displayOrder: true },
      });
      displayOrder = last ? last.displayOrder + 1 : 0;
    }

    const normalizedBio = dto.personalBio?.trim();

    return this.prisma.councilMember.create({
      data: {
        fullName: dto.fullName.trim(),
        role: dto.role,
        personalBio: normalizedBio ? normalizedBio : null,
        displayOrder,
      },
    });
  }

  async update(id: string, dto: UpdateCouncilMemberDto) {
    const existing = await this.prisma.councilMember.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Integrante del Consejo no encontrado.');
    }

    const data: {
      fullName?: string;
      role?: string;
      personalBio?: string | null;
      displayOrder?: number;
    } = {};

    if (dto.fullName !== undefined) {
      const trimmedName = dto.fullName.trim();
      if (!trimmedName) {
        throw new BadRequestException('El nombre y apellidos son obligatorios.');
      }
      data.fullName = trimmedName;
    }

    if (dto.role !== undefined) {
      data.role = dto.role;
    }

    if (dto.personalBio !== undefined) {
      const trimmedBio = dto.personalBio === null ? '' : dto.personalBio.trim();
      data.personalBio = trimmedBio ? trimmedBio : null;
    }

    if (dto.displayOrder !== undefined) {
      data.displayOrder = dto.displayOrder;
    }

    return this.prisma.councilMember.update({
      where: { id },
      data,
    });
  }

  async reorder(orderedIds: string[]) {
    if (new Set(orderedIds).size !== orderedIds.length) {
      throw new BadRequestException(
        'La lista de orden contiene identificadores duplicados.',
      );
    }

    const existingMembers = await this.prisma.councilMember.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true },
    });

    const existingIds = new Set(existingMembers.map((member) => member.id));
    for (const id of orderedIds) {
      if (!existingIds.has(id)) {
        throw new BadRequestException(
          'Alguno de los integrantes indicados no existe.',
        );
      }
    }

    const providedSet = new Set(orderedIds);
    const remainingIds = existingMembers
      .map((member) => member.id)
      .filter((id) => !providedSet.has(id));
    const finalOrder = [...orderedIds, ...remainingIds];

    await this.prisma.$transaction(
      finalOrder.map((id, index) =>
        this.prisma.councilMember.update({
          where: { id },
          data: { displayOrder: index },
        }),
      ),
    );

    return this.findAll();
  }

  async remove(id: string) {
    const existing = await this.prisma.councilMember.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Integrante del Consejo no encontrado.');
    }

    await this.prisma.councilMember.delete({ where: { id } });

    const remaining = await this.prisma.councilMember.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true },
    });

    if (remaining.length > 0) {
      await this.prisma.$transaction(
        remaining.map((member, index) =>
          this.prisma.councilMember.update({
            where: { id: member.id },
            data: { displayOrder: index },
          }),
        ),
      );
    }

    return { ok: true };
  }
}
