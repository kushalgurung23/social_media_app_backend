const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const User = require('../models/User')
const Token = require('../models/Token')
const {
    createHash, 
    generateHashPassword, 
    compareHashPassword, 
    createTokenUser,
    createJWT, 
    TokenType, 
    sendCustomMessageEmail
} = require('../utils');

const registerUser = async (req, res) => {

    const {email, name, password, role} = req.body
    // If user has not provided any input
    if(!name || !email || !password || !role ) {
        throw new CustomError.BadRequestError('Please provider all user details.')
    }
    const emailAlreadyExists = await User.findUserByEmail({email})
    if(emailAlreadyExists) {
        throw new CustomError.BadRequestError('Email already exists.')
    }
    // random six digits number
    const verificationToken = Math.floor(100000 + Math.random() * 900000);
    // while saving in db, we save the hashed verification code
    const hashToken = createHash(verificationToken)
    const hashPassword = await generateHashPassword({password})
    // token will only be valid for fifteen minutes
    const fifteenMinutes = 1000 * 60 * 15
    const verificationTokenExpirationDate = new Date(Date.now() + fifteenMinutes)
    const user = new User({name, email, password: hashPassword, role, verificationToken: hashToken, verificationTokenExpirationDate})
    
    await user.save()
    const message = 
    `<p>We are very pleased to welcome you to our application. Please verify your email by entering the following 6-digit code in our application within <b><u>15 minutes</u></b>:</p>
    <h2>${verificationToken}</h2>
    `
    // While sending token in email, we do not send the hashed token
    await sendCustomMessageEmail({
        name: user.name,
        email: user.email,
        message,
        subject: 'Email Verification'
    })
    
    res.status(StatusCodes.CREATED).json({status: 'Success', msg: 'User is created successfully.'})
}

const verifyEmail = async (req, res) => {
    const {verificationToken, email} = req.body;
    if(!verificationToken) {
        throw new CustomError.BadRequestError('Verification token is required.')
    }
    if(!email) {
        throw new CustomError.BadRequestError('Email is required.')
    }
    if(verificationToken.length !== 6) {
        throw new CustomError.BadRequestError('Invalid verification token.')
    }

    const user = await User.findUserByEmail({email})
    if(!user) {
        throw new CustomError.UnauthenticatedError('Verification failed.')
    }
    const currentDate = Date.now()
    if(user.verification_token_expiration_date < currentDate) {
        throw new CustomError.UnauthenticatedError('Verification time period is over. Please request new code.')
    }
    if(user.is_verified === 1 && user.verified_on !== null) {
        throw new CustomError.UnauthenticatedError(`User was already verified on ${user.verified_on}.`)
    }
    // user.verification_token is already hashed
    // Therefore, verificationToken input from user is also hashed to check whether they match or not
    if(user.verification_token !== createHash(verificationToken)) {
        throw new CustomError.UnauthenticatedError('Verification failed.')
    }
    await User.confirmEmailVerification({email})
    await sendCustomMessageEmail({
         name: user.name,
        email: user.email,
        message: `<p>Congratulations!! Your account has been verified successfully.</p>`,
        subject: 'Welcome to Kushal App'
    })
    res.status(StatusCodes.OK).json({status: 'Success', msg: 'Email is verified successfully.'})
}

