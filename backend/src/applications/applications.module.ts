import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { PrismaService } from '../prisma.service';
import { AuthService } from '../auth.service';
import { AuthGuard } from '../auth.guard';

@Module({
  imports: [PrismaModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, PrismaService, AuthService, AuthGuard],
})
export class ApplicationsModule {}