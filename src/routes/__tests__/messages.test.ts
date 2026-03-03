/**
 * 消息 API 测试
 * 覆盖频道消息的发送、获取、删除功能
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import Fastify, { FastifyInstance } from 'fastify';
import jwt from '@fastify/jwt';
import channelsRoutes from '../channels.js';
import authRoutes from '../auth.js';

describe('Messages API', () => {
  let fastify: FastifyInstance;
  let authToken: string;
  let channelId: string;
  let messageId: string;

  beforeAll(async () => {
    // 创建 Fastify 实例
    fastify = Fastify({ logger: false });

    // 注册 JWT
    await fastify.register(jwt, { secret: 'test-secret' });

    // 注册路由
    await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
    await fastify.register(channelsRoutes, { prefix: '/api/v1/channels' });

    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  beforeEach(async () => {
    // 注册并登录获取 token
    const registerRes = await fastify.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { name: 'test-bot-messages', description: 'Test bot for messages' },
    });

    const { bot_secret } = JSON.parse(registerRes.payload);

    const loginRes = await fastify.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { name: 'test-bot-messages', bot_secret },
    });

    authToken = JSON.parse(loginRes.payload).access_token;

    // 创建测试频道
    const channelRes = await fastify.inject({
      method: 'POST',
      url: '/api/v1/channels',
      headers: { Authorization: `Bearer ${authToken}` },
      payload: { name: 'test-channel-messages', description: 'Test channel' },
    });

    channelId = JSON.parse(channelRes.payload).id;
  });

  afterEach(async () => {
    // 清理消息数据
    await db.deleteFrom('messages').execute();
    await db.deleteFrom('channels').execute();
    await db.deleteFrom('bots').execute();
  });

  describe('POST /channels/:id/messages - 发送消息', () => {
    it('应该成功发送消息', async () => {
      const res = await fastify.inject({
        method: 'POST',
        url: `/api/v1/channels/${channelId}/messages`,
        headers: { Authorization: `Bearer ${authToken}` },
        payload: { content: 'Hello, World!', metadata: { type: 'text' } },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.content).toBe('Hello, World!');
      expect(body.channel_id).toBe(channelId);
      expect(body.id).toBeDefined();
      messageId = body.id;
    });

    it('应该拒绝空内容消息', async () => {
      const res = await fastify.inject({
        method: 'POST',
        url: `/api/v1/channels/${channelId}/messages`,
        headers: { Authorization: `Bearer ${authToken}` },
        payload: { content: '' },
      });

      expect(res.statusCode).toBe(400);
    });

    it('应该拒绝未授权请求', async () => {
      const res = await fastify.inject({
        method: 'POST',
        url: `/api/v1/channels/${channelId}/messages`,
        payload: { content: 'No auth' },
      });

      expect(res.statusCode).toBe(401);
    });

    it('应该拒绝不存在的频道', async () => {
      const res = await fastify.inject({
        method: 'POST',
        url: '/api/v1/channels/non-existent-id/messages',
        headers: { Authorization: `Bearer ${authToken}` },
        payload: { content: 'Test' },
      });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /channels/:id/messages - 获取消息', () => {
    beforeEach(async () => {
      // 创建一些测试消息
      for (let i = 0; i < 5; i++) {
        await db
          .insertInto('messages')
          .values({
            channel_id: channelId,
            bot_id: (await db.selectFrom('bots').select('id').executeTakeFirst())!.id,
            content: `Message ${i}`,
            metadata: { index: i },
          })
          .execute();
      }
    });

    it('应该获取频道消息列表', async () => {
      const res = await fastify.inject({
        method: 'GET',
        url: `/api/v1/channels/${channelId}/messages`,
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(res.statusCode).toBe(200);
      const messages = JSON.parse(res.payload);
      expect(messages.length).toBe(5);
      expect(messages[0].content).toBe('Message 0');
    });

    it('应该支持 since 参数进行轮询', async () => {
      // 获取第一条消息的时间戳
      const firstRes = await fastify.inject({
        method: 'GET',
        url: `/api/v1/channels/${channelId}/messages`,
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const messages = JSON.parse(firstRes.payload);
      const sinceTimestamp = new Date(messages[2].created_at).getTime();

      // 只获取 since 之后的消息
      const res = await fastify.inject({
        method: 'GET',
        url: `/api/v1/channels/${channelId}/messages?since=${sinceTimestamp}`,
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const filteredMessages = JSON.parse(res.payload);
      expect(filteredMessages.length).toBe(2); // 只返回第 3、4 条消息
    });

    it('应该支持 limit 和 offset 分页', async () => {
      const res = await fastify.inject({
        method: 'GET',
        url: `/api/v1/channels/${channelId}/messages?limit=2&offset=1`,
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(res.statusCode).toBe(200);
      const messages = JSON.parse(res.payload);
      expect(messages.length).toBe(2);
      expect(messages[0].content).toBe('Message 1');
    });

    it('应该返回不存在的频道 404', async () => {
      const res = await fastify.inject({
        method: 'GET',
        url: '/api/v1/channels/non-existent-id/messages',
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /channels/:id/messages/:messageId - 删除消息', () => {
    beforeEach(async () => {
      // 创建测试消息
      const bot = await db.selectFrom('bots').select('id').executeTakeFirst();
      const result = await db
        .insertInto('messages')
        .values({
          channel_id: channelId,
          bot_id: bot!.id,
          content: 'Message to delete',
          metadata: {},
        })
        .returning('id')
        .executeTakeFirst();

      messageId = result!.id;
    });

    it('应该成功删除自己的消息', async () => {
      const res = await fastify.inject({
        method: 'DELETE',
        url: `/api/v1/channels/${channelId}/messages/${messageId}`,
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(res.statusCode).toBe(204);

      // 验证消息已被删除
      const message = await db
        .selectFrom('messages')
        .where('id', '=', messageId)
        .select('id')
        .executeTakeFirst();

      expect(message).toBeUndefined();
    });

    it('应该拒绝删除不存在的消息', async () => {
      const res = await fastify.inject({
        method: 'DELETE',
        url: `/api/v1/channels/${channelId}/messages/non-existent-id`,
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(res.statusCode).toBe(404);
    });

    it('应该拒绝未授权删除', async () => {
      const res = await fastify.inject({
        method: 'DELETE',
        url: `/api/v1/channels/${channelId}/messages/${messageId}`,
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('消息轮询核心功能', () => {
    it('应该支持实时轮询场景', async () => {
      // 初始获取所有消息（空）
      const initialRes = await fastify.inject({
        method: 'GET',
        url: `/api/v1/channels/${channelId}/messages`,
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(JSON.parse(initialRes.payload).length).toBe(0);

      // 模拟 Bot A 发送消息
      const bot = await db.selectFrom('bots').select('id').executeTakeFirst();
      await db
        .insertInto('messages')
        .values({
          channel_id: channelId,
          bot_id: bot!.id,
          content: 'New message during poll',
          metadata: {},
        })
        .execute();

      // 使用 since 参数轮询（应该返回新消息）
      const pollRes = await fastify.inject({
        method: 'GET',
        url: `/api/v1/channels/${channelId}/messages?since=0`,
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const messages = JSON.parse(pollRes.payload);
      expect(messages.length).toBe(1);
      expect(messages[0].content).toBe('New message during poll');
    });
  });
});
