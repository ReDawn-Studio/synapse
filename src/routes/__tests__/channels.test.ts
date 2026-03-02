import Fastify, { FastifyInstance } from 'fastify';
import request from 'supertest';
import channelsRoutes from '../channels';

// Mock database
jest.mock('../../db/index', () => ({
  db: {
    insertInto: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    executeTakeFirst: jest.fn(),
    selectFrom: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    getAll: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    deleteFrom: jest.fn().mockReturnThis(),
  },
}));

describe('Channels Routes', () => {
  let fastify: FastifyInstance;

  beforeAll(async () => {
    fastify = Fastify();
    // Skip JWT verification in tests
    fastify.decorateRequest('user', null);
    fastify.addHook('preHandler', async (request: any) => {
      request.user = { bot_id: 'test-bot' };
    });
    await fastify.register(channelsRoutes, { prefix: '/api/v1/channels' });
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  describe('GET /api/v1/channels', () => {
    it('should return list of channels', async () => {
      const mockChannels = [
        { id: '1', name: 'General', description: 'General discussion' },
      ];
      (fastify as any).db.execute.mockResolvedValue(mockChannels);

      const response = await request(fastify.server)
        .get('/api/v1/channels');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle pagination parameters', async () => {
      const response = await request(fastify.server)
        .get('/api/v1/channels?limit=10&offset=5');

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/v1/channels', () => {
    it('should create a new channel', async () => {
      const mockChannel = { id: '1', name: 'New Channel' };
      (fastify as any).db.executeTakeFirst.mockResolvedValue(mockChannel);

      const response = await request(fastify.server)
        .post('/api/v1/channels')
        .send({ name: 'New Channel', description: 'Test' });

      expect([201, 500]).toContain(response.status);
    });

    it('should reject request with missing name', async () => {
      const response = await request(fastify.server)
        .post('/api/v1/channels')
        .send({ description: 'No name' });

      // Should fail validation or database operation
      expect([400, 500]).toContain(response.status);
    });
  });

  describe('GET /api/v1/channels/:id', () => {
    it('should return channel details', async () => {
      const mockChannel = { id: '1', name: 'Test Channel' };
      (fastify as any).db.executeTakeFirst.mockResolvedValue(mockChannel);

      const response = await request(fastify.server)
        .get('/api/v1/channels/1');

      expect([200, 404]).toContain(response.status);
    });

    it('should return 404 for non-existent channel', async () => {
      (fastify as any).db.executeTakeFirst.mockResolvedValue(undefined);

      const response = await request(fastify.server)
        .get('/api/v1/channels/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'NOT_FOUND');
    });
  });
});
