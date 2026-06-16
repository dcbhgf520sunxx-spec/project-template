# 项目管理系统 - 正式发布部署指南

## 环境要求

- Node.js >= 18
- MySQL >= 5.7
- Nginx
- PM2（`npm install -g pm2`）

---

## 部署步骤

### 1. 拉取代码

```bash
cd /path/to/deploy
git clone https://gitee.com/znjs_0/project-manage-system.git
cd project-manage-system
```

### 2. 安装后端依赖

```bash
cd backend
npm install --production
```

### 3. 配置数据库连接

```bash
cp .env.example .env
vi .env
```

编辑 `.env` 填入正式数据库信息：
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=pms
DB_PASSWORD=你的密码
DB_NAME=project_manage
JWT_SECRET=你的密钥
PORT=3001
```

### 4. 初始化数据库

```bash
# 确保 MySQL 已启动，创建数据库
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS project_manage CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 后端启动时会自动创建所有表并初始化种子数据（admin 用户、角色、菜单）
# 无需手动执行 SQL
```

> 首次启动后端即可自动完成建表和种子数据初始化。

### 5. 构建前端

```bash
cd ../frontend
npm install --production
npm run build
```

构建产物在 `frontend/dist/`。

### 6. 配置 Nginx

```bash
# 复制配置文件
sudo cp deploy/nginx.conf /etc/nginx/conf.d/pms.conf

# 编辑配置，修改 server_name 和 root 路径
sudo vi /etc/nginx/conf.d/pms.conf

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo nginx -s reload
```

### 7. 启动后端（PM2）

```bash
cd backend
mkdir -p logs

# 首次启动
pm2 start deploy/pm2.config.js

# 设置开机自启
pm2 startup
pm2 save
```

### 8. 验证

```bash
# 查看进程状态
pm2 status

# 查看日志
pm2 logs pms-backend

# 测试 API
curl http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"account":"admin","password":"vv123456"}'
```

---

## 常用命令

```bash
# 查看后端状态
pm2 status

# 查看日志
pm2 logs pms-backend --lines 100

# 重启后端
pm2 restart pms-backend

# 停止后端
pm2 stop pms-backend

# 重载 Nginx
sudo nginx -s reload
```

## 注意事项

1. **数据库**：正式发布前确认 `backend/.env` 中的数据库连接正确
2. **首次登录**：admin 默认密码 `vv123456`，新建用户首次登录强制改密
3. **AI 问数**：确认 SSO 服务地址配置正确（`SSO_PLATFORM_URL` 环境变量）
4. **定时任务**：逾期刷新任务已内置，每天 00:30 自动执行
5. **防火墙**：开放 80 端口（Nginx），3001 端口无需对外开放（仅 Nginx 代理）
6. **HR 同步**：如需 HR 员工同步功能，配置 `HR_API_URL` 环境变量