const resendVerificationToken = async (req, res) => {
    const {email} = req.body;
    if(!email) {
        throw new CustomError.BadRequestError('Email is required.')
    }
    const user = await User.findUserByEmail({email})
    if(!user) {
        throw new CustomError.UnauthenticatedError('User does not exist.')
    }
    if(user.is_verified === 1 && user.verified_on !== null) {
        throw new CustomError.UnauthenticatedError(`User was already verified on ${user.verified_on}.`)
    }
    // random six digits number
    const verificationToken = Math.floor(100000 + Math.random() * 900000);
    // while saving verificationToken in db, we will hash it
    const hashToken = createHash(verificationToken)
    // token will only be valid for fifteen minutes
    const fifteenMinutes = 1000 * 60 * 15
    const verificationTokenExpirationDate = new Date(Date.now() + fifteenMinutes)
    await User.updateVerificationToken({email, newToken: hashToken, verificationTokenExpirationDate})
    
    const message = 
    `<p>Please confirm your email by entering the following 6-digit code in our application within <b><u>15 minutes</u></b>:</p>
    <h2>${verificationToken}</h2>
    `
    // While sending token in email, we do not send the hashed token
    await sendCustomMessageEmail({
        name: user.name,
        email: user.email,
        message,
        subject: 'Email Verification'
    })
    res.status(StatusCodes.OK).json({status: 'Success', msg: 'New verification token is sent successfully.'})
}

const login = async (req, res) => {
    const {email, password} = req.body
    if (!email || !password) {
        throw new CustomError.BadRequestError('Please provide email and password.');
    }
    const user = await User.findUserByEmail({email})
    if(!user) {
        throw new CustomError.UnauthenticatedError('Invalid Credentials.')
    }
    const isPasswordCorrect = await compareHashPassword({userInputPassword: password, realPassword: user.password})
    if(!isPasswordCorrect) {
        throw new CustomError.UnauthenticatedError('Invalid Credentials.')
    }
    if(!user.is_verified) {
        throw new CustomError.UnauthenticatedError('User is not verified yet. Please verify your email.')
    }

    // tokenUser object will be stored in jwt payload
    const tokenUser = createTokenUser({name: user.name, userId: user.id, role: user.role})
    // GENERATE ACCESS JWT AND REFRESH JWT

    const accessJWT = createJWT({payload: {user: tokenUser}, tokenType: TokenType.ACCESSTOKEN})
    const refreshJWT = createJWT({payload: {user: tokenUser}, tokenType: TokenType.REFRESHTOKEN})

    // Access token and refresh token will be encrypted before storing in db
    const access_token = createHash(accessJWT)
    const refresh_token = createHash(refreshJWT)
    await Token.createToken({access_token, refresh_token, user: user.id})

    // TOKENS OF USER THAT WERE CREATED 90 days before will be deleted from db
    await Token.deleteAllExpiredTokens({userId: user.id}) 

    res.status(StatusCodes.OK).json({status: "Success", user: tokenUser, accessToken: accessJWT, refreshToken: refreshJWT})
}

const logout = async (req, res) => {
    // MIDDLEWARE WILL HANDLE THE LOGOUT LOGIC
    res.status(StatusCodes.OK).json({status: "Success", msg: 'user is logged out successfully.' });
};

// WHEN USER CLICKS ON FORGOT PASSWORD ON MOBILE APP
const forgotPassword = async (req, res) => {
    const {email} = req.body
    if(!email) {
      throw new CustomError.BadRequestError('Please provide valid email.')
    }

    const user = await User.findUserByEmail({email})
    if(user) {
        // random six digits number
        const verificationToken = Math.floor(100000 + Math.random() * 900000);
        // while sending email, we do not hash the verification token
        const message = `<p>In order to reset your password, please enter the following 6-digit code in the application within <b><u>15 minutes</u></b>:</p>
        <h2>${verificationToken}</h2>
        `
        await sendCustomMessageEmail({
            name: user.name,
            email: user.email,
            message,
            subject: 'Reset Password'
        })
        // user will have to provide the token within fifteen minutes to be able to enter their new password
        const fifteenMinutes = 1000 * 60 * 15
        const passwordTokenExpirationDate = new Date(Date.now() + fifteenMinutes)
        // hashing the forgot password verifiacation token before saving in db
        await User.updateForgotPasswordToken({
            passwordForgotToken: createHash(verificationToken),
            passwordForgotTokenExpirationDate: passwordTokenExpirationDate,
            email
        })
    }
    // Even if there is no user, we will show successful message to not let random user try different email
    res.status(StatusCodes.OK).json({status: 'Success', msg: "Please check your email for reset password code."})
}

