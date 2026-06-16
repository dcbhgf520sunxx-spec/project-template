# AI 开发规约

本文档定义 AI 在本基建项目中开发、修改、验证功能的统一规则。AI 修改代码、数据库、接口、权限或页面前必须读取本文档。

## 1. 基建边界

MUST:

- 把本项目当作基建模板维护
- 保持登录、用户、角色、菜单、权限稳定
- 保持基础档案稳定
- 保持运维工单作为基础业务样例稳定
- 使用独立数据库 schema
- 修改后执行验证

DO NOT:

- 不要写入具体客户数据
- 不要写入临时演示数据
- 不要共用其他项目业务数据库
- 不要只改前端隐藏权限
- 不要绕过统一页面、接口和数据库规则

当前保留模块：

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

## 2. 环境规则

当前端口：

| 服务 | 端口 |
| --- | --- |
| 后端 | `3101` |
| 前端 | `3102` |
| MySQL | `3306` |

禁止占用：

- `3001`
- `3002`

数据库：

```env
DB_NAME=project_template
```

`.env` 不得提交，不得在文档中暴露真实密钥。

## 3. 数据库规则

业务表 MUST 包含：

```sql
id BIGINT AUTO_INCREMENT PRIMARY KEY,
is_deleted TINYINT DEFAULT 0,
creator_id BIGINT NULL,
updater_id BIGINT NULL,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

MUST:

- 使用 InnoDB
- 使用 `utf8mb4`
- 表名使用 `pms_` 前缀
- 字段名使用小写下划线
- 外键字段以 `_id` 结尾
- 删除默认软删除
- 列表查询过滤 `is_deleted = 0`

密码 MUST 使用：

```js
bcrypt.hash(password, 10)
```

禁止明文密码入库。

## 4. 接口规则

统一返回：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

标准接口：

| 操作 | 方法 | 路径 |
| --- | --- | --- |
| 列表 | GET | `/api/:resource` |
| 详情 | GET | `/api/:resource/:id` |
| 新增 | POST | `/api/:resource` |
| 编辑 | PUT | `/api/:resource/:id` |
| 删除 | DELETE | `/api/:resource/:id` |
| 状态变更 | PUT | `/api/:resource/:id/status` |
| 历史记录 | GET | `/api/:resource/:id/history` |
| 邻居导航 | GET | `/api/:resource/neighbors` |

列表接口 MUST 支持：

- `page`
- `pageSize`
- `sort_field`
- `sort_order`
- 筛选参数
- 软删除过滤

排序 MUST 使用后端白名单 `sortMap`。禁止直接拼接前端传入字段。

## 5. 权限规则

权限 MUST 前后端同时控制。

前端 MUST:

- 使用登录接口返回菜单渲染左侧菜单
- 无权限入口隐藏
- 子页面高亮父级菜单
- 权限变化后清理旧菜单缓存

后端 MUST:

- 验证 JWT
- 高风险接口校验权限
- 用户、角色、菜单变更写日志
- 权限不足返回明确错误

前端隐藏菜单不等于权限控制。

## 6. 操作日志规则

以下操作 MUST 写日志：

- 新增
- 编辑
- 删除
- 状态变更
- 密码重置
- 权限变更

日志 MUST:

- `field_name` 使用数据库字段名
- 一个字段变更写一条日志
- 保存 `old_value` 和 `new_value`
- 敏感字段脱敏

## 7. 页面规则

### 7.1 通用布局

页面根节点 MUST:

```css
.page {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
```

内容区 MUST 使用：

```css
flex: 1;
min-height: 0;
```

底部按钮区和分页区 MUST 使用：

```css
flex-shrink: 0;
```

### 7.2 列表页

列表页 MUST 包含：

- 筛选区
- 表格区
- 分页区
- 新增入口，按权限显示

列表页 MUST 支持：

- 搜索
- 重置
- 分页
- 排序
- loading 状态
- 空状态

表格 MUST:

- 使用 `stripe`
- 使用 `border`
- 使用 `resizable`
- 有序号列
- 操作列固定右侧

删除、批量删除、状态变更 MUST 二次确认。

### 7.3 表单页

表单页 MUST 包含：

- 表单主体
- 分区标题
- 底部取消按钮
- 底部保存按钮

表单 MUST:

- 支持新增
- 支持编辑
- 按需支持复制
- 必填字段配置校验
- 保存前执行 `formRef.validate()`
- 处理 keep-alive 激活

### 7.4 详情页

详情页 MUST 包含：

- 基本信息
- 历史记录，按需
- 单据信息
- 底部按钮

基本信息空值 MUST 显示 `-`。

单据信息放在详情底部：

- 创建人
- 创建时间
- 更新人
- 更新时间

### 7.5 UI

统一色值：

| 用途 | 色值 |
| --- | --- |
| 主色 | `#3b82f6` |
| 主色 hover | `#2563eb` |
| 侧边栏 | `#0f172a` |
| 标题文字 | `#0f172a` |
| 正文文字 | `#1f2937` |
| 辅助文字 | `#64748b` |
| 表头背景 | `#f3f4f6` |
| 信息卡背景 | `#f8fafc` |
| 边框 | `#e2e8f0` |

操作按钮顺序：

```txt
编辑 -> 次要操作 -> 删除
```

人员下拉显示：

```txt
工号·姓名
```

状态字段使用 badge，不要裸露数字。

## 8. 新功能接入流程

新增功能 MUST 按顺序执行：

1. 明确功能边界
2. 确认数据结构
3. 设计菜单和权限
4. 实现后端接口
5. 实现前端 API
6. 实现列表页
7. 实现表单页
8. 实现详情页
9. 接入操作日志
10. 接入路由和菜单
11. 构建和接口验证
12. 服务重启和健康检查
13. 自检后回复

开发前 MUST 明确：

- 模块名称
- 菜单名称
- 前端路由
- 后端资源路径
- 数据表名
- 主字段
- 列表字段
- 筛选字段
- 表单字段
- 详情字段
- 状态枚举
- 权限动作

如用户没有提供完整设计，AI 应从当前代码模式推导最小可行方案，并在回复中说明假设。

## 9. 字段变更流程

新增字段 MUST 同步：

- 数据库建表或迁移
- 后端列表查询
- 后端详情查询
- 后端新增接口
- 后端编辑接口
- 前端列表页
- 前端表单页
- 前端详情页
- 筛选条件
- 排序字段
- 操作日志

删除字段 MUST 先搜索：

```bash
rg -n "字段名|字段中文名" backend/src frontend/src docs -S
```

确认后同步删除：

- 数据库字段
- 后端 SELECT
- 后端 INSERT
- 后端 UPDATE
- 后端筛选
- 后端排序
- 操作日志字段
- 前端列表
- 前端表单
- 前端详情
- 前端筛选
- API 参数

删除后 MUST 查询表结构确认字段不存在。

## 10. 复用与踩坑沉淀

AI 遇到重复问题或可复用模式时 MUST 沉淀。

规则：

- 踩过一次且有代表性，写入 `docs/AI踩坑记录.md`
- 同类代码复制第二次，写入 `docs/复用资产索引.md`
- 踩坑变成硬规则后，提升到 `AGENTS.md`
- 复用资产稳定后，按需抽成 `templates/` 或 `scripts/`

DO NOT:

- 不要把所有细节塞进 `AGENTS.md`
- 不要把踩坑和复用混在一个文件
- 不要写没有触发场景的空泛经验

## 11. 验证规则

后端修改后 MUST:

```bash
curl -s http://localhost:3101/api/health
```

前端修改后 MUST:

```bash
cd /Users/sunxinxin/Documents/Project/project-template/frontend && npm run build
```

字段删除后 MUST:

```bash
rg -n "旧字段名|旧中文名" backend/src frontend/src docs -S
```

服务日志检查：

```bash
tail -n 80 /tmp/project-template-backend-3101.log
tail -n 80 /tmp/project-template-frontend-3102.log
```

代码修改后确认：

- 后端运行在 `3101`
- 前端运行在 `3102`
- 没有占用 `3001`
- 没有占用 `3002`

## 12. 完成前检查

最终回复前 MUST 确认：

- 用户最新要求已覆盖
- 没有继续执行被打断或废弃的旧任务
- 没有覆盖用户已有改动
- 数据库、后端、前端同步一致
- 权限没有只做前端隐藏
- 构建或健康检查已按需执行
- 未验证事项已明确说明

最终回复 MUST 包含：

- 改了什么
- 改了哪些关键文件
- 验证了什么
- 是否有未完成事项

