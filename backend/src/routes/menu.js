const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/menuController')

router.get('/', ctrl.list)
router.get('/user/:userId', ctrl.getUserMenus)
router.get('/role/:roleId', ctrl.getRoleMenus)
router.put('/role/:roleId', ctrl.saveRoleMenus)

module.exports = router
