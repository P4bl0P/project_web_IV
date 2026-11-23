import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { sanitizeAuditValue } from '../authorization/module-registry';

export interface RecordAuditParams {
  actorId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  resource?: string | null;
  result: 'ALLOWED' | 'DENIED';
  previousValues?: unknown;
  newValues?: unknown;
  ipAddress?: string | null;
}

function toJsonInput(
  value: unknown,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return sanitizeAuditValue(value) as Prisma.InputJsonValue;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(params: RecordAuditParams): Promise<void> {
    if (!this.prisma.auditEvent?.create) return;

    const fallbackResource =
      params.targetType && params.targetId
        ? `${params.targetType}:${params.targetId}`
        : params.targetType ?? null;

    await this.prisma.auditEvent.create({
      data: {
        actorId: params.actorId ?? null,
        action: params.action,
        targetType: params.targetType ?? null,
        targetId: params.targetId ?? null,
        resource: params.resource ?? fallbackResource,
        result: params.result,
        previousValues: toJsonInput(params.previousValues),
        newValues: toJsonInput(params.newValues),
        ipAddress: params.ipAddress ?? null,
      },
    });
  }
}
