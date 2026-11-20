import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthService } from '../auth.service';
import { AuthGuard } from '../auth.guard';
import { CouncilController } from './council.controller';
import { CouncilService } from './council.service';

@Module({
  imports: [PrismaModule],
  controllers: [CouncilController],
  providers: [CouncilService, AuthService, AuthGuard],
})
export class CouncilModule {}
