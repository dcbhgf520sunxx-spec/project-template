const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/archiveController')

router.get('/', ctrl.list)
router.get('/by-type-name', ctrl.getByTypeName)
router.put('/batch-sort', ctrl.batchUpdateSort)
router.post('/', ctrl.create)
router.put('/:id', ctrl.update)
router.put('/:id/status', ctrl.toggleStatus)
router.delete('/:id', ctrl.remove)

module.exports = router
