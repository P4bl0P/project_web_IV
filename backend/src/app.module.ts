import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApplicationsModule } from './applications/applications.module';
import { PrismaService } from './prisma.service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AdminController } from './admin.controller';

@Module({
  imports: [ApplicationsModule],
  controllers: [AppController, AuthController, AdminController],
  providers: [AppService, PrismaService, AuthService],
})
export class AppModule {}
