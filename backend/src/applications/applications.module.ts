import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { AuthService } from '../auth.service';
import { AuthGuard } from '../auth.guard';
import { SensitiveDataService } from './sensitive-data.service';
import { AuroraContactMapper } from './aurora-contact.mapper';

@Module({
  imports: [PrismaModule],
  controllers: [ApplicationsController],
  providers: [
    ApplicationsService,
    SensitiveDataService,
    AuroraContactMapper,
    AuthService,
    AuthGuard,
  ],
})
export class ApplicationsModule {}