// VERIFICATION CODE SCREEN 
const checkPasswordForgotToken = async (req, res) => {
    const {token, email} = req.body
    if(!email || !token) {
      throw new CustomError.BadRequestError('Please provide both 6 digit code and email.')
    }
    const user = await User.findUserByEmail({email})
    if(!user) {
        throw new CustomError.UnauthenticatedError('6 digit code does not match.')
    }

    const currentDate = Date.now()
    if(user.password_forgot_token_expiration_date < currentDate) {
        throw new CustomError.UnauthenticatedError('Password reset time period is over. Please start all over again.')
    }
    
     // user.password_forgot_token is hashed already, so token received from user input is also hashed in order to check if both are equal
    if(user.password_forgot_token !== createHash(token)) {
        throw new CustomError.UnauthenticatedError('6 digit code does not match.')
    }

    await User.verifyForgotPasswordToken({email})

    res.status(StatusCodes.OK).json({status: "Success", msg: "6 digit code matches successfully."})
}

// NEW PASSWORD ENTRY SCREEN
const resetPassword = async (req, res) => {
    // password is provided by user
    // token and email is received from query parameter when clicked on link from email
    const {password, email} = req.body
    if(!email || !password) {
      throw new CustomError.BadRequestError('Please provide both email and new password.')
    }
    const user = await User.findUserByEmail({email})
    if(!user) {
        throw new CustomError.UnauthenticatedError('Authentication Invalid.')
    }
    const currentDate = Date.now()
    // checking token exipiration date again. Incase user is already in enter new password screen and turned off mobile for more
    // than the exipry time. In this case, we will throw time out exception
    if(user.password_forgot_token_expiration_date < currentDate) {
      throw new CustomError.UnauthenticatedError('Password reset time period is over. Please start all over again.')
    }
    if(!user.is_password_forgot_token_verified) {   
        throw new CustomError.UnauthenticatedError('Error, please make sure that you provided the correct password forgot token.')
    }
    if(!user.password_forgot_token || !user.password_forgot_token_expiration_date) {   
        throw new CustomError.UnauthenticatedError('Password reset time period is over. Please start all over again.')
    }
    
    const hashPassword = await generateHashPassword({password})
    await User.resetPassword({email, hashPassword})
    await sendCustomMessageEmail({
        name: user.name, 
        email: user.email, 
        subject: 'Reset Password', 
        message: `<p>Your password is reset successfully.</p>`})
    res.status(StatusCodes.OK).json({status: "Success", msg: "Password is reset successfully."})
  }

const generateNewAccessToken = async (req, res) => {
    // IF REFRESH TOKEN IS VALID, WE WILL GET USERID FROM refreshTokenVerification MIDDLEWARE
    const userId = req.user.userId
    
    const user = await User.findUserById({userId})
    if(!user) {
        throw new CustomError.UnauthenticatedError('Authentication invalid.')
    }
    const tokenUser = createTokenUser({name: user.name, userId: user.id, role: user.role})
    // GENERATE NEW ACCESS JWT 
    const accessJWT = createJWT({payload: {user: tokenUser}, tokenType: TokenType.ACCESSTOKEN})
    const access_token = createHash(accessJWT)
    await Token.updateNewAccessToken({access_token, userId})
    res.status(StatusCodes.OK).json({status: "Success", accessToken: accessJWT})
}

const deactivateAccount = async(req, res) => {
    const {userId} = req.user
    if(!userId) {
        throw new CustomError.UnauthenticatedError('Please login before trying again.')
    }
    await User.deleteUserAccount({userId})
    res.status(StatusCodes.OK).json({status: "Success", msg: "Account has been deactivated successfully."})
}

module.exports = {
    registerUser,
    verifyEmail,
    resendVerificationToken,
    login,
    logout,
    forgotPassword,
    checkPasswordForgotToken,
    resetPassword,
    generateNewAccessToken,
    deactivateAccount
}
