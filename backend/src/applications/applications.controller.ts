import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  AuthGuard,
  canReadSensitiveMedicalOrBankData,
  ensurePermission,
  type AuthenticatedRequest,
} from '../auth.guard';
import { ApplicationsService, type AuditContext } from './applications.service';
import { CompleteEnrollmentDto } from './dto/complete-enrollment.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { CreateDirectCensusDto, UpdateCensusDto } from './dto/direct-census.dto';
import {
  DeactivateApplicationDto,
  OfferSpotDto,
  ReactivateApplicationDto,
  ReturnToWaitlistDto,
} from './dto/lifecycle-actions.dto';
import { QueryApplicationsDto } from './dto/query-applications.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

function auditContextFromRequest(req?: AuthenticatedRequest | Request): AuditContext {
  const authReq = req as AuthenticatedRequest | undefined;
  return {
    actorId: authReq?.user?.id ?? null,
    ipAddress: req?.ip,
    user: authReq?.user,
  };
}

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  // Fase 1: Enviar solicitud pública de entrada
  @Post()
  create(@Body() createApplicationDto: CreateApplicationDto, @Req() req?: Request) {
    return this.applicationsService.create(createApplicationDto, auditContextFromRequest(req));
  }

  // Panel Kraal: Listar todas (compatibilidad + resumen seguro sin exponer datos médicos/IBAN)
  @Get()
  @UseGuards(AuthGuard)
  findAll(@Query() query?: QueryApplicationsDto, @Req() req?: AuthenticatedRequest) {
    ensurePermission(req!, 'Secretaría', 'canRead');
    return this.applicationsService.findAll(query);
  }

  // Panel Kraal: Listado paginado en servidor con contadores por pestaña
  @Get('paginated')
  @UseGuards(AuthGuard)
  findPaginated(@Query() query?: QueryApplicationsDto, @Req() req?: AuthenticatedRequest) {
    ensurePermission(req!, 'Secretaría', 'canRead');
    return this.applicationsService.findPaginated(query);
  }

  // Panel Kraal: Obtener el Censo Oficial
  @Get('census')
  @UseGuards(AuthGuard)
  findCensus(@Query() query?: QueryApplicationsDto, @Req() req?: AuthenticatedRequest) {
    ensurePermission(req!, 'Secretaría', 'canRead');
    return this.applicationsService.findCensus(query);
  }

  // Alta administrativa directa en censo
  @Post('census')
  @UseGuards(AuthGuard)
  createDirectCensus(
    @Body() dto: CreateDirectCensusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    ensurePermission(req, 'Secretaría', 'canCreate');
    return this.applicationsService.createDirectCensus(dto, auditContextFromRequest(req));
  }

  // Fase 2 (Padres): Abrir enlace mágico por Token (solo datos mínimos necesarios)
  @Get('magic/:token')
  findByMagicToken(@Param('token') token: string) {
    return this.applicationsService.findByMagicToken(token);
  }

  // Fase 2 (Padres): Completar inscripción oficial mediante enlace mágico (atómico, 1 solo uso)
  @Post('magic/:token')
  completeMagicEnrollment(
    @Param('token') token: string,
    @Body() completeEnrollmentDto: CompleteEnrollmentDto,
    @Req() req?: Request,
  ) {
    return this.applicationsService.completeMagicEnrollment(
      token,
      completeEnrollmentDto,
      auditContextFromRequest(req),
    );
  }

  // Detalle completo de expediente (controla visibilidad médica/bancaria y audita acceso)
  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    ensurePermission(req, 'Secretaría', 'canRead');
    return this.applicationsService.findOne(id, auditContextFromRequest(req));
  }

  // Historial de auditoría del expediente
  @Get(':id/history')
  @UseGuards(AuthGuard)
  getHistory(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    ensurePermission(req, 'Secretaría', 'canRead');
    return this.applicationsService.getHistory(id);
  }

  // Vista previa del payload preparado para la futura integración con Aurora
  @Get(':id/aurora-preview')
  @UseGuards(AuthGuard)
  getAuroraPreview(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    ensurePermission(req, 'Secretaría', 'canUpdate');
    if (
      !canReadSensitiveMedicalOrBankData(req.user, 'medical') &&
      !req.user?.isSuperAdmin
    ) {
      ensurePermission(req, 'Secretaría', 'canUpdate');
    }
    return this.applicationsService.getAuroraPreview(id, {}, auditContextFromRequest(req));
  }

  // Editar datos de solicitud (sin transiciones directas de estado)
  @Patch(':id')
  @UseGuards(AuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    ensurePermission(req, 'Secretaría', 'canUpdate');
    return this.applicationsService.update(
      id,
      updateApplicationDto,
      auditContextFromRequest(req),
    );
  }

  // Validar solicitud inicial -> LISTA_ESPERA
  @Patch(':id/validate')
  @UseGuards(AuthGuard)
  validateApplication(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    ensurePermission(req, 'Secretaría', 'canUpdate');
    return this.applicationsService.validateApplication(id, auditContextFromRequest(req));
  }

  // Ofertar plaza y generar token mágico (+7 días)
  @Patch(':id/offer-spot')
  @UseGuards(AuthGuard)
  offerSpot(
    @Param('id') id: string,
    @Body() dto: OfferSpotDto,
    @Req() req: AuthenticatedRequest,
  ) {
    ensurePermission(req, 'Secretaría', 'canUpdate');
    return this.applicationsService.offerSpot(id, dto, auditContextFromRequest(req));
  }

  // Renovar enlace mágico caducado o reabrir oferta invalidando el token anterior
  @Patch(':id/renew-token')
  @UseGuards(AuthGuard)
  renewToken(
    @Param('id') id: string,
    @Body() dto: OfferSpotDto,
    @Req() req: AuthenticatedRequest,
  ) {
    ensurePermission(req, 'Secretaría', 'canUpdate');
    return this.applicationsService.renewMagicLink(id, dto, auditContextFromRequest(req));
  }

  // Devolver a lista de espera (invalidando el enlace mágico)
  @Patch(':id/return-waitlist')
  @UseGuards(AuthGuard)
  returnToWaitlist(
    @Param('id') id: string,
    @Body() dto: ReturnToWaitlistDto,
    @Req() req: AuthenticatedRequest,
  ) {
    ensurePermission(req, 'Secretaría', 'canUpdate');
    return this.applicationsService.returnToWaitlist(id, dto, auditContextFromRequest(req));
  }

  // Marcar inscripción completada como revisada por Secretaría
  @Patch(':id/mark-reviewed')
  @UseGuards(AuthGuard)
  markReviewed(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    ensurePermission(req, 'Secretaría', 'canUpdate');
    return this.applicationsService.markEnrollmentReviewed(id, auditContextFromRequest(req));
  }

  // Censar oficialmente al educando (establece admittedAt, ronda solar y rama)
  @Patch(':id/admit-census')
  @UseGuards(AuthGuard)
  admitToCensus(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    ensurePermission(req, 'Secretaría', 'canUpdate');
    return this.applicationsService.admitToCensus(id, auditContextFromRequest(req));
  }

  // Dar de baja con motivo estructurado
  @Patch(':id/deactivate')
  @UseGuards(AuthGuard)
  deactivate(
    @Param('id') id: string,
    @Body() dto: DeactivateApplicationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    ensurePermission(req, 'Secretaría', 'canUpdate');
    return this.applicationsService.deactivate(id, dto, auditContextFromRequest(req));
  }

  // Reactivar expediente desde Baja
  @Patch(':id/reactivate')
  @UseGuards(AuthGuard)
  reactivate(
    @Param('id') id: string,
    @Body() dto: ReactivateApplicationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    ensurePermission(req, 'Secretaría', 'canUpdate');
    return this.applicationsService.reactivate(id, dto, auditContextFromRequest(req));
  }

  // Editar expediente censado
  @Patch(':id/census')
  @UseGuards(AuthGuard)
  updateCensus(
    @Param('id') id: string,
    @Body() dto: UpdateCensusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    ensurePermission(req, 'Secretaría', 'canUpdate');
    return this.applicationsService.updateCensus(id, dto, auditContextFromRequest(req));
  }

  // Eliminar expediente excepcionalmente
  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    ensurePermission(req, 'Secretaría', 'canDelete');
    return this.applicationsService.remove(id, auditContextFromRequest(req));
  }
}
