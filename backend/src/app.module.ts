import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApplicationsModule } from './applications/applications.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AdminController } from './admin.controller';

@Module({
  imports: [PrismaModule, ApplicationsModule],
  controllers: [AppController, AuthController, AdminController],
  providers: [AppService, AuthService],
})
export class AppModule {}
