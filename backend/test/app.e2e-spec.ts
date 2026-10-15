import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { AuthService } from '../src/auth/auth.service';
describe('AppController (e2e)', () => {
  let app: INestApplication;
  beforeAll(async () => { const module = await Test.createTestingModule({ controllers: [AppController], providers: [AppService, { provide: AuthService, useValue: {} }] }).compile(); app = module.createNestApplication(); await app.init(); });
  afterAll(async () => { await app.close(); });
  it('serves the health endpoint', () => request(app.getHttpServer()).get('/health').expect(200).expect(res => expect(res.body.status).toBe('ok')));
});
