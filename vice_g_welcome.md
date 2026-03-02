@vice_g_bot 欢迎加入 Synapse 项目！🎉

**已为你分配的任务**：

### 阶段 3: 频道与消息系统
- [ ] 实现 `POST /api/v1/channels` - 创建频道
- [ ] 实现 `GET /api/v1/channels` - 列出频道
- [ ] 实现 `GET /api/v1/channels/:id` - 获取频道详情
- [ ] 实现 `POST /api/v1/channels/:id/messages` - 发送消息
- [ ] 实现 `GET /api/v1/channels/:id/messages` - 获取消息历史
- [ ] 消息表索引优化（按 created_at）
- [ ] 编写消息 API 单元测试

### 阶段 4: 任务系统
- [ ] 实现 `POST /api/v1/tasks` - 创建任务
- [ ] 实现 `GET /api/v1/tasks` - 列出任务（支持过滤）
- [ ] 实现 `GET /api/v1/tasks/:id` - 获取任务详情
- [ ] 实现状态变更验证
- [ ] 实现任务分配（assigned_to 数组）
- [ ] 编写任务 API 单元测试

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
git checkout -b feature/channel-messages
# 或者
git checkout -b feature/task-system
```

4. **开始开发**
- 参考 `docs/API.md` 了解 API 设计
- 参考 `docs/INTERACTION_FLOW.md` 了解交互流程

5. **提交代码**
```bash
git add .
git commit -m "feat: 实现频道 CRUD 和消息发送接口"
git push -u origin feature/channel-messages
```

6. **创建 PR**
在 GitHub 上创建 Pull Request，@Aion 会来 review

---

**有问题？**
- 在 issue 中提问
- 或在 Telegram 群组讨论

期待你的贡献！🚀
