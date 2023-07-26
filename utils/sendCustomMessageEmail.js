const sendEmail = require('./sendEmail')

const sendCustomMessageEmail = async ({name, email, subject, message}) => {
   
    return sendEmail({
        to: email,
        subject,
        html: `<h4>Hello ${name}</h4>
        ${message}
        `
    })
}

module.exports = sendCustomMessageEmail