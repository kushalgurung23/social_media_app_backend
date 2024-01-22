const firebaseAdmin = require('firebase-admin')
const CustomError = require('../errors/index')
const {StatusCodes} = require('http-status-codes')
const PushNotification = require('../models/PushNotification')

const sendNotification = async (req, res) => {
    const {title, body, device_token} = req.body
    if(!title || !body || !device_token) {
        throw new CustomError.BadRequestError('Please provide all title, body and device token.')
    }

    const message = {
        notification: {
          title,
          body
        },          
        token: device_token,
        // ANDROID
        android: {
            priority: 'high',
        },
        // IOS
        apns: {
            payload: {
                aps: {
                    'mutable-content': 1,
                    'content-available': 1
                }
            }
        }
    };
    await firebaseAdmin.messaging().send(message)
        .then((response) => { 
            res.status(StatusCodes.OK).json({
                status: 'Success',
                msg: `Push notification is sent successfully ${response}`
            })
        })
        .catch((error) => {
            throw new CustomError.BadRequestError(`An error was occured while trying to send notification ${error}`)
    });
}

const getAllNotifications = async (req, res) => {
    const {userId} = req.user
    const {order_by} = req.query
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const offset = (page - 1) * limit

    const {totalNotificationsCount, notifications} = await PushNotification.findAll({userId, order_by, limit, offset})
    return res.status(StatusCodes.OK).json({
      status: "Success",
      page,
      limit,
      count: totalNotificationsCount,
      notifications: !notifications ? [] : notifications,
    });
}

const readNotification = async (req, res) => {
    const {userId} = req.user
    const {id: notificationId} = req.params
    const isRead = await PushNotification.readNotification({userId, notificationId})
    return res.status(StatusCodes.OK).json({
      status: isRead ? "Success" : "Error",
      msg: isRead ? 'Notification is read successfully.' : 'Unable to read notification.',
    });
}

module.exports = {sendNotification, getAllNotifications, readNotification}