import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CouncilController } from './council.controller';
import { CouncilService } from './council.service';

@Module({
  imports: [PrismaModule],
  controllers: [CouncilController],
  providers: [CouncilService],
})
export class CouncilModule {}
