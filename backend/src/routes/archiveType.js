const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/archiveTypeController')

router.get('/', ctrl.list)
router.get('/check-prefix', ctrl.checkPrefix)
router.post('/', ctrl.create)
router.put('/:id', ctrl.update)
router.put('/:id/status', ctrl.toggleStatus)
router.delete('/:id', ctrl.remove)

module.exports = router
