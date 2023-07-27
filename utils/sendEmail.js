const nodemailer = require('nodemailer')
const CustomError = require('../errors')
const nodeMailerConfig = require('../config/nodemailerConfig')

const sendEmail = async ({to, subject, html}) => {
    // const testAccount = await nodemailer.createTestAccount();
    // Create a SMTP transporter object
    const transporter = nodemailer.createTransport(nodeMailerConfig); 

    // Message object
    const message = {
        from: `C Talent ${process.env.SMTP_EMAIL}`,
        to, 
        subject, 
        html
    };

    return transporter.sendMail(message, (err, info) => {
        if (err) {
          throw CustomError.BadRequestError('Message not delivered.');
        }

        console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    });

}

module.exports = sendEmail