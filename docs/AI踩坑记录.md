# AI 踩坑记录

本文档记录 AI 在本项目中已经遇到或高概率重复遇到的问题。AI 修复问题、处理异常、删除字段、调整权限、处理构建失败前，应先搜索本文档。

## 记录规则

新增踩坑记录时 MUST 使用以下结构：

```md
## 坑：一句话描述

触发场景：
- 什么任务下容易出现

症状：
- 表现是什么

原因：
- 根因是什么

正确处理：
- 应该怎么做

预防规则：
- 下次如何避免

关联文件：
- `path/to/file`
```

## 坑：删除字段只改了页面，数据库或接口仍残留

触发场景：

- 用户要求删除字段
- 字段同时存在于数据库、后端和前端

症状：

- 页面上字段消失了
- 接口查询或保存仍报 SQL 错误
- 返回数据里仍有旧字段

原因：

- 只删除了前端展示
- 没有同步删除后端 SELECT、INSERT、UPDATE、筛选、排序
- 没有执行数据库字段迁移

正确处理：

- 使用 `rg` 同时搜索字段名和中文名
- 删除前端列表、表单、详情、筛选
- 删除后端查询、新增、编辑、排序、日志映射
- 删除数据库字段
- 查询表结构确认字段不存在
- 请求相关接口确认不报错

预防规则：

- 字段删除必须执行 `docs/AI开发规约.md` 的字段变更流程

关联文件：

- `docs/AI开发规约.md`

## 坑：旧菜单来自浏览器缓存或历史权限数据

触发场景：

- 菜单数据已清理
- 用户页面仍看到旧菜单

症状：

- 后端菜单已正确
- 登录后左侧仍出现不应存在的菜单

原因：

- 浏览器 `localStorage` 中保留旧菜单
- 前端未做基建菜单白名单过滤
- 用户未重新登录

正确处理：

- 检查登录接口返回菜单
- 检查 `localStorage.menus`
- 退出重新登录
- 必要时前端增加基建菜单白名单过滤

预防规则：

- 菜单调整后必须验证登录接口和前端缓存

关联文件：

- `frontend/src/views/Layout.vue`

## 坑：多个项目共用同一个数据库 schema

触发场景：

- 复制项目后未修改 `.env`
- 多个项目连接同一个 `DB_NAME`

症状：

- 一个项目初始化影响另一个项目
- 菜单、用户、种子数据互相污染

原因：

- MySQL 实例可以共用，但业务 schema 不能共用

正确处理：

- 为当前项目创建独立 schema
- 修改 `backend/.env` 的 `DB_NAME`
- 重启后端
- 验证健康检查和核心接口

预防规则：

- 每个项目实例必须使用独立 `DB_NAME`

关联文件：

- `backend/.env`
- `AGENTS.md`

## 坑：`.env.example` 仍保留旧端口或旧库名

触发场景：

- 项目已切换独立端口或独立数据库
- 只修改了本地 `.env`
- 忘记同步 `.env.example`

症状：

- 新环境按 example 初始化后连到旧库
- 后端默认端口和文档端口不一致
- 前端代理或 CORS 指向旧端口

原因：

- `.env` 被 git ignore，真实运行正常，但模板配置样例过期

正确处理：

- 同步更新 `backend/.env.example`
- 检查 `PORT`
- 检查 `DB_NAME`
- 检查 `ALLOWED_ORIGIN`
- 检查后端代码默认端口和 CORS fallback

预防规则：

- 修改运行端口或数据库名时，必须同时检查 `.env.example` 和后端 fallback 配置

关联文件：

- `backend/.env.example`
- `backend/src/app.js`
- `backend/src/db.js`

## 坑：把角色 code 当成登录账号

触发场景：

- 种子数据里有 `admin` 角色
- 管理员用户账号却不是 `admin`

症状：

- 使用 `admin / vv123456` 登录返回“用户不存在”
- 使用旧员工号或中文姓名可以登录

原因：

- 登录接口查的是 `pms_user.employee_no`、`phone`、`real_name`
- `pms_role.code = admin` 不是登录账号

正确处理：

- 默认管理员用户的 `employee_no` 使用 `admin`
- README、部署文档和种子数据保持一致
- 旧库中如存在历史管理员账号，启动时迁移为 `admin / 管理员`

预防规则：

- 默认账号必须同时核对登录接口、种子用户、README 和部署文档

关联文件：

- `backend/src/db.js`
- `README.md`
- `deploy/README.md`

## 坑：启动命令覆盖了端口，但 Vite 默认配置仍是旧端口

触发场景：

- 文档或 AGENTS 中使用环境变量指定 `3102 -> 3101`
- `frontend/vite.config.js` 默认仍保留旧端口组合
- 同事直接执行 `npm run dev`

症状：

- 前端启动到旧端口
- API 代理到旧后端
- 部署或本地运行表现和文档不一致

原因：

- 只统一了启动命令，没有统一代码默认配置

正确处理：

- `frontend/vite.config.js` 默认端口使用 `3102`
- `frontend/vite.config.js` 默认代理使用 `http://localhost:3101`
- README 使用 `npm run dev` 即可启动到正确端口

预防规则：

- 端口变更必须同时检查 README、AGENTS、`.env.example`、Vite 配置、PM2 配置和 Nginx 配置

关联文件：

- `frontend/vite.config.js`
- `README.md`
- `deploy/pm2.config.js`
- `deploy/nginx.conf`
