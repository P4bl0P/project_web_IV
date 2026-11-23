import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AdminService } from './admin/admin.service';
import {
  CreateModuleDto,
  CreateRoleDto,
  CreateUserDto,
  QueryAuditDto,
  UpdateModuleDto,
  UpdatePermissionDto,
  UpdateRoleDto,
  UpdateRolePermissionsDto,
  UpdateUserDto,
} from './admin/dto/admin.dto';
import { AuthGuard } from './auth.guard';
import type { AuthenticatedRequest } from './auth.guard';
import { RequireSuperAdmin } from './authorization/authorization.decorators';
import { AuthorizationGuard } from './authorization/authorization.guard';

@Controller('admin')
@UseGuards(AuthGuard, AuthorizationGuard)
@RequireSuperAdmin()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  users(@Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'no-store');
    return this.adminService.listUsers();
  }

  @Post('users')
  createUser(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'no-store');
    return this.adminService.createUser(req.user!.id!, body, req.ip);
  }

  @Patch('users/:id')
  updateUser(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'no-store');
    return this.adminService.updateUser(req.user!.id!, id, body, req.ip);
  }

  @Post('users/:id/reset-password')
  resetPassword(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'no-store');
    return this.adminService.resetPassword(req.user!.id!, id, req.ip);
  }

  @Post('users/:id/reset-mfa')
  resetMfa(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'no-store');
    return this.adminService.resetMfa(req.user!.id!, id, req.ip);
  }

  @Post('users/:id/deactivate')
  deactivateUser(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'no-store');
    return this.adminService.deactivateUser(req.user!.id!, id, req.ip);
  }

  @Delete('users/:id')
  deleteUser(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'no-store');
    return this.adminService.deleteUser(req.user!.id!, id, req.ip);
  }

  @Get('roles')
  roles(@Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'no-store');
    return this.adminService.listRoles();
  }

  @Post('roles')
  createRole(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateRoleDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'no-store');
    return this.adminService.createRole(req.user!.id!, body, req.ip);
  }

  @Patch('roles/:id')
  updateRole(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateRoleDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'no-store');
    return this.adminService.updateRole(req.user!.id!, id, body, req.ip);
  }

  @Delete('roles/:id')
  deleteRole(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'no-store');
    return this.adminService.deleteRole(req.user!.id!, id, req.ip);
  }

  @Put('roles/:id/permissions')
  updateRolePermissions(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateRolePermissionsDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'no-store');
    return this.adminService.updateRolePermissions(req.user!.id!, id, body, req.ip);
  }

  @Get('modules')
  modules(@Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'no-store');
    return this.adminService.listModules();
  }

  @Post('modules')
  createModule(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateModuleDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'no-store');
    return this.adminService.createModule(req.user!.id!, body, req.ip);
  }

  @Patch('modules/:id')
  updateModule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateModuleDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'no-store');
    return this.adminService.updateModule(req.user!.id!, id, body, req.ip);
  }

  @Get('permissions')
  permissions(@Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'no-store');
    return this.adminService.listPermissions();
  }

  @Patch('permissions/:id')
  updatePermission(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdatePermissionDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'no-store');
    return this.adminService.updatePermission(req.user!.id!, id, body, req.ip);
  }

  @Get('audit')
  audit(@Query() query: QueryAuditDto, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'no-store');
    return this.adminService.listAudit(query);
  }
}
