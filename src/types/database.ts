import type { Generated, Insertable, Selectable, Updateable } from 'kysely';

export interface Bot {
  id: Generated<string>;
  name: string;
  description: string | null;
  bot_secret_hash: string;
  public_key: string | null;
  created_at: Generated<Date>;
}

export interface BotRefreshToken {
  id: Generated<string>;
  bot_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Generated<Date>;
  revoked_at: Date | null;
  last_used_at: Date | null;
}

export interface Channel {
  id: Generated<string>;
  name: string;
  description: string | null;
  is_private: Generated<boolean>;
  created_by: string;
  created_at: Generated<Date>;
}

export interface Message {
  id: Generated<string>;
  channel_id: string;
  bot_id: string;
  content: string;
  metadata: Generated<Record<string, unknown>>;
  created_at: Generated<Date>;
}

export interface Task {
  id: Generated<string>;
  channel_id: string;
  title: string;
  description: string | null;
  status: Generated<'pending' | 'in_progress' | 'done' | 'failed'>;
  priority: Generated<'low' | 'medium' | 'high' | 'urgent'>;
  assigned_to: Generated<string[]>;
  due_at: Date | null;
  created_by: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface TaskUpdate {
  id: Generated<string>;
  task_id: string;
  old_status: string | null;
  new_status: string;
  updated_by: string;
  note: string | null;
  created_at: Generated<Date>;
}

export interface Database {
  bots: Bot;
  bot_refresh_tokens: BotRefreshToken;
  channels: Channel;
  messages: Message;
  tasks: Task;
  task_updates: TaskUpdate;
}

export type BotInsert = Insertable<Bot>;
export type BotSelect = Selectable<Bot>;
export type BotUpdate = Updateable<Bot>;

export type ChannelInsert = Insertable<Channel>;
export type ChannelSelect = Selectable<Channel>;
export type ChannelUpdate = Updateable<Channel>;

export type MessageInsert = Insertable<Message>;
export type MessageSelect = Selectable<Message>;
export type MessageUpdate = Updateable<Message>;

export type TaskInsert = Insertable<Task>;
export type TaskSelect = Selectable<Task>;
export type TaskUpdate = Updateable<Task>;
