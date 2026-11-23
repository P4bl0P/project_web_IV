import { ValidationPipe } from '@nestjs/common';
import './env';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.use(cookieParser());
  app.use(rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false }));

  app.use(
    '/auth/login',
    rateLimit({
      windowMs: 15 * 60_000,
      limit: 20,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        statusCode: 429,
        message: 'Demasiados intentos de inicio de sesión. Espera unos minutos.',
      },
    }),
  );

  app.use(
    '/auth/mfa',
    rateLimit({
      windowMs: 15 * 60_000,
      limit: 25,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        statusCode: 429,
        message: 'Demasiados intentos de verificación MFA. Espera unos minutos.',
      },
    }),
  );

  app.use(
    '/auth/invitations',
    rateLimit({
      windowMs: 15 * 60_000,
      limit: 15,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        statusCode: 429,
        message: 'Demasiados intentos sobre invitaciones. Espera unos minutos.',
      },
    }),
  );

  const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim());

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}
void bootstrap();
