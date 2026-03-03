import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/index.js';

export default async function tasksRoutes(fastify: FastifyInstance) {
  // 认证中间件
  fastify.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Invalid or missing token' });
    }
  });

  // 创建任务
  fastify.post(
    '/',
    async (
      request: FastifyRequest<{
        Body: {
          channel_id: string;
          title: string;
          description?: string;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          assigned_to?: string[];
          due_at?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      const {
        channel_id,
        title,
        description,
        priority = 'medium',
        assigned_to = [],
        due_at,
      } = request.body;
      const user = request.user as { bot_id: string };

      const result = await db
        .insertInto('tasks')
        .values({
          channel_id,
          title,
          description: description || null,
          priority,
          assigned_to,
          due_at: due_at ? new Date(due_at) : null,
          created_by: user.bot_id,
        })
        .returning([
          'id',
          'channel_id',
          'title',
          'description',
          'status',
          'priority',
          'assigned_to',
          'due_at',
          'created_by',
          'created_at',
          'updated_at',
        ])
        .executeTakeFirst();

      if (!result) {
        return reply.code(500).send({ error: 'INTERNAL_ERROR', message: 'Failed to create task' });
      }

      reply.code(201).send(result);
    }
  );

  // 列出任务
  fastify.get(
    '/',
    async (
      request: FastifyRequest<{
        Querystring: {
          channel_id?: string;
          status?: 'pending' | 'in_progress' | 'done' | 'failed';
          assigned_to?: string;
          limit?: number;
          offset?: number;
        };
      }>,
      reply: FastifyReply
    ) => {
      const { channel_id, status, /* assigned_to, */ limit = 50, offset = 0 } = request.query;

      let query = db.selectFrom('tasks').selectAll();

      if (channel_id) {
        query = query.where('channel_id', '=', channel_id);
      }

      if (status) {
        query = query.where('status', '=', status);
      }

      // TODO: Fix assigned_to filter - requires proper PostgreSQL array handling
      // if (assigned_to) {
      //   query = query.where('assigned_to', 'ilike', '%' + assigned_to + '%');
      // }

      const tasks = await query.limit(limit).offset(offset).orderBy('updated_at', 'desc').execute();

      reply.send(tasks);
    }
  );

  // 获取任务详情
  fastify.get(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      const task = await db.selectFrom('tasks').where('id', '=', id).selectAll().executeTakeFirst();

      if (!task) {
        return reply.code(404).send({ error: 'NOT_FOUND', message: 'Task not found' });
      }

      reply.send(task);
    }
  );

  // 更新任务状态
  fastify.patch(
    '/:id',
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: { status?: 'pending' | 'in_progress' | 'done' | 'failed'; description?: string };
      }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const { status, description } = request.body;
      const user = request.user as { bot_id: string };

      // 获取当前任务状态
      const currentTask = await db
        .selectFrom('tasks')
        .where('id', '=', id)
        .select(['status', 'description'])
        .executeTakeFirst();

      if (!currentTask) {
        return reply.code(404).send({ error: 'NOT_FOUND', message: 'Task not found' });
      }

      // 更新任务
      const updateData: Record<string, unknown> = {};
      if (status) updateData.status = status;
      if (description) updateData.description = description;
      updateData.updated_at = new Date();

      const result = await db
        .updateTable('tasks')
        .set(updateData)
        .where('id', '=', id)
        .returning(['id', 'status', 'updated_at'])
        .executeTakeFirst();

      // 记录状态变更
      if (status && status !== currentTask.status) {
        await db
          .insertInto('task_updates')
          .values({
            task_id: id,
            old_status: currentTask.status,
            new_status: status,
            updated_by: user.bot_id,
            note: null,
          })
          .execute();
      }

      if (!result) {
        return reply.code(500).send({ error: 'INTERNAL_ERROR', message: 'Failed to update task' });
      }

      reply.send(result);
    }
  );

  // 删除任务
  fastify.delete(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const user = request.user as { bot_id: string };

      // 检查是否是创建者
      const task = await db
        .selectFrom('tasks')
        .where('id', '=', id)
        .select('created_by')
        .executeTakeFirst();

      if (!task) {
        return reply.code(404).send({ error: 'NOT_FOUND', message: 'Task not found' });
      }

      if (task.created_by !== user.bot_id) {
        return reply
          .code(403)
          .send({ error: 'FORBIDDEN', message: 'Only task creator can delete' });
      }

      await db.deleteFrom('tasks').where('id', '=', id).execute();

      reply.code(204).send();
    }
  );
}
