import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { AuroraContactMapper } from './aurora-contact.mapper';
import { SensitiveDataService } from './sensitive-data.service';

@Module({
  imports: [PrismaModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, SensitiveDataService, AuroraContactMapper],
})
export class ApplicationsModule {}
