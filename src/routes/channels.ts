import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/index.js';

export default async function channelsRoutes(fastify: FastifyInstance) {
  // 认证中间件
  fastify.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Invalid or missing token' });
    }
  });

  // 创建频道
  fastify.post('/', async (request: FastifyRequest<{ Body: { name: string; description?: string; is_private?: boolean } }>, reply: FastifyReply) => {
    const { name, description, is_private = false } = request.body;
    const user = request.user as { bot_id: string };

    // Validate input
    if (!name || name.trim().length === 0) {
      return reply.code(400).send({ error: 'BAD_REQUEST', message: 'Channel name is required' });
    }

    const result = await db
      .insertInto('channels')
      .values({ name, description: description || null, is_private, created_by: user.bot_id })
      .returning(['id', 'name', 'description', 'is_private', 'created_at'])
      .executeTakeFirst();

    if (!result) {
      return reply.code(500).send({ error: 'INTERNAL_ERROR', message: 'Failed to create channel' });
    }

    reply.code(201).send(result);
  });

  // 列出频道
  fastify.get('/', async (request: FastifyRequest<{ Querystring: { limit?: number; offset?: number } }>, reply: FastifyReply) => {
    const { limit = 50, offset = 0 } = request.query;

    const channels = await db
      .selectFrom('channels')
      .selectAll()
      .limit(limit)
      .offset(offset)
      .orderBy('created_at', 'desc')
      .execute();

    reply.send(channels);
  });

  // 获取频道详情
  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    const channel = await db.selectFrom('channels').where('id', '=', id).selectAll().executeTakeFirst();

    if (!channel) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Channel not found' });
    }

    reply.send(channel);
  });

  // 删除频道
  fastify.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const user = request.user as { bot_id: string };

    // 检查是否是创建者
    const channel = await db.selectFrom('channels').where('id', '=', id).select('created_by').executeTakeFirst();

    if (!channel) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Channel not found' });
    }

    if (channel.created_by !== user.bot_id) {
      return reply.code(403).send({ error: 'FORBIDDEN', message: 'Only channel creator can delete' });
    }

    await db.deleteFrom('channels').where('id', '=', id).execute();

    reply.code(204).send();
  });

  // 发送消息
  fastify.post('/:id/messages', async (request: FastifyRequest<{ Params: { id: string }; Body: { content: string; metadata?: Record<string, unknown> } }>, reply: FastifyReply) => {
    const { id: channel_id } = request.params;
    const { content, metadata = {} } = request.body;
    const user = request.user as { bot_id: string };

    // 检查频道是否存在
    const channel = await db.selectFrom('channels').where('id', '=', channel_id).select('id').executeTakeFirst();

    if (!channel) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Channel not found' });
    }

    const result = await db
      .insertInto('messages')
      .values({ channel_id, bot_id: user.bot_id, content, metadata })
      .returning(['id', 'channel_id', 'bot_id', 'content', 'metadata', 'created_at'])
      .executeTakeFirst();

    if (!result) {
      return reply.code(500).send({ error: 'INTERNAL_ERROR', message: 'Failed to send message' });
    }

    reply.code(201).send(result);
  });

  // 获取消息历史
  fastify.get('/:id/messages', async (request: FastifyRequest<{ Params: { id: string }; Querystring: { limit?: number; offset?: number; since?: number } }>, reply: FastifyReply) => {
    const { id: channel_id } = request.params;
    const { limit = 50, offset = 0, since } = request.query;

    let query = db
      .selectFrom('messages')
      .innerJoin('bots', 'messages.bot_id', 'bots.id')
      .select(['messages.id', 'messages.channel_id', 'messages.bot_id', 'bots.name as bot_name', 'messages.content', 'messages.metadata', 'messages.created_at'])
      .where('messages.channel_id', '=', channel_id);

    // 轮询核心：只返回 since 时间之后的消息
    if (since) {
      query = query.where('messages.created_at', '>', new Date(since));
    }

    const messages = await query.limit(limit).offset(offset).orderBy('messages.created_at', 'asc').execute();

    reply.send(messages);
  });

  // 删除频道
  fastify.delete('/:id/messages/:messageId', async (request: FastifyRequest<{ Params: { id: string; messageId: string } }>, reply: FastifyReply) => {
    const { id: channel_id, messageId } = request.params;
    const user = request.user as { bot_id: string };

    // 检查消息是否存在且属于该频道
    const message = await db
      .selectFrom('messages')
      .where('id', '=', messageId)
      .where('channel_id', '=', channel_id)
      .select('bot_id')
      .executeTakeFirst();

    if (!message) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Message not found' });
    }

    // 只有消息发送者可以删除
    if (message.bot_id !== user.bot_id) {
      return reply.code(403).send({ error: 'FORBIDDEN', message: 'Only message sender can delete' });
    }

    await db.deleteFrom('messages').where('id', '=', messageId).execute();

    reply.code(204).send();
  });
}
