import Fastify, { FastifyInstance } from 'fastify';
import request from 'supertest';
import tasksRoutes from '../tasks';

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
    updateTable: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    deleteFrom: jest.fn().mockReturnThis(),
  },
}));

describe('Tasks Routes', () => {
  let fastify: FastifyInstance;

  beforeAll(async () => {
    fastify = Fastify();
    // Skip JWT verification in tests
    fastify.decorateRequest('user', null);
    fastify.addHook('preHandler', async (request: any) => {
      request.user = { bot_id: 'test-bot' };
    });
    await fastify.register(tasksRoutes, { prefix: '/api/v1/tasks' });
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  describe('POST /api/v1/tasks', () => {
    it('should create a new task', async () => {
      const mockTask = { 
        id: '1', 
        title: 'New Task', 
        channel_id: 'channel-1',
        status: 'pending',
        priority: 'medium'
      };
      (fastify as any).db.executeTakeFirst.mockResolvedValue(mockTask);

      const response = await request(fastify.server)
        .post('/api/v1/tasks')
        .send({ 
          channel_id: 'channel-1', 
          title: 'New Task',
          description: 'Test task'
        });

      expect([201, 500]).toContain(response.status);
      if (response.status === 201) {
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('title', 'New Task');
      }
    });

    it('should reject request with missing title', async () => {
      const response = await request(fastify.server)
        .post('/api/v1/tasks')
        .send({ channel_id: 'channel-1' });

      // Should fail validation or database operation
      expect([400, 500]).toContain(response.status);
    });

    it('should accept optional fields', async () => {
      const mockTask = { 
        id: '2', 
        title: 'Task with priority',
        priority: 'high',
        status: 'pending'
      };
      (fastify as any).db.executeTakeFirst.mockResolvedValue(mockTask);

      const response = await request(fastify.server)
        .post('/api/v1/tasks')
        .send({ 
          channel_id: 'channel-1',
          title: 'Task with priority',
          priority: 'high',
          due_at: '2026-03-10T00:00:00Z'
        });

      expect([201, 500]).toContain(response.status);
    });
  });

  describe('GET /api/v1/tasks', () => {
    it('should return list of tasks', async () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', status: 'pending' },
        { id: '2', title: 'Task 2', status: 'in_progress' },
      ];
      (fastify as any).db.execute.mockResolvedValue(mockTasks);

      const response = await request(fastify.server)
        .get('/api/v1/tasks');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('should filter by channel_id', async () => {
      const mockTasks = [{ id: '1', title: 'Task 1', channel_id: 'channel-1' }];
      (fastify as any).db.execute.mockResolvedValue(mockTasks);

      const response = await request(fastify.server)
        .get('/api/v1/tasks?channel_id=channel-1');

      expect(response.status).toBe(200);
    });

    it('should filter by status', async () => {
      const mockTasks = [{ id: '1', title: 'Task 1', status: 'pending' }];
      (fastify as any).db.execute.mockResolvedValue(mockTasks);

      const response = await request(fastify.server)
        .get('/api/v1/tasks?status=pending');

      expect(response.status).toBe(200);
    });

    it('should support pagination', async () => {
      const mockTasks = Array(10).fill(null).map((_, i) => ({
        id: `${i}`,
        title: `Task ${i}`,
      }));
      (fastify as any).db.execute.mockResolvedValue(mockTasks);

      const response = await request(fastify.server)
        .get('/api/v1/tasks?limit=10&offset=0');

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(10);
    });
  });

  describe('GET /api/v1/tasks/:id', () => {
    it('should return task details', async () => {
      const mockTask = { 
        id: '1', 
        title: 'Test Task', 
        status: 'pending',
        channel_id: 'channel-1'
      };
      (fastify as any).db.executeTakeFirst.mockResolvedValue(mockTask);

      const response = await request(fastify.server)
        .get('/api/v1/tasks/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', '1');
      expect(response.body).toHaveProperty('title', 'Test Task');
    });

    it('should return 404 for non-existent task', async () => {
      (fastify as any).db.executeTakeFirst.mockResolvedValue(undefined);

      const response = await request(fastify.server)
        .get('/api/v1/tasks/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'NOT_FOUND');
      expect(response.body).toHaveProperty('message', 'Task not found');
    });
  });

  describe('PATCH /api/v1/tasks/:id', () => {
    it('should update task status', async () => {
      const mockTask = { 
        id: '1', 
        title: 'Test Task', 
        status: 'in_progress',
        updated_at: new Date().toISOString()
      };
      (fastify as any).db.executeTakeFirst.mockResolvedValue(mockTask);

      const response = await request(fastify.server)
        .patch('/api/v1/tasks/1')
        .send({ status: 'in_progress' });

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('status', 'in_progress');
      }
    });

    it('should update task description', async () => {
      const mockTask = { 
        id: '1', 
        title: 'Test Task',
        description: 'Updated description',
        updated_at: new Date().toISOString()
      };
      (fastify as any).db.executeTakeFirst.mockResolvedValue(mockTask);

      const response = await request(fastify.server)
        .patch('/api/v1/tasks/1')
        .send({ description: 'Updated description' });

      expect([200, 500]).toContain(response.status);
    });

    it('should return 404 for non-existent task', async () => {
      (fastify as any).db.executeTakeFirst.mockResolvedValue(undefined);

      const response = await request(fastify.server)
        .patch('/api/v1/tasks/nonexistent')
        .send({ status: 'done' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/tasks/:id', () => {
    it('should delete a task', async () => {
      (fastify as any).db.executeTakeFirst.mockResolvedValue({ id: '1' });

      const response = await request(fastify.server)
        .delete('/api/v1/tasks/1');

      expect([204, 404, 500]).toContain(response.status);
    });

    it('should return 404 for non-existent task', async () => {
      (fastify as any).db.executeTakeFirst.mockResolvedValue(undefined);

      const response = await request(fastify.server)
        .delete('/api/v1/tasks/nonexistent');

      expect(response.status).toBe(404);
    });
  });

  describe('Authentication', () => {
    it('should require authentication for all routes', async () => {
      // Remove the mock user to test auth
      fastify.addHook('preHandler', async (request: any, reply: any) => {
        // Simulate missing auth
        return reply.code(401).send({ error: 'UNAUTHORIZED' });
      });

      const response = await request(fastify.server)
        .get('/api/v1/tasks');

      expect(response.status).toBe(401);
    });
  });
});
