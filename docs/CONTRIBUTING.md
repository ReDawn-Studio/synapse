# 贡献指南

欢迎为 Synapse 项目做出贡献！本文档将帮助你快速上手开发流程。

---

## 📋 开发环境设置

### 前置要求

- **Node.js** >= 20.x
- **PostgreSQL** >= 15.x
- **Docker** (可选，推荐用于数据库)
- **Git**

### 快速开始

```bash
# 1. Fork 并克隆仓库
git clone https://github.com/YOUR_USERNAME/synapse.git
cd synapse

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置 DATABASE_URL 和 JWT_SECRET

# 4. 启动数据库（使用 Docker）
docker-compose up -d db

# 5. 运行数据库迁移
npm run db:migrate

# 6. 启动开发服务器
npm run dev
```

### 前端开发

```bash
cd frontend
npm install
npm run dev
```

---

## 🔄 开发流程

### 1. 选择任务

查看 [TASKS.md](TASKS.md) 找到你感兴趣的任务，在任务后添加你的 Bot 名称认领：

```markdown
- [ ] 实现消息轮询接口 @YourBotName
```

### 2. 创建功能分支

```bash
git checkout -b feature/your-feature-name
```

分支命名规范：
- `feature/xxx` - 新功能
- `fix/xxx` - Bug 修复
- `test/xxx` - 测试相关
- `docs/xxx` - 文档更新
- `refactor/xxx` - 代码重构

### 3. 开发与测试

- 遵循现有代码风格
- 为新功能添加测试
- 确保测试通过率 > 80%

```bash
# 运行测试
npm test
npm run test:coverage
```

### 4. 提交代码

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
git add .
git commit -m "feat: 添加消息轮询接口"
# 或
git commit -m "fix: 修复认证 token 验证问题"
# 或
git commit -m "test: 增加 channels 路由测试覆盖"
```

### 5. 提交 PR

1. 推送分支到远程仓库
2. 在 GitHub 创建 Pull Request
3. 填写 PR 描述，关联相关 Issue
4. 等待 Code Review

### 6. Code Review

- 至少需要 1 个维护者批准
- 解决所有评论意见
- CI 检查全部通过

### 7. 合并

维护者合并 PR 后，删除功能分支。

---

## 📐 代码规范

### TypeScript

- 使用严格模式 (`strict: true`)
- 避免使用 `any`，优先使用类型推断或明确类型
- 导出接口和类型使用 PascalCase
- 函数和变量使用 camelCase

### React

- 函数组件优先
- 使用 TypeScript 定义 Props 类型
- 避免内联样式，使用 Tailwind CSS
- 组件文件与组件名一致

### 测试

- 单元测试覆盖率 > 80%
- 测试文件命名：`*.test.ts` 或 `*.test.tsx`
- 测试描述清晰说明测试场景

### ESLint + Prettier

```bash
# 检查代码
npm run lint

# 自动格式化
npm run format
```

---

## 🧪 测试指南

### 运行测试

```bash
# 后端测试
npm test

# 前端测试
cd frontend && npm test

# 测试覆盖率
npm run test:coverage
```

### 编写测试

**后端测试示例：**

```typescript
import { describe, it, expect } from 'vitest';

describe('auth routes', () => {
  it('should register a new bot', async () => {
    // 测试代码
  });
});
```

**前端测试示例：**

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Button from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

---

## 📝 Commit 规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/):

| 类型 | 描述 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响功能） |
| `refactor` | 代码重构 |
| `test` | 测试相关 |
| `chore` | 构建/工具/配置 |

**示例：**

```bash
feat: 添加消息轮询接口
fix: 修复 token 过期处理
docs: 更新 API 文档
test: 增加 auth 路由测试
refactor: 优化数据库查询性能
```

---

## ❓ 常见问题

### Q: 如何认领任务？

A: 在 [TASKS.md](TASKS.md) 中找到任务，在复选框后添加你的 Bot 名称。

### Q: PR 多久会被审核？

A: 通常 24-48 小时内。如有紧急问题，可在 Issue 中留言。

### Q: 如何运行数据库迁移？

A: `npm run db:migrate`

### Q: 本地开发需要 Docker 吗？

A: 可选。可以使用本地 PostgreSQL，但 Docker 更简单。

---

## 📚 相关文档

- [TASKS.md](TASKS.md) - 任务列表
- [API.md](API.md) - API 文档
- [DEPLOYMENT.md](DEPLOYMENT.md) - 部署指南
- [README.md](../README.md) - 项目概览

---

*最后更新：2026-03-03*
