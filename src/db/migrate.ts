import { db } from './index.js';

export async function migrate() {
  console.log('🔄 Running database migrations...');

  // 创建 bots 表
  await db.schema
    .createTable('bots')
    .ifNotExists()
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(db.fn.genRandomUUID()))
    .addColumn('name', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('description', 'text')
    .addColumn('bot_secret_hash', 'varchar(255)', (col) => col.notNull())
    .addColumn('public_key', 'text')
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(db.fn.now()))
    .execute();

  // 创建 channels 表
  await db.schema
    .createTable('channels')
    .ifNotExists()
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(db.fn.genRandomUUID()))
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('is_private', 'boolean', (col) => col.defaultTo(false))
    .addColumn('created_by', 'uuid', (col) => col.references('bots.id').onDelete('cascade'))
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(db.fn.now()))
    .execute();

  // 创建 messages 表
  await db.schema
    .createTable('messages')
    .ifNotExists()
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(db.fn.genRandomUUID()))
    .addColumn('channel_id', 'uuid', (col) =>
      col.references('channels.id').onDelete('cascade').notNull()
    )
    .addColumn('bot_id', 'uuid', (col) => col.references('bots.id').onDelete('cascade').notNull())
    .addColumn('content', 'text', (col) => col.notNull())
    .addColumn('metadata', 'jsonb', (col) => col.defaultTo(JSON.stringify({})))
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(db.fn.now()))
    .execute();

  // 创建索引：轮询优化
  await db.schema
    .createIndex('idx_messages_channel_created')
    .on('messages')
    .columns(['channel_id', 'created_at'])
    .execute();

  // 创建 tasks 表
  await db.schema
    .createTable('tasks')
    .ifNotExists()
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(db.fn.genRandomUUID()))
    .addColumn('channel_id', 'uuid', (col) =>
      col.references('channels.id').onDelete('cascade').notNull()
    )
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('status', 'varchar(50)', (col) => col.defaultTo('pending'))
    .addColumn('priority', 'varchar(20)', (col) => col.defaultTo('medium'))
    .addColumn('assigned_to', 'uuid[]', (col) => col.defaultTo('{}'))
    .addColumn('due_at', 'timestamptz')
    .addColumn('created_by', 'uuid', (col) =>
      col.references('bots.id').onDelete('cascade').notNull()
    )
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(db.fn.now()))
    .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(db.fn.now()))
    .execute();

  // 添加 status CHECK 约束
  try {
    await db.executeQuery({
      sql: `ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('pending', 'in_progress', 'done', 'failed'))`,
    });
  } catch (e) {
    console.log('⚠️  tasks_status_check 约束可能已存在');
  }

  // 创建任务索引
  await db.schema
    .createIndex('idx_tasks_status_assignee_updated')
    .on('tasks')
    .columns(['status', 'assigned_to', 'updated_at'])
    .execute();

  // 创建 task_updates 表
  await db.schema
    .createTable('task_updates')
    .ifNotExists()
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(db.fn.genRandomUUID()))
    .addColumn('task_id', 'uuid', (col) => col.references('tasks.id').onDelete('cascade').notNull())
    .addColumn('old_status', 'varchar(50)')
    .addColumn('new_status', 'varchar(50)', (col) => col.notNull())
    .addColumn('updated_by', 'uuid', (col) => col.references('bots.id').onDelete('cascade'))
    .addColumn('note', 'text')
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(db.fn.now()))
    .execute();

  console.log('✅ Database migrations completed!');
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
