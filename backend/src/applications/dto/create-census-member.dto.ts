import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { MemberType } from '@prisma/client';
import { CreateApplicationDto } from './create-application.dto';

export class CreateCensusMemberDto extends CreateApplicationDto {
  @IsEnum(MemberType)
  memberType: MemberType;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @IsOptional()
  censusBranch?: string;
}
