import Fastify, { FastifyInstance } from 'fastify';
import request from 'supertest';
import channelsRoutes from '../channels';

// Mock database - simplified approach
const mockExecute = jest.fn();
const mockExecuteTakeFirst = jest.fn();

jest.mock('../../db/index', () => ({
  db: {
    selectFrom: jest.fn(() => ({
      selectAll: jest.fn(() => ({
        limit: jest.fn(() => ({
          offset: jest.fn(() => ({
            orderBy: jest.fn(() => ({
              execute: mockExecute,
            })),
          })),
        })),
      })),
      where: jest.fn(() => ({
        selectAll: jest.fn(() => ({
          executeTakeFirst: mockExecuteTakeFirst,
        })),
      })),
    })),
    insertInto: jest.fn(() => ({
      values: jest.fn(() => ({
        returning: jest.fn(() => ({
          executeTakeFirst: mockExecuteTakeFirst,
        })),
      })),
    })),
    deleteFrom: jest.fn(),
  },
}));

describe('Channels Routes', () => {
  let fastify: FastifyInstance;

  beforeAll(async () => {
    fastify = Fastify();
    
    // Mock jwtVerify BEFORE registering routes - this bypasses actual JWT verification
    fastify.decorateRequest('jwtVerify', async function() {
      (this as any).user = { bot_id: 'test-bot' };
    });
    
    await fastify.register(channelsRoutes, { prefix: '/api/v1/channels' });
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/channels', () => {
    it('should return list of channels', async () => {
      const mockChannels = [
        { id: '1', name: 'General', description: 'General discussion' },
      ];
      mockExecute.mockResolvedValue(mockChannels);

      const response = await request(fastify.server)
        .get('/api/v1/channels');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle pagination parameters', async () => {
      mockExecute.mockResolvedValue([]);

      const response = await request(fastify.server)
        .get('/api/v1/channels?limit=10&offset=5');

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/v1/channels', () => {
    it('should create a new channel', async () => {
      const mockChannel = { id: '1', name: 'New Channel' };
      mockExecuteTakeFirst.mockResolvedValue(mockChannel);

      const response = await request(fastify.server)
        .post('/api/v1/channels')
        .send({ name: 'New Channel', description: 'Test' });

      expect(response.status).toBe(201);
    });

    it('should reject request with missing name', async () => {
      const response = await request(fastify.server)
        .post('/api/v1/channels')
        .send({ description: 'No name' });

      // Should fail with 400 (bad request - missing required field)
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/channels/:id', () => {
    it('should return channel details', async () => {
      const mockChannel = { id: '1', name: 'Test Channel' };
      mockExecuteTakeFirst.mockResolvedValue(mockChannel);

      const response = await request(fastify.server)
        .get('/api/v1/channels/1');

      expect(response.status).toBe(200);
    });

    it('should return 404 for non-existent channel', async () => {
      mockExecuteTakeFirst.mockResolvedValue(undefined);

      const response = await request(fastify.server)
        .get('/api/v1/channels/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'NOT_FOUND');
    });
  });
});
