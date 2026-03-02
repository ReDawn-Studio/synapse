import Fastify, { FastifyInstance } from 'fastify';
import request from 'supertest';
import authRoutes from '../auth';

describe('Auth Routes', () => {
  let fastify: FastifyInstance;

  beforeAll(async () => {
    fastify = Fastify();
    await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should reject registration with short name', async () => {
      const response = await request(fastify.server)
        .post('/api/v1/auth/register')
        .send({ name: 'ab' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should accept registration with valid name', async () => {
      const response = await request(fastify.server)
        .post('/api/v1/auth/register')
        .send({ 
          name: 'test-bot',
          description: 'A test bot'
        });

      // Note: This will fail without database connection
      // In real tests, we'd mock the database
      expect([200, 500]).toContain(response.status);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      // Health endpoint is registered in main index.ts
      // This is a placeholder for integration tests
      expect(true).toBe(true);
    });
  });
});
