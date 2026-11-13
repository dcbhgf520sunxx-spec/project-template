# project-template 部署说明

本文档用于部署项目管理系统基建模板。

## 1. 环境要求

- Node.js >= 22.18
- PostgreSQL 16
- Nginx
- PM2

安装 PM2：

```bash
npm install -g pm2
```

## 2. 拉取代码

```bash
cd /path/to/apps
git clone https://github.com/dcbhgf520sunxx-spec/project-template.git
cd project-template
```

## 3. 配置数据库

生产数据库使用 PostgreSQL。配置后端环境变量：

```bash
cd backend
cp .env.example .env
vi .env
```

示例：

```env
PORT=3101
DB_HOST=localhost
DB_PORT=5432
DB_USER=pms
DB_PASSWORD=你的密码
DB_NAME=project_template
JWT_SECRET=请替换为随机密钥
ALLOWED_ORIGIN=https://你的域名或IP
```

环境文件包含数据库密码和 JWT 密钥，创建后必须限制为仅部署账号可读写：

```bash
chmod 600 backend/.env
```

新环境通过当前版本 Docker Compose 初始化 PostgreSQL 后，只登记已包含在初始化脚本中的迁移基线：

```bash
cd backend
npm run db:migrate -- --baseline
```

`--baseline` 只用于当前初始化脚本新建的空白环境。已有业务数据库仍应在用户确认表结构后按顺序检查并执行增量迁移：

```bash
cd backend
npm run db:migrate -- --check
npm run db:migrate -- --apply --user-approved
```

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

## 5. 构建 React 前端

```bash
cd /path/to/apps/project-template/frontend
npm run build
```

构建产物位于：

```txt
frontend/dist
```

## 6. 配置 PM2

确认 `deploy/pm2.config.js` 中端口为 `3101`，并确认 `backend/.env` 指向 PostgreSQL。

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

登录接口（先获取图片，识别后填写验证码；每次尝试后重新获取）：

```bash
curl http://localhost:3101/api/auth/captcha

curl http://localhost:3101/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"account":"admin","password":"vv123456","captcha_id":"获取到的captcha_id","captcha_code":"图片中的字符"}'
```

浏览器访问：

```txt
https://你的域名或IP/
```

React 使用 history 路由，Nginx 必须保留 `try_files $uri $uri/ /index.html;`，否则刷新业务页面会返回 404。

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
- 数据库为 PostgreSQL，不使用 MySQL
- 不要占用 `3001`、`3002`
- 每个项目实例必须使用独立 `DB_NAME`
- `backend/.env` 不得提交
- 默认账号为 `admin / vv123456`

### 登录保护

- 密码登录必须提交图形验证码；图片有效期 2 分钟，校验一次即失效，字符不区分大小写。验证码错误不计入账号失败次数。
- 同一账号（工号和手机号共用）15 分钟内失败 5 次，锁定该账号 15 分钟。锁定到期清空旧失败；其他账号不受该锁定影响。
- IP 只做短时高频保护：密码登录每分钟 120 次、验证码获取每分钟 300 次，超限返回 429 和 Retry-After。
- 保护缓存与验证码适用于当前 PM2 单进程配置。扩展多实例前须改为共享存储和原子操作；进程重启会清空短期状态。
- 只信任本机回环代理提供的客户端 IP，与当前 Nginx 配置一致。远程代理接入须明确可信代理地址，不能恢复任意来源转发头信任。
- 首次改密窗口关闭或点击退出登录时清除本地登录并结束当前会话；改密成功之前仍禁止访问业务接口。网络异常时本地退出，服务端会话撤销可能未完成。
