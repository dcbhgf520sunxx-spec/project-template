# AGENTS.md - AI Coding 入口规则

本文件是 AI 进入本项目后的最高优先级规则。AI 必须先遵守本文件，再读取 `docs/` 下的任务规约。

## 1. 项目定位

本项目是基建模板，不是具体业务项目。

AI 的目标：

- 保持登录、用户、角色、菜单、权限稳定
- 保持基础档案稳定
- 保持运维工单作为基础业务样例稳定
- 保持数据库、接口、页面、日志、部署规则可复用
- 让后续 AI 能按规约继续开发

## 2. 必读文档

| 场景 | 必读 |
| --- | --- |
| 任意任务 | `AGENTS.md` |
| 任意代码、数据库、接口、页面、权限修改 | `docs/AI开发规约.md` |
| 修 bug、处理异常、遇到反复问题 | `docs/AI踩坑记录.md` |
| 新增模块、页面、接口或想复用已有模式 | `docs/复用资产索引.md` |

如存在以下设计文件，开发新功能前也必须读取：

- `docs/功能清单.xlsx`
- `docs/数据库表设计.xlsx`

如果设计文件不存在但任务依赖设计，AI 必须说明缺失，并基于当前代码和用户要求谨慎推进。

## 3. 文档沉淀规则

后续新内容由 AI 自己维护，但必须按归属写入：

- 稳定硬规则写入 `AGENTS.md`
- 开发执行规则写入 `docs/AI开发规约.md`
- 典型踩坑写入 `docs/AI踩坑记录.md`
- 可复用结构、模板、命令写入 `docs/复用资产索引.md`

触发条件：

- 同类问题踩过一次且有代表性，补充踩坑记录
- 同类代码或流程复用第二次，补充复用资产
- 踩坑已经变成必须遵守的硬约束，再提升到 `AGENTS.md`
- 复用资产稳定后，按需抽成 `templates/` 或 `scripts/`

DO NOT:

- 不要把所有细节塞进 `AGENTS.md`
- 不要把踩坑和复用混在一起
- 不要写没有触发场景的空泛经验

## 4. 当前环境

| 服务 | 端口 |
| --- | --- |
| 后端 | `3101` |
| 前端 | `3102` |
| MySQL | `3306` |

禁止占用：

- `3001`
- `3002`

当前数据库：

```env
DB_NAME=project_template
```

禁止多个项目共用同一个业务数据库 schema。

## 5. 基建保留模块

本基建模板默认保留：

- 基础设置
- 基础档案
- 用户与权限
- 用户管理
- 角色管理
- 运维工单

运维工单当前不包含“所属系统”字段。不要重新引入：

- `system_id`
- `system_name`
- `所属系统`

## 6. 不可违反规则

AI MUST:

- 修改前读取相关文件
- 使用 `rg` 搜索文本和文件
- 手工编辑使用 `apply_patch`
- 尊重用户已有改动，不得回滚
- 字段变更同步数据库、后端、前端、日志、筛选、排序
- 高风险接口做后端权限校验
- 修改代码后按需构建、重启、验证

AI DO NOT:

- 不要执行 `git reset --hard`
- 不要执行 `git checkout --` 回滚用户改动
- 不要只改前端隐藏权限
- 不要明文写入密码
- 不要提交或暴露 `.env` 真实密钥
- 不要跳过失败的构建或接口错误

## 7. 服务命令

后端重启：

```bash
screen -S project-template-backend -X quit 2>/dev/null || true
pids=$(lsof -tiTCP:3101 -sTCP:LISTEN -n -P 2>/dev/null || true)
if [ -n "$pids" ]; then kill $pids 2>/dev/null || true; fi
sleep 1
: > /tmp/project-template-backend-3101.log
screen -dmS project-template-backend zsh -lc 'cd /Users/sunxinxin/Documents/Project/project-template/backend && npm start > /tmp/project-template-backend-3101.log 2>&1'
sleep 3
tail -n 80 /tmp/project-template-backend-3101.log
```

前端重启：

```bash
screen -S project-template-frontend -X quit 2>/dev/null || true
pids=$(lsof -tiTCP:3102 -sTCP:LISTEN -n -P 2>/dev/null || true)
if [ -n "$pids" ]; then kill $pids 2>/dev/null || true; fi
sleep 1
: > /tmp/project-template-frontend-3102.log
screen -dmS project-template-frontend zsh -lc 'cd /Users/sunxinxin/Documents/Project/project-template/frontend && env VITE_DEV_PORT=3102 VITE_API_PROXY_TARGET=http://localhost:3101 npx vite --host 0.0.0.0 --port 3102 > /tmp/project-template-frontend-3102.log 2>&1'
sleep 3
tail -n 80 /tmp/project-template-frontend-3102.log
```

健康检查：

```bash
curl -s http://localhost:3101/api/health
```

前端构建：

```bash
cd /Users/sunxinxin/Documents/Project/project-template/frontend && npm run build
```

## 8. 完成回复

最终回复必须说明：

- 改了什么
- 改了哪些关键文件
- 做了哪些验证
- 是否有未完成或无法验证事项

仅修改文档时不需要重启服务，但必须检查文档引用和关键规则。

