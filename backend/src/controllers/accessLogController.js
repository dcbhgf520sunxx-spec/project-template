const accessLogService = require('../services/accessLogService')

exports.list = async (req, res) => {
  try {
    const result = await accessLogService.listAccessLogs(req.query)
    res.json({ code: 0, message: 'success', data: result })
  } catch (err) {
    console.error(err)
    res.status(500).json({ code: 500, message: '查询失败', data: null })
  }
}
