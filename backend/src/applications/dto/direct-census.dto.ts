import { IntersectionType, PartialType } from '@nestjs/mapped-types';
import { CompleteEnrollmentDto } from './complete-enrollment.dto';
import { CreateApplicationDto } from './create-application.dto';

export class CreateDirectCensusDto extends IntersectionType(
  CreateApplicationDto,
  CompleteEnrollmentDto,
) {}

export class UpdateCensusDto extends PartialType(
  IntersectionType(CreateApplicationDto, CompleteEnrollmentDto),
) {}
