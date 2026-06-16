# project-template

项目管理系统基建模板，用于 AI Coding 场景下快速复制、扩展后台系统基础能力。

## 项目定位

本项目只沉淀基建能力：

- 登录认证
- 用户管理
- 角色管理
- 菜单权限
- 基础档案
- 运维工单
- 操作日志
- AI Coding 规约与复用资产

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | Vue 3 + Vite + Element Plus |
| 后端 | Node.js + Express + mysql2 + JWT |
| 数据库 | MySQL |
| 部署 | Nginx + PM2 |

## 本地端口

| 服务 | 端口 |
| --- | --- |
| 后端 | `3101` |
| 前端 | `3102` |
| MySQL | `3306` |

不要占用 `3001`、`3002`，这两个端口预留给其他项目。

## 默认账号

```txt
账号：admin
密码：vv123456
```

## 本地启动

后端：

```bash
cd backend
cp .env.example .env
npm install
npm start
```

前端：

```bash
cd frontend
npm install
npm run dev
```

健康检查：

```bash
curl http://localhost:3101/api/health
```

## 数据库初始化

后端首次启动时会自动创建基建表并初始化最小种子数据：

- 管理员账号
- 管理员角色
- 基建菜单
- 角色菜单关系

数据库 schema 默认：

```txt
project_template
```

每个项目实例必须使用独立 `DB_NAME`。

## AI Coding 文档入口

AI 进入项目后先读：

- [AGENTS.md](./AGENTS.md)
- [AI 开发规约](./docs/AI开发规约.md)
- [AI 踩坑记录](./docs/AI踩坑记录.md)
- [复用资产索引](./docs/复用资产索引.md)

## 部署

部署说明见：

- [deploy/README.md](./deploy/README.md)
