import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, ensureWebContentPermission } from '../auth.guard';
import type { AuthenticatedRequest } from '../auth.guard';
import { CouncilService } from './council.service';
import { CreateCouncilMemberDto } from './dto/create-council-member.dto';
import {
  ReorderCouncilMembersDto,
  UpdateCouncilMemberDto,
} from './dto/update-council-member.dto';

@Controller('council')
export class CouncilController {
  constructor(private readonly councilService: CouncilService) {}

  @Get()
  findPublic() {
    return this.councilService.findAll();
  }

  @Get('manage')
  @UseGuards(AuthGuard)
  findManage(@Req() req: AuthenticatedRequest) {
    ensureWebContentPermission(req, 'canRead');
    return this.councilService.findAll();
  }

  @Post()
  @UseGuards(AuthGuard)
  create(
    @Body() dto: CreateCouncilMemberDto,
    @Req() req: AuthenticatedRequest,
  ) {
    ensureWebContentPermission(req, 'canCreate');
    return this.councilService.create(dto);
  }

  @Patch('reorder')
  @UseGuards(AuthGuard)
  reorder(
    @Body() dto: ReorderCouncilMembersDto,
    @Req() req: AuthenticatedRequest,
  ) {
    ensureWebContentPermission(req, 'canUpdate');
    return this.councilService.reorder(dto.orderedIds);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCouncilMemberDto,
    @Req() req: AuthenticatedRequest,
  ) {
    ensureWebContentPermission(req, 'canUpdate');
    return this.councilService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    ensureWebContentPermission(req, 'canDelete');
    return this.councilService.remove(id);
  }
}
