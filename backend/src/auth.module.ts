import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit/audit.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { AuthorizationGuard } from './authorization/authorization.guard';
import { AuthorizationService } from './authorization/authorization.service';
import { PrismaModule } from './prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, AuthorizationService, AuthorizationGuard, AuditService],
  exports: [AuthService, AuthGuard, AuthorizationService, AuthorizationGuard, AuditService],
})
export class AuthModule {}
