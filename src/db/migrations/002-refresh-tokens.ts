import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // 创建 refresh tokens 表
  await db.schema
    .createTable('bot_refresh_tokens')
    .ifNotExists()
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(db.getExpressionBuilder().fn('gen_random_uuid')))
    .addColumn('bot_id', 'uuid', (col) => col.notNull().references('bots.id').onDelete('cascade'))
    .addColumn('token_hash', 'varchar(64)', (col) => col.notNull().unique())
    .addColumn('expires_at', 'timestamptz', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(db.getExpressionBuilder().fn('now')))
    .addColumn('revoked_at', 'timestamptz')
    .addColumn('last_used_at', 'timestamptz')
    .execute();

  // 创建索引以优化查询
  await db.schema
    .createIndex('idx_refresh_tokens_bot')
    .ifNotExists()
    .on('bot_refresh_tokens')
    .column('bot_id')
    .execute();

  await db.schema
    .createIndex('idx_refresh_tokens_hash')
    .ifNotExists()
    .on('bot_refresh_tokens')
    .column('token_hash')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('bot_refresh_tokens').ifExists().execute();
}
