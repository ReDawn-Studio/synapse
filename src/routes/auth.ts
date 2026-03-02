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

const logoutSchema = z.object({
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

    // 存储 refresh_token hash（30 天过期）
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 天

    await db
      .insertInto('bot_refresh_tokens')
      .values({
        bot_id: bot.id,
        token_hash: refreshTokenHash,
        expires_at: expiresAt,
      })
      .execute();

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

    // 验证 refresh_token 格式
    if (!refresh_token.startsWith('synapse_rt_')) {
      return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Invalid refresh token format' });
    }

    // 查找 token 记录
    const tokens = await db
      .selectFrom('bot_refresh_tokens')
      .selectAll()
      .execute();

    // 验证 token 是否有效（需要遍历比较 hash）
    let validToken: any = null;
    let tokenBotId: string | null = null;

    for (const tokenRecord of tokens) {
      const isValid = await bcrypt.compare(refresh_token, tokenRecord.token_hash);
      if (isValid) {
        // 检查是否过期
        if (new Date(tokenRecord.expires_at) < new Date()) {
          return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Refresh token expired' });
        }

        // 检查是否已撤销
        if (tokenRecord.revoked_at !== null) {
          return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Refresh token revoked' });
        }

        validToken = tokenRecord;
        tokenBotId = tokenRecord.bot_id;
        break;
      }
    }

    if (!validToken || !tokenBotId) {
      return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Invalid refresh token' });
    }

    // 获取 bot 信息
    const bot = await db
      .selectFrom('bots')
      .where('id', '=', tokenBotId)
      .select(['id', 'name'])
      .executeTakeFirst();

    if (!bot) {
      return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Bot not found' });
    }

    // 生成新的 access_token
    const accessToken = fastify.jwt.sign({ bot_id: bot.id, bot_name: bot.name });
    const newRefreshToken = `synapse_rt_${Buffer.from(crypto.randomUUID()).toString('base64').slice(0, 32)}`;

    // 存储新的 refresh_token
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 天

    // 撤销旧 token
    await db
      .updateTable('bot_refresh_tokens')
      .where('id', '=', validToken.id)
      .set({ revoked_at: new Date() })
      .execute();

    // 插入新 token
    await db
      .insertInto('bot_refresh_tokens')
      .values({
        bot_id: bot.id,
        token_hash: newRefreshTokenHash,
        expires_at: newExpiresAt,
      })
      .execute();

    // 更新 last_used_at
    await db
      .updateTable('bot_refresh_tokens')
      .where('id', '=', validToken.id)
      .set({ last_used_at: new Date() })
      .execute();

    reply.send({
      access_token: accessToken,
      refresh_token: newRefreshToken,
      token_type: 'Bearer',
      expires_in: 900,
    });
  });

  // 登出（撤销 token）
  fastify.post('/logout', async (request: FastifyRequest<{ Body: { refresh_token: string } }>, reply: FastifyReply) => {
    const { refresh_token } = request.body;

    // 查找并撤销 token
    const tokens = await db
      .selectFrom('bot_refresh_tokens')
      .selectAll()
      .execute();

    for (const tokenRecord of tokens) {
      const isValid = await bcrypt.compare(refresh_token, tokenRecord.token_hash);
      if (isValid) {
        await db
          .updateTable('bot_refresh_tokens')
          .where('id', '=', tokenRecord.id)
          .set({ revoked_at: new Date() })
          .execute();

        return reply.send({ success: true, message: 'Logged out successfully' });
      }
    }

    // 即使 token 无效也返回成功（防止枚举）
    reply.send({ success: true, message: 'Logged out successfully' });
  });
}
