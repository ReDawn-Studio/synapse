import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { db } from '../db/index.js';

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(32),
    description: z.string().optional(),
    public_key: z.string().optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    name: z.string(),
    bot_secret: z.string(),
  }),
});

const refreshSchema = z.object({
  body: z.object({
    refresh_token: z.string(),
  }),
});

export default async function authRoutes(fastify: FastifyInstance) {
  // Bot 注册
  fastify.post('/register', async (request: FastifyRequest<{ Body: { name: string; description?: string; public_key?: string } }>, reply: FastifyReply) => {
    const { name, description, public_key } = request.body;

    // 检查名称是否已存在
    const existing = await db.selectFrom('bots').where('name', '=', name).select('id').executeTakeFirst();
    if (existing) {
      return reply.code(400).send({ error: 'BAD_REQUEST', message: 'Bot name already exists' });
    }

    // 生成 bot_secret
    const botSecret = `synapse_sk_live_${Buffer.from(crypto.randomUUID()).toString('base64').slice(0, 32)}`;
    const botSecretHash = await bcrypt.hash(botSecret, 10);

    // 创建 Bot
    const result = await db
      .insertInto('bots')
      .values({ name, description: description || null, public_key: public_key || null, bot_secret_hash: botSecretHash })
      .returning(['id', 'name', 'created_at'])
      .executeTakeFirst();

    if (!result) {
      return reply.code(500).send({ error: 'INTERNAL_ERROR', message: 'Failed to create bot' });
    }

    // 仅显示一次 bot_secret
    reply.send({
      bot_id: result.id,
      name: result.name,
      bot_secret: botSecret,
      created_at: result.created_at,
      warning: '请保存 bot_secret，这是唯一一次显示',
    });
  });

  // 登录获取 Token
  fastify.post('/login', async (request: FastifyRequest<{ Body: { name: string; bot_secret: string } }>, reply: FastifyReply) => {
    const { name, bot_secret } = request.body;

    // 查找 Bot
    const bot = await db.selectFrom('bots').where('name', '=', name).selectAll().executeTakeFirst();
    if (!bot) {
      return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Invalid bot name or secret' });
    }

    // 验证 bot_secret
    const valid = await bcrypt.compare(bot_secret, bot.bot_secret_hash);
    if (!valid) {
      return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Invalid bot name or secret' });
    }

    // 生成 JWT
    const accessToken = fastify.jwt.sign({ bot_id: bot.id, bot_name: bot.name });
    const refreshToken = `synapse_rt_${Buffer.from(crypto.randomUUID()).toString('base64').slice(0, 32)}`;

    // TODO: 存储 refresh_token 以便后续验证和撤销

    reply.send({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 900, // 15 分钟
      refresh_expires_in: 2592000, // 30 天
    });
  });

  // 刷新 Token
  fastify.post('/refresh', async (request: FastifyRequest<{ Body: { refresh_token: string } }>, reply: FastifyReply) => {
    const { refresh_token } = request.body;

    // TODO: 验证 refresh_token 是否有效且未过期

    // 生成新的 access_token
    // 简化实现：实际应从 refresh_token 中提取 bot_id
    const accessToken = fastify.jwt.sign({ bot_id: 'unknown', bot_name: 'unknown' });
    const newRefreshToken = `synapse_rt_${Buffer.from(crypto.randomUUID()).toString('base64').slice(0, 32)}`;

    reply.send({
      access_token: accessToken,
      refresh_token: newRefreshToken,
      token_type: 'Bearer',
      expires_in: 900,
    });
  });
}
