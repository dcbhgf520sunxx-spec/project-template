const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/userController')

router.get('/', ctrl.list)
router.get('/hr-search', ctrl.hrSearch)
router.get('/check-phone', ctrl.checkPhone)
router.get('/check-employee-no', ctrl.checkEmployeeNo)
router.put('/:id/status', ctrl.toggleStatus)
router.put('/:id/reset-password', ctrl.resetPassword)
router.get('/:id', ctrl.getById)
router.post('/', ctrl.create)
router.put('/:id', ctrl.update)

module.exports = router
