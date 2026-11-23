import {
  Body,
  Controller,
  Delete,
  Get,
  Optional,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { AuthGuard, ensureWebContentPermission } from '../auth.guard';
import type { AuthenticatedRequest } from '../auth.guard';
import { RequirePermission } from '../authorization/authorization.decorators';
import { AuthorizationGuard } from '../authorization/authorization.guard';
import { CouncilService } from './council.service';
import { CreateCouncilMemberDto } from './dto/create-council-member.dto';
import {
  ReorderCouncilMembersDto,
  UpdateCouncilMemberDto,
} from './dto/update-council-member.dto';

@Controller('council')
export class CouncilController {
  constructor(
    private readonly councilService: CouncilService,
    @Optional() private readonly auditService?: AuditService,
  ) {}

  @Get()
  findPublic() {
    return this.councilService.findAll();
  }

  @Get('manage')
  @UseGuards(AuthGuard, AuthorizationGuard)
  @RequirePermission('secretaria', 'read', 'manage_web_content')
  findManage(@Req() req: AuthenticatedRequest) {
    ensureWebContentPermission(req, 'read');
    return this.councilService.findAll();
  }

  @Post()
  @UseGuards(AuthGuard, AuthorizationGuard)
  @RequirePermission('secretaria', 'create', 'manage_web_content')
  async create(
    @Body() dto: CreateCouncilMemberDto,
    @Req() req: AuthenticatedRequest,
  ) {
    ensureWebContentPermission(req, 'create');
    const created = await this.councilService.create(dto);
    await this.auditService?.record({
      actorId: req.user?.id ?? null,
      action: 'COUNCIL_MEMBER_CREATED',
      targetType: 'council_member',
      targetId: created.id,
      resource: `council:${created.id}`,
      result: 'ALLOWED',
      ipAddress: req.ip,
      newValues: { fullName: created.fullName, role: created.role },
    });
    return created;
  }

  @Patch('reorder')
  @UseGuards(AuthGuard, AuthorizationGuard)
  @RequirePermission('secretaria', 'update', 'manage_web_content')
  async reorder(
    @Body() dto: ReorderCouncilMembersDto,
    @Req() req: AuthenticatedRequest,
  ) {
    ensureWebContentPermission(req, 'update');
    const result = await this.councilService.reorder(dto.orderedIds);
    await this.auditService?.record({
      actorId: req.user?.id ?? null,
      action: 'COUNCIL_MEMBERS_REORDERED',
      targetType: 'council_member',
      resource: 'council:order',
      result: 'ALLOWED',
      ipAddress: req.ip,
      newValues: { orderedIds: dto.orderedIds },
    });
    return result;
  }

  @Patch(':id')
  @UseGuards(AuthGuard, AuthorizationGuard)
  @RequirePermission('secretaria', 'update', 'manage_web_content')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCouncilMemberDto,
    @Req() req: AuthenticatedRequest,
  ) {
    ensureWebContentPermission(req, 'update');
    const updated = await this.councilService.update(id, dto);
    await this.auditService?.record({
      actorId: req.user?.id ?? null,
      action: 'COUNCIL_MEMBER_UPDATED',
      targetType: 'council_member',
      targetId: id,
      resource: `council:${id}`,
      result: 'ALLOWED',
      ipAddress: req.ip,
      newValues: dto,
    });
    return updated;
  }

  @Delete(':id')
  @UseGuards(AuthGuard, AuthorizationGuard)
  @RequirePermission('secretaria', 'delete', 'manage_web_content')
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    ensureWebContentPermission(req, 'delete');
    const result = await this.councilService.remove(id);
    await this.auditService?.record({
      actorId: req.user?.id ?? null,
      action: 'COUNCIL_MEMBER_DELETED',
      targetType: 'council_member',
      targetId: id,
      resource: `council:${id}`,
      result: 'ALLOWED',
      ipAddress: req.ip,
    });
    return result;
  }
}
