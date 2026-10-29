import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { CompleteEnrollmentDto } from './dto/complete-enrollment.dto';
import { ApplicationStatus } from '@prisma/client';

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
  findAll(@Query('status') status?: ApplicationStatus) {
    return this.applicationsService.findAll(status);
  }

  // Panel Kraal: Obtener el Censo Oficial
  @Get('census')
  findCensus() {
    return this.applicationsService.findCensus();
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
  offerSpot(@Param('id') id: string) {
    return this.applicationsService.offerSpot(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.applicationsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
  ) {
    return this.applicationsService.update(id, updateApplicationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.applicationsService.remove(id);
  }
}