const firebaseAdmin = require('firebase-admin')
const CustomError = require('../errors/index')
const {StatusCodes} = require('http-status-codes')

const sendPushNotification = async (req, res) => {
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
            content_available: true
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

module.exports = {sendPushNotification}