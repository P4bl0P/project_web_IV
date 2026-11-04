// backend/src/app.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'grupo-iv-scouts-api',
      timestamp: new Date().toISOString(),
    };
  }
}