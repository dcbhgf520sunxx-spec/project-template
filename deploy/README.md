# project-template 部署说明

本文档用于部署项目管理系统基建模板。

## 1. 环境要求

- Node.js >= 18
- MySQL >= 5.7
- Nginx
- PM2

安装 PM2：

```bash
npm install -g pm2
```

## 2. 拉取代码

```bash
cd /path/to/apps
git clone https://gitee.com/znjs_0/project-template.git
cd project-template
```

## 3. 配置数据库

创建独立数据库：

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS project_template CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

配置后端环境变量：

```bash
cd backend
cp .env.example .env
vi .env
```

示例：

```env
PORT=3101
DB_HOST=localhost
DB_PORT=3306
DB_USER=pms
DB_PASSWORD=你的密码
DB_NAME=project_template
JWT_SECRET=请替换为随机密钥
ALLOWED_ORIGIN=http://你的域名或IP
```

后端首次启动时会自动建表并初始化最小种子数据。

## 4. 安装依赖

后端：

```bash
cd /path/to/apps/project-template/backend
npm ci --omit=dev
```

前端：

```bash
cd /path/to/apps/project-template/frontend
npm ci
```

## 5. 构建前端

```bash
cd /path/to/apps/project-template/frontend
npm run build
```

构建产物位于：

```txt
frontend/dist
```

## 6. 配置 PM2

确认 `deploy/pm2.config.js` 中端口为 `3101`。

启动后端：

```bash
cd /path/to/apps/project-template
mkdir -p backend/logs
pm2 start deploy/pm2.config.js
pm2 save
```

查看状态：

```bash
pm2 status
pm2 logs project-template-backend --lines 100
```

## 7. 配置 Nginx

复制配置：

```bash
sudo cp deploy/nginx.conf /etc/nginx/conf.d/project-template.conf
```

编辑配置：

```bash
sudo vi /etc/nginx/conf.d/project-template.conf
```

必须修改：

- `server_name`
- `root`

检查并重载：

```bash
sudo nginx -t
sudo nginx -s reload
```

## 8. 验证

健康检查：

```bash
curl http://localhost:3101/api/health
```

登录接口：

```bash
curl http://localhost:3101/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"account":"admin","password":"vv123456"}'
```

浏览器访问：

```txt
http://你的域名或IP/
```

## 9. 常用命令

```bash
pm2 status
pm2 restart project-template-backend
pm2 logs project-template-backend --lines 100
sudo nginx -t
sudo nginx -s reload
```

## 10. 注意事项

- 后端端口使用 `3101`
- 前端生产访问由 Nginx 提供
- 不要占用 `3001`、`3002`
- 每个项目实例必须使用独立 `DB_NAME`
- `backend/.env` 不得提交
- 默认账号为 `admin / vv123456`
