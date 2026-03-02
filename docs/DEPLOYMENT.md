# 部署指南

本文档介绍如何在本地开发和生产环境部署 Synapse。

---

## 🖥️ 本地开发部署

### 方式一：Docker Compose（推荐）

**优点**：一键启动所有服务，环境隔离

```bash
# 1. 克隆仓库
git clone https://github.com/ReDawn-Studio/synapse.git
cd synapse

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件：
# DATABASE_URL=postgresql://synapse:password@db:5432/synapse
# JWT_SECRET=your-secret-key-here
# PORT=3000

# 3. 启动所有服务
docker-compose up -d

# 4. 查看日志
docker-compose logs -f

# 5. 运行数据库迁移
docker-compose exec app npm run db:migrate
```

**服务访问：**
- **API**: http://localhost:3000
- **前端 UI**: http://localhost:3001
- **数据库**: localhost:5432 (外部访问)

### 方式二：本地部署

**适用场景**：需要调试或自定义配置

```bash
# 1. 安装依赖
npm install
cd frontend && npm install && cd ..

# 2. 启动 PostgreSQL
# macOS: brew install postgresql && brew services start postgresql
# Ubuntu: sudo systemctl start postgresql

# 3. 创建数据库
createdb synapse

# 4. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 5. 运行数据库迁移
npm run db:migrate

# 6. 启动后端服务
npm run dev

# 7. 启动前端（新终端）
cd frontend
npm run dev
```

---

## 🌐 生产环境部署

### 前置要求

- 域名（可选，但推荐）
- SSL 证书（Let's Encrypt 免费）
- 反向代理（Nginx）
- 数据库备份策略
- 监控和日志系统

### Docker 生产部署

```bash
# 1. 准备生产环境配置
cat > .env.production << 'ENVEOF'
NODE_ENV=production
DATABASE_URL=postgresql://user:password@db-host:5432/synapse
JWT_SECRET=<strong-random-secret>
PORT=3000
FRONTEND_URL=https://your-domain.com
ENVEOF

# 2. 启动生产容器
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 3. 运行迁移
docker-compose exec app npm run db:migrate
```

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # 前端静态文件
    location / {
        root /var/www/synapse/frontend;
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 环境变量说明

| 变量 | 描述 | 示例 |
|------|------|------|
| `NODE_ENV` | 运行环境 | `production` |
| `DATABASE_URL` | PostgreSQL 连接字符串 | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | JWT 签名密钥（至少 32 字符） | `random-string-here` |
| `PORT` | 后端服务端口 | `3000` |
| `FRONTEND_URL` | 前端访问地址 | `https://your-domain.com` |
| `RATE_LIMIT_WINDOW_MS` | 速率限制时间窗口 | `60000` |
| `RATE_LIMIT_MAX_REQUESTS` | 速率限制最大请求数 | `100` |

---

## 🔄 更新部署

### Docker 环境

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 重建并重启容器
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 3. 运行数据库迁移（如有）
docker-compose exec app npm run db:migrate

# 4. 查看日志确认启动成功
docker-compose logs -f app
```

### 本地环境

```bash
# 1. 拉取代码
git pull origin main

# 2. 安装新依赖
npm install
cd frontend && npm install && cd ..

# 3. 运行迁移
npm run db:migrate

# 4. 重启服务
pm2 restart synapse-api
pm2 restart synapse-frontend
```

---

## 💾 数据库备份

### 手动备份

```bash
# 备份
pg_dump -h localhost -U synapse synapse > backup-$(date +%Y%m%d).sql

# 恢复
psql -h localhost -U synapse synapse < backup-20260303.sql
```

### 自动备份（Cron）

```bash
# 每天凌晨 2 点备份
0 2 * * * pg_dump -h localhost -U synapse synapse | gzip > /backups/synapse-$(date +\%Y\%m\%d).sql.gz
```

---

## 📊 监控与日志

### 日志查看

```bash
# Docker 环境
docker-compose logs -f app

# 查看错误日志
docker-compose logs app | grep ERROR
```

### 健康检查

```bash
curl http://localhost:3000/health
# 预期响应：{"status":"ok","timestamp":"..."}
```

---

## 🔒 安全建议

### 生产环境检查清单

- [ ] 使用强密码和随机 JWT_SECRET
- [ ] 启用 HTTPS (Let's Encrypt)
- [ ] 配置防火墙（仅开放 80/443）
- [ ] 数据库限制远程访问
- [ ] 定期更新依赖 (`npm audit`)
- [ ] 启用速率限制
- [ ] 配置 CORS 白名单
- [ ] 定期备份数据库
- [ ] 监控异常登录

### 防火墙配置（UFW 示例）

```bash
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 5432/tcp
sudo ufw status
```

---

## ❓ 故障排查

**Q: 容器启动失败**

```bash
docker-compose logs app
docker-compose exec app env
```

**Q: 数据库迁移失败**

```bash
docker-compose down -v
docker-compose up -d db
npm run db:migrate
```

**Q: 前端无法连接 API**

- 检查 `FRONTEND_URL` 环境变量
- 检查 Nginx 配置
- 查看浏览器控制台错误

---

## 📚 相关文档

- [CONTRIBUTING.md](CONTRIBUTING.md) - 贡献指南
- [API.md](API.md) - API 文档
- [README.md](../README.md) - 项目概览

---

*最后更新：2026-03-03*
