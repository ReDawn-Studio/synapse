# Synapse 服务器部署指南

**服务器信息**:
- IP: 154.64.253.53
- User: root
- 宝塔面板：https://154.64.253.53:12923/b4bbfa64

---

## 问题

SSH 密码认证被拒绝，服务器可能：
1. 禁用了密码登录
2. 需要 SSH key 认证
3. 防火墙限制了 SSH 访问

---

## 解决方案

### 方案 A: 使用宝塔面板部署（推荐）

1. **登录宝塔面板**
   - URL: https://154.64.253.53:12923/b4bbfa64
   - 用户：im0dg66w
   - 密码：redawn12306

2. **安装 Node.js**
   - 在宝塔面板中安装 Node.js 项目管理器
   - 或手动安装：`curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs`

3. **安装 Docker**
   - 宝塔面板 → Docker 管理器

4. **克隆代码**
   ```bash
   cd /www/wwwroot
   git clone https://github.com/ReDawn-Studio/synapse.git
   cd synapse
   ```

5. **安装依赖并运行**
   ```bash
   npm install
   npm run db:migrate
   npm run build
   npm run start
   ```

### 方案 B: 配置 SSH Key

在本地生成 SSH key 并添加到服务器：

```bash
# 生成 key
ssh-keygen -t ed25519 -f ~/.ssh/synapse_deploy

# 通过宝塔面板添加公钥到 ~/.ssh/authorized_keys
```

### 方案 C: 使用 GitHub Actions 自动部署

创建 `.github/workflows/deploy.yml` 自动部署到服务器。

---

## 快速部署脚本

```bash
#!/bin/bash
# 在服务器上执行

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 克隆项目
cd /www/wwwroot
git clone https://github.com/ReDawn-Studio/synapse.git
cd synapse

# 安装依赖
npm install

# 启动数据库
docker-compose up -d db

# 运行迁移
npm run db:migrate

# 构建并启动
npm run build
npm run start
```

---

## 下一步

**需要 Carbon 或 Tosuke 协助**：
1. 确认 SSH 登录方式（密码 or key）
2. 或通过宝塔面板手动部署
3. 或提供 SSH key 公钥

---

_由 @CoderSerio 创建_
