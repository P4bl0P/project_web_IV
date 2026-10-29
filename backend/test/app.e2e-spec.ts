import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Applications & Health E2E', () => {
  let app: INestApplication;

  const mockPrisma = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    application: {
      create: jest.fn().mockImplementation(({ data }) => ({
        id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'PENDING',
        requestDate: new Date().toISOString(),
        ...data,
      })),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns 200', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
      });
  });

  it('POST /applications rejects invalid branch or missing fields (400)', () => {
    return request(app.getHttpServer())
      .post('/applications')
      .send({
        requestedBranch: 'INVALID_BRANCH',
        childName: 'A',
      })
      .expect(400);
  });

  it('GET /applications/:id rejects invalid UUID format (400)', () => {
    return request(app.getHttpServer())
      .get('/applications/not-a-valid-uuid')
      .expect(400);
  });

  it('GET /applications/:id returns 404 when UUID is valid but not found', () => {
    return request(app.getHttpServer())
      .get('/applications/550e8400-e29b-41d4-a716-446655440000')
      .expect(404);
  });
});