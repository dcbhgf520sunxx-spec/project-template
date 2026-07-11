/**
 * 计算是否逾期
 * @param {string|null} expectedEndDate - 预计完成时间 (YYYY-MM-DD)
 * @param {number} status - 当前状态
 * @param {number[]} terminalStatuses - 终止态列表（这些状态不计算逾期）
 * @returns {number} 1=逾期, 0=未逾期
 */
function calcOverdue(expectedEndDate, status, terminalStatuses = [2, 3]) {
  if (terminalStatuses.includes(status)) return 0
  if (!expectedEndDate) return 0
  const today = getShanghaiDateText()
  return expectedEndDate < today ? 1 : 0
}

module.exports = { calcOverdue }
const { getShanghaiDateText } = require('./date')
