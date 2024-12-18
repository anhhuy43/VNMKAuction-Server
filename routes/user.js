const express = require('express')
const router = express.Router()
const userController = require('../app/controllers/UserController')

router.post('/login', userController.login)
router.post('/create', userController.create)
router.get('/info', userController.info)
router.get('/edit-user', userController.editUser)
router.put('/update-user', userController.updateUser)
router.put('/update-password', userController.updatePassword)

module.exports = router