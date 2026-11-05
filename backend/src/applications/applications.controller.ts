import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { CompleteEnrollmentDto } from './dto/complete-enrollment.dto';
import { CreateCensusMemberDto } from './dto/create-census-member.dto';
import { ApplicationStatus } from '@prisma/client';
import { AuthGuard, ensurePermission } from '../auth.guard';
import type { AuthenticatedRequest } from '../auth.guard';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  // Fase 1: Enviar solicitud de entrada
  @Post()
  create(@Body() createApplicationDto: CreateApplicationDto) {
    return this.applicationsService.create(createApplicationDto);
  }

  // Panel Kraal: Listar todas (filtrable por ?status=LISTA_ESPERA)
  @Get()
  @UseGuards(AuthGuard)
  findAll(@Query('status') status?: ApplicationStatus, @Req() req?: AuthenticatedRequest) {
    ensurePermission(req!, 'Secretaría', 'canRead');
    return this.applicationsService.findAll(status);
  }

  // Panel Kraal: Obtener el Censo Oficial
  @Get('census')
  @UseGuards(AuthGuard)
  findCensus(
    @Query('memberType') memberType: 'EDUCANDO' | 'RESPONSABLE' | undefined,
    @Query('branch') branch: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    ensurePermission(req, 'Secretaría', 'canRead');
    return this.applicationsService.findCensus(memberType, branch);
  }

  @Post('census/members')
  @UseGuards(AuthGuard)
  createCensusMember(
    @Body() dto: CreateCensusMemberDto,
    @Req() req: AuthenticatedRequest,
  ) {
    ensurePermission(req, 'Secretaría', 'canCreate');
    return this.applicationsService.createCensusMember(dto, req);
  }

  // Fase 2 (Padres): Abrir enlace mágico por Token
  @Get('magic/:token')
  findByMagicToken(@Param('token') token: string) {
    return this.applicationsService.findByMagicToken(token);
  }

  // Fase 2 (Padres): Enviar formulario de inscripción + ficha médica + SEPA
  @Post('magic/:token')
  completeMagicEnrollment(
    @Param('token') token: string,
    @Body() completeEnrollmentDto: CompleteEnrollmentDto,
  ) {
    return this.applicationsService.completeMagicEnrollment(
      token,
      completeEnrollmentDto,
    );
  }

  // Panel Kraal: Ofertar plaza y generar token mágico (+7 días)
  @Patch(':id/offer-spot')
  @UseGuards(AuthGuard)
  offerSpot(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    ensurePermission(req, 'Secretaría', 'canUpdate');
    return this.applicationsService.offerSpot(id);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    ensurePermission(req, 'Secretaría', 'canRead');
    return this.applicationsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    ensurePermission(req, 'Secretaría', 'canUpdate');
    return this.applicationsService.update(id, updateApplicationDto, req);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    ensurePermission(req, 'Secretaría', 'canDelete');
    return this.applicationsService.remove(id);
  }

  // Panel Kraal: Importar Excel de Lista de Espera o Censo Oficial
  @Post('bulk-import')
  @UseGuards(AuthGuard)
  bulkImport(@Body() body: { items: any[] }, @Req() req: AuthenticatedRequest) {
    ensurePermission(req, 'Secretaría', 'canCreate');
    return this.applicationsService.bulkImport(body.items || []);
  }
}