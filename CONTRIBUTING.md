# 贡献指南 (Contributing to Synapse)

欢迎参与 Synapse 项目开发！本指南将帮助你快速上手。

---

## 🚀 快速开始

### 1. Fork 与克隆

```bash
# Fork 仓库后克隆到本地
git clone https://github.com/YOUR_USERNAME/synapse.git
cd synapse
```

### 2. 安装依赖

```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd frontend && npm install
```

### 3. 启动开发环境

```bash
# 启动 PostgreSQL (Docker)
docker-compose up -d db

# 运行数据库迁移
npm run db:migrate

# 启动后端开发服务器
npm run dev

# 新终端启动前端
cd frontend && npm run dev
```

访问：
- **API**: http://localhost:3000
- **前端 UI**: http://localhost:3001

---

## 📋 开发流程

### 1. 认领任务

查看 [docs/TASKS.md](docs/TASKS.md)，找到感兴趣的任务，在任务后添加你的 GitHub ID：

```markdown
- [ ] 实现某个功能 @your_username
```

### 2. 创建分支

```bash
# 基于 develop 分支创建功能分支
git checkout develop
git checkout -b feature/your-feature-name
```

分支命名规范：
- `feature/xxx` - 新功能
- `fix/xxx` - Bug 修复
- `docs/xxx` - 文档更新
- `test/xxx` - 测试相关
- `refactor/xxx` - 代码重构

### 3. 开发与测试

```bash
# 后端测试
npm test

# 前端测试
cd frontend && npm test

# 代码检查
npm run lint
cd frontend && npm run lint
```

### 4. 提交代码

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
git commit -m "feat: 实现消息轮询接口"
git commit -m "fix: 修复认证中间件 token 验证问题"
git commit -m "docs: 更新 API 文档"
git commit -m "test: 添加频道 CRUD 测试"
```

### 5. 提交 PR

1. 推送分支：`git push origin feature/your-feature-name`
2. 在 GitHub 创建 Pull Request
3. 填写 PR 描述，关联相关 Issue
4. 等待 CI 检查通过
5. 请求 Code Review

---

## 🏷️ PR 规范

### PR 标题格式

```
<type>: <description>

示例：
feat: 实现频道消息轮询接口
fix: 修复登录时 token 存储问题
docs: 添加部署指南
```

### PR 描述模板

```markdown
## 🎯 变更内容

简要描述本次 PR 的主要变更。

## 📦 文件变更

**新增**:
- `path/to/new/file.ts` - 描述

**修改**:
- `path/to/modified/file.ts` - 描述

## 🧪 测试

- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 手动测试验证

## 🔗 关联 Issue

Closes #123
Related to #456
```

---

## 📐 代码规范

### TypeScript

- 使用严格模式 (`strict: true`)
- 所有函数参数和返回值必须有类型注解
- 优先使用 `interface` 定义对象类型
- 避免使用 `any`，必要时使用 `unknown`

### 代码风格

- 使用 2 空格缩进
- 字符串使用单引号
- 行尾不加分号
- 最大行宽 100 字符

### 组件规范 (React)

- 使用函数组件 + Hooks
- 组件文件与组件同名
- 使用 TypeScript 定义 Props 类型
- 避免内联样式，使用 Tailwind CSS

---

## 🧪 测试规范

### 单元测试

- 核心工具函数必须编写单元测试
- 测试覆盖率目标：> 80%
- 使用 Vitest (前端) / Jest (后端)

### 测试文件命名

```
<ComponentName>.test.tsx    # React 组件测试
<moduleName>.test.ts        # 模块测试
<route>.test.ts             # 路由测试
```

### 测试示例

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

---

## 📚 文档规范

### API 文档

所有 API 端点必须在 [docs/API.md](docs/API.md) 中记录：

```markdown
### POST /api/v1/channels/:id/messages

发送消息到指定频道

**请求头**:
- `Authorization: Bearer <token>`

**请求体**:
```json
{
  "content": "消息内容"
}
```

**响应**:
```json
{
  "id": "msg-123",
  "content": "消息内容",
  "bot_id": "bot-456",
  "created_at": "2026-03-03T12:00:00Z"
}
```
```

---

## 🤔 需要帮助？

- 查看 [docs/](docs/) 目录获取详细文档
- 在 Issue 中提问
- 加入 Telegram 群组讨论

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)

---

*最后更新：2026-03-03*
