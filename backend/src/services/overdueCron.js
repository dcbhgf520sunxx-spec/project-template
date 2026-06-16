const cron = require('node-cron')
const db = require('../db')

/**
 * 每天凌晨 0:30 执行
 * 批量刷新所有模块的 is_overdue 字段
 * 规则：预计完成时间 < 当天 且 状态不是已完成/暂停 → is_overdue = 1，否则 = 0
 */
function start() {
  cron.schedule('30 0 * * *', async () => {
    try {
      const today = new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')

      // === 项目表 ===
      let result = await db.prepare(
        `UPDATE pms_project SET is_overdue = 1 WHERE expected_end_date < ? AND status NOT IN (2, 3) AND is_deleted = 0 AND is_overdue = 0`
      ).run(today)
      if (result.changes > 0) console.log(`[Cron] 项目逾期刷新：${result.changes} 条标记为逾期`)

      result = await db.prepare(
        `UPDATE pms_project SET is_overdue = 0 WHERE is_overdue = 1 AND (status IN (2, 3) OR expected_end_date >= ?) AND is_deleted = 0`
      ).run(today)
      if (result.changes > 0) console.log(`[Cron] 项目逾期刷新：${result.changes} 条标记为未逾期`)

      // === 任务表 ===
      result = await db.prepare(
        `UPDATE pms_task SET is_overdue = 1 WHERE expected_end_date < ? AND status NOT IN (2, 3) AND is_deleted = 0 AND is_overdue = 0`
      ).run(today)
      if (result.changes > 0) console.log(`[Cron] 任务逾期刷新：${result.changes} 条标记为逾期`)

      result = await db.prepare(
        `UPDATE pms_task SET is_overdue = 0 WHERE is_overdue = 1 AND (status IN (2, 3) OR expected_end_date >= ?) AND is_deleted = 0`
      ).run(today)
      if (result.changes > 0) console.log(`[Cron] 任务逾期刷新：${result.changes} 条标记为未逾期`)

      // === 工单表 ===
      result = await db.prepare(
        `UPDATE pms_work_order SET is_overdue = 1 WHERE expected_resolve_date < ? AND status NOT IN (2, 3) AND is_deleted = 0 AND is_overdue = 0`
      ).run(today)
      if (result.changes > 0) console.log(`[Cron] 工单逾期刷新：${result.changes} 条标记为逾期`)

      result = await db.prepare(
        `UPDATE pms_work_order SET is_overdue = 0 WHERE is_overdue = 1 AND (status IN (2, 3) OR expected_resolve_date >= ?) AND is_deleted = 0`
      ).run(today)
      if (result.changes > 0) console.log(`[Cron] 工单逾期刷新：${result.changes} 条标记为未逾期`)

      // === 需求表 ===
      // 标记为逾期
      result = await db.prepare(
        `UPDATE pms_requirement SET is_overdue = 1 WHERE expected_end_date < ? AND status NOT IN (3, 13, 22, 33, 34, 35) AND is_deleted = 0 AND (is_overdue = 0 OR is_overdue IS NULL)`
      ).run(today)
      if (result.changes > 0) console.log(`[Cron] 需求逾期刷新：${result.changes} 条标记为逾期`)

      // 清除逾期（未逾期或进入终止态）
      result = await db.prepare(
        `UPDATE pms_requirement SET is_overdue = 0 WHERE is_overdue = 1 AND (expected_end_date >= ?) AND is_deleted = 0`
      ).run(today)
      if (result.changes > 0) console.log(`[Cron] 需求逾期刷新：${result.changes} 条清除逾期`)

      // 终止态/完成态置为 NULL
      result = await db.prepare(
        `UPDATE pms_requirement SET is_overdue = NULL WHERE status IN (3, 13, 22, 33, 34, 35) AND is_overdue IS NOT NULL AND is_deleted = 0`
      ).run(today)
      if (result.changes > 0) console.log(`[Cron] 需求逾期刷新：${result.changes} 条置为无关`)
    } catch (err) {
      console.error('[Cron] 逾期刷新任务执行失败:', err)
    }
  })

  console.log('[Cron] 逾期自动刷新任务已启动（每天 00:30 执行）')
}

module.exports = { start }
