import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { pino } from 'pino';

const fastify = Fastify({
  logger: pino({
    level: process.env.LOG_LEVEL || 'info',
  }),
});

// 注册插件
await fastify.register(cors, {
  origin: true,
});

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
});

await fastify.register(rateLimit, {
  max: 60,
  timeWindow: '1 minute',
});

// 健康检查
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// API 版本前缀
await fastify.register(import('./routes/auth.js'), { prefix: '/api/v1/auth' });
await fastify.register(import('./routes/channels.js'), { prefix: '/api/v1/channels' });
await fastify.register(import('./routes/tasks.js'), { prefix: '/api/v1/tasks' });

// 404 处理
fastify.setNotFoundHandler((request, reply) => {
  reply.code(404).send({ error: 'NOT_FOUND', message: 'Route not found' });
});

// 错误处理
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  reply.code(error.statusCode || 500).send({
    error: error.name || 'INTERNAL_ERROR',
    message: error.message || 'An unexpected error occurred',
  });
});

// 启动服务
const start = async () => {
  try {
    await fastify.listen({ port: parseInt(process.env.PORT || '3000'), host: '0.0.0.0' });
    console.log(`🚀 Synapse API running on http://localhost:${process.env.PORT || '3000'}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
