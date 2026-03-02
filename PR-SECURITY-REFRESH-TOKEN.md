# PR: 🔒 安全增强 - Refresh Token 存储与验证

## 📋 变更概述

实现安全的 Refresh Token 管理机制，解决代码审查中发现的安全 TODO。

## 🔒 安全问题修复

### 修复前
- ❌ Refresh token 生成后未存储
- ❌ 刷新时未验证 token 有效性
- ❌ 无法撤销 token（登出/安全审计）
- ❌ Token 可被无限重用

### 修复后
- ✅ Refresh token 哈希存储于数据库
- ✅ 刷新时验证：token 存在 + 未过期 + 未撤销
- ✅ 支持 token 撤销（登出功能）
- ✅ 记录 last_used_at 用于异常检测
- ✅ 30 天过期时间

## 📁 文件变更

### 新增文件
- `src/db/migrations/002-refresh-tokens.ts` - 数据库迁移
- `src/routes/__tests__/auth-refresh.test.ts` - 完整测试覆盖

### 修改文件
- `src/routes/auth.ts` - 实现安全 token 管理

## 🗄️ 数据库迁移

新增 `bot_refresh_tokens` 表：

```sql
CREATE TABLE bot_refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ
);

CREATE INDEX idx_refresh_tokens_bot ON bot_refresh_tokens(bot_id);
CREATE INDEX idx_refresh_tokens_hash ON bot_refresh_tokens(token_hash);
```

## 🔑 核心功能

### 1. 登录时存储 Token
```typescript
// 生成 token 并存储哈希
const refreshToken = `synapse_rt_${...}`;
const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
await db.insertInto('bot_refresh_tokens').values({...}).execute();
```

### 2. 刷新时验证 Token
- 验证 token 格式 (`synapse_rt_*`)
- 遍历比对哈希（bcrypt）
- 检查过期时间
- 检查撤销状态
- 更新 last_used_at

### 3. 登出撤销 Token
```typescript
POST /api/v1/auth/logout
{ "refresh_token": "..." }
```

### 4. Token 轮换
每次刷新生成新 token，撤销旧 token，防止重放攻击。

## 🧪 测试覆盖

测试文件：`src/routes/__tests__/auth-refresh.test.ts`

**测试场景：**
- ✅ 登录成功并存储 token
- ✅ 登录失败（错误凭证）
- ✅ 刷新成功（有效 token）
- ✅ 刷新失败（无效格式）
- ✅ 刷新失败（不存在的 token）
- ✅ 登出成功并撤销 token
- ✅ 登出后 token 无法使用
- ✅ 登出对无效 token 返回成功（防枚举）

## 📊 验收标准

- [x] 数据库迁移脚本完成
- [x] 登录时存储 refresh token
- [x] 刷新时验证 token 有效性
- [x] 实现登出 endpoint
- [x] 测试覆盖率 > 90%
- [x] 所有测试通过

## 🚀 部署步骤

1. 运行数据库迁移：
   ```bash
   npm run db:migrate
   ```

2. 重启后端服务

3. 验证功能：
   ```bash
   npm test -- auth-refresh
   ```

## 🔐 安全影响

**正面影响：**
- 防止 token 无限重用
- 支持主动撤销（登出/安全事件）
- 可审计 token 使用记录
- 符合 OAuth 2.0 最佳实践

**兼容性：**
- 现有 token 不受影响（迁移后新生成的 token 受保护）
- 建议所有用户在下次登录时获得新 token

## 📝 相关 Issue

- Closes #10 - [P0.5] 🔒 Refresh Token 安全实现

---

**优先级：** P0.5（安全相关，MVP 后第一优先级）
**测试状态：** ✅ 全部通过
**代码审查：** 待审查
