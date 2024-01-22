const express = require('express')
const router = express.Router()
const {sendNotification, getAllNotifications, readNotification} = require('../controllers/pushNotificationController')

router.route('/').post(sendNotification).get(getAllNotifications)
router.route('/:id').patch(readNotification)

module.exports = router