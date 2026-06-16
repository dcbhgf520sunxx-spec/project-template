const cron = require('node-cron')
const db = require('../db')

/**
 * 每天凌晨 0:30 执行
 * 每天刷新运维工单的 is_overdue 字段。
 * 规则：预计解决时间 < 当天 且 状态不是已完成/暂停 -> is_overdue = 1，否则 = 0
 */
function start() {
  cron.schedule('30 0 * * *', async () => {
    try {
      const today = new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')

      const result = await db.prepare(
        `UPDATE pms_work_order SET is_overdue = 1 WHERE expected_resolve_date < ? AND status NOT IN (2, 3) AND is_deleted = 0 AND is_overdue = 0`
      ).run(today)
      if (result.changes > 0) console.log(`[Cron] 工单逾期刷新：${result.changes} 条标记为逾期`)

      const clearResult = await db.prepare(
        `UPDATE pms_work_order SET is_overdue = 0 WHERE is_overdue = 1 AND (status IN (2, 3) OR expected_resolve_date >= ?) AND is_deleted = 0`
      ).run(today)
      if (clearResult.changes > 0) console.log(`[Cron] 工单逾期刷新：${clearResult.changes} 条标记为未逾期`)
    } catch (err) {
      console.error('[Cron] 逾期刷新任务执行失败:', err)
    }
  })

  console.log('[Cron] 逾期自动刷新任务已启动（每天 00:30 执行）')
}

module.exports = { start }
