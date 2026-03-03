import Fastify, { FastifyInstance } from 'fastify';
import request from 'supertest';
import authRoutes from '../auth';
import { db } from '../../db/index.js';
import bcrypt from 'bcrypt';

describe('Auth Routes - Secure Refresh Token', () => {
  let fastify: FastifyInstance;
  let testBotId: string;
  let validRefreshToken: string;

  beforeAll(async () => {
    fastify = Fastify();
    fastify.register(require('@fastify/jwt'), { secret: 'test-secret' });
    await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
    await fastify.ready();

    // 创建测试 bot
    const botSecret = 'test_secret_123';
    const botSecretHash = await bcrypt.hash(botSecret, 10);

    const result = await db
      .insertInto('bots')
      .values({
        name: 'test-bot-refresh',
        bot_secret_hash: botSecretHash,
        description: 'Test bot for refresh token tests',
      })
      .returning(['id'])
      .executeTakeFirst();

    if (result) {
      testBotId = result.id;
    }
  });

  afterAll(async () => {
    // 清理测试数据
    if (testBotId) {
      await db.deleteFrom('bot_refresh_tokens').where('bot_id', '=', testBotId).execute();
      await db.deleteFrom('bots').where('id', '=', testBotId).execute();
    }
    await fastify.close();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should store refresh token on successful login', async () => {
      const response = await request(fastify.server).post('/api/v1/auth/login').send({
        name: 'test-bot-refresh',
        bot_secret: 'test_secret_123',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
      expect(response.body.refresh_token).toMatch(/^synapse_rt_/);

      validRefreshToken = response.body.refresh_token;

      // 验证 token 已存储到数据库
      const tokens = await db
        .selectFrom('bot_refresh_tokens')
        .where('bot_id', '=', testBotId)
        .selectAll()
        .execute();

      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens[0].expires_at).toBeDefined();
      expect(tokens[0].revoked_at).toBeNull();
    });

    it('should reject login with invalid credentials', async () => {
      const response = await request(fastify.server).post('/api/v1/auth/login').send({
        name: 'test-bot-refresh',
        bot_secret: 'wrong_secret',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'UNAUTHORIZED');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should accept valid refresh token', async () => {
      if (!validRefreshToken) {
        // 先登录获取 token
        const loginResponse = await request(fastify.server).post('/api/v1/auth/login').send({
          name: 'test-bot-refresh',
          bot_secret: 'test_secret_123',
        });
        validRefreshToken = loginResponse.body.refresh_token;
      }

      const response = await request(fastify.server)
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: validRefreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
      expect(response.body.refresh_token).not.toBe(validRefreshToken); // 新 token
    });

    it('should reject invalid refresh token format', async () => {
      const response = await request(fastify.server)
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: 'invalid_token_format' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'UNAUTHORIZED');
    });

    it('should reject non-existent refresh token', async () => {
      const response = await request(fastify.server)
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: 'synapse_rt_nonexistent' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'UNAUTHORIZED');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should revoke refresh token on logout', async () => {
      // 先登录获取 token
      const loginResponse = await request(fastify.server).post('/api/v1/auth/login').send({
        name: 'test-bot-refresh',
        bot_secret: 'test_secret_123',
      });

      const logoutToken = loginResponse.body.refresh_token;

      // 登出
      const logoutResponse = await request(fastify.server)
        .post('/api/v1/auth/logout')
        .send({ refresh_token: logoutToken });

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body).toHaveProperty('success', true);

      // 验证 token 已被撤销
      const tokens = await db
        .selectFrom('bot_refresh_tokens')
        .where('bot_id', '=', testBotId)
        .orderBy('created_at', 'desc')
        .limit(1)
        .selectAll()
        .execute();

      expect(tokens[0].revoked_at).not.toBeNull();

      // 尝试使用已撤销的 token 刷新应该失败
      const refreshResponse = await request(fastify.server)
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: logoutToken });

      expect(refreshResponse.status).toBe(401);
    });

    it('should return success even for invalid token (prevent enumeration)', async () => {
      const response = await request(fastify.server)
        .post('/api/v1/auth/logout')
        .send({ refresh_token: 'synapse_rt_invalid' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });
});
