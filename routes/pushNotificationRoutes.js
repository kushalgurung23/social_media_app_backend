const express = require('express')
const router = express.Router()
const {sendPushNotification} = require('../controllers/pushNotificationController')

router.route('/').post(sendPushNotification)

module.exports = router