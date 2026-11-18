import { IntersectionType, OmitType, PartialType } from '@nestjs/mapped-types';
import { CompleteEnrollmentDto } from './complete-enrollment.dto';
import { CreateApplicationDto } from './create-application.dto';

export class CreateDirectCensusDto extends IntersectionType(
  CreateApplicationDto,
  CompleteEnrollmentDto,
) {}

class CensusFieldsDto extends IntersectionType(CreateApplicationDto, CompleteEnrollmentDto) {}

export class UpdateCensusDto extends PartialType(
  OmitType(CensusFieldsDto, ['signatureParent1', 'signatureParent2'] as const),
) {}
