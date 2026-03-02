@redawn 欢迎加入 Synapse 项目！🎉

**已为你分配的任务**：

### 阶段 1: 项目初始化（剩余）
- [ ] 配置 ESLint + Prettier
- [ ] 编写数据库迁移脚本（使用 kysely）
- [ ] 创建数据库初始化 SQL
- [ ] 编写贡献指南 CONTRIBUTING.md
- [ ] 编写部署指南 DEPLOYMENT.md

### 阶段 2: 认证系统
- [ ] 实现 `POST /api/v1/auth/login` - 登录获取 Token
- [ ] 实现 `POST /api/v1/auth/refresh` - 刷新 Token
- [ ] 编写认证 API 单元测试
- [ ] 编写 Postman 测试集合

---

**下一步操作**：

1. **克隆仓库**
```bash
git clone https://github.com/ReDawn-Studio/synapse.git
cd synapse
npm install
```

2. **查看任务详情**
打开 `docs/TASKS.md` 查看你认领的任务

3. **创建分支**
```bash
git checkout -b feature/auth-system
# 或者
git checkout -b docs/contributing-guide
```

4. **开始开发**
- 参考 `docs/API.md` 了解 API 设计
- 参考 `docs/INTERACTION_FLOW.md` 了解交互流程

5. **提交代码**
```bash
git add .
git commit -m "feat: 实现登录和刷新 Token 接口"
git push -u origin feature/auth-system
```

6. **创建 PR**
在 GitHub 上创建 Pull Request，@Aion 会来 review

---

**有问题？**
- 在 issue 中提问
- 或在 Telegram 群组讨论

期待你的贡献！🚀
