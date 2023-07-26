const CustomError = require('../errors');
const Token = require('../models/Token')
const {
    isTokenValid, createHash
} = require('../utils');

// ACCESS TOKEN
const authenticateUser = async (req, res, next) => {
    try { 
        // check header and receive accessToken
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer')) {
            throw new CustomError.UnauthenticatedError("Authentication invalid.")
        }
        const accessToken = authHeader.split(' ')[1]

        const payload = isTokenValid(accessToken)
        if(!payload) {
            throw new CustomError.UnauthenticatedError("Authentication invalid.")
        }
        const {userId} = payload.user
        // Access token that is received from user will be encrypted below because the access token in db is already encrypted.
        // As a result of that, then only we can check if the access token provided by user is equal to access token from db
        const access_token = createHash(accessToken)
    
        const token = await Token.findByAccessToken({access_token, userId})
        
        if(!token) {
            throw new CustomError.UnauthenticatedError("Authentication invalid.")
        }
        req.user = payload.user
        next()
    } 
    catch (error) {
        throw new CustomError.UnauthenticatedError("Authentication invalid.")
    }
  };

// REFRESH TOKEN IS REQUIRED TO GENERATE NEW ACCESS TOKEN
const refreshTokenVerification = async (req, res, next) => {
    try { 
        // check header and receive refreshToken
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer')) {
            throw new CustomError.UnauthenticatedError("Authentication invalid.")
        }
        const refreshToken = authHeader.split(' ')[1]
        
        // Refresh token that is received from user will be encrypted because the refresh token in db is also encrypted.
        // As a result of that, then only we can check if the refresh token provided by user is equal to refresh token from db
        const refresh_token = createHash(refreshToken)

        const payload = isTokenValid(refreshToken)
        if(!payload) {
            // IF NOT VALID, THEN IT IS EXPIRED AND THEREFORE WILL BE DELETED FROM DB
            await Token.deleteWithRefreshToken({refresh_token})
            throw new CustomError.UnauthenticatedError("Authentication invalid.")
        }
        const {userId} = payload.user
    
        const token = await Token.findByRefreshToken({refresh_token, userId})
        
        if(!token) {
            throw new CustomError.UnauthenticatedError("Authentication invalid.")
        }
        req.user = payload.user
        next()
    } 
    catch (error) {
        throw new CustomError.UnauthenticatedError("Authentication invalid.")
    }
}

// REFRESH TOKEN IS REQUIRED TO LOG OUT 
const deleteRefreshTokenAuthentication = async (req, res, next) => {
    // check header and receive refreshToken
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        throw new CustomError.UnauthenticatedError("Please provide refresh token.")
    }
    const refreshToken = authHeader.split(' ')[1]
    const payload = isTokenValid(refreshToken)
    if(payload) {
        const {userId} = payload.user
        // TOKENS OF USER THAT WERE CREATED 90 days before will be deleted from db
        await Token.deleteAllExpiredTokens({userId}) 
    }
    // Refresh token that is received from user will be encrypted because the refresh token in db is also encrypted.
    // As a result of that, then only we can check if the refresh token provided by user is equal to refresh token from db
    const refresh_token = createHash(refreshToken)
    await Token.deleteWithRefreshToken({refresh_token})
    next()
}

// REFRESH TOKEN IS REQUIRED TO DEACTIVATE ACCOUNT
const deactivateAccountTokenVerification = async (req, res, next) => {
    try { 
        // check header and receive refreshToken
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer')) {
            throw new CustomError.UnauthenticatedError("Authentication invalid.")
        }
        const refreshToken = authHeader.split(' ')[1]
        
        // Refresh token that is received from user will be encrypted because the refresh token in db is also encrypted.
        // As a result of that, then only we can check if the refresh token provided by user is equal to refresh token from db
        const refresh_token = createHash(refreshToken)
        const payload = isTokenValid(refreshToken)
        const {userId} = payload.user
        const token = await Token.findByRefreshToken({refresh_token, userId})
        
        if(!token) {
            throw new CustomError.UnauthenticatedError("Authentication invalid.")
        }

        if(!payload) {
            // IF NOT VALID, THEN IT IS EXPIRED AND THEREFORE WILL BE DELETED FROM DB
            await Token.deleteWithRefreshToken({refresh_token})
            throw new CustomError.UnauthenticatedError("Authentication invalid.")
        }
        
        await Token.deleteWithRefreshToken({refresh_token})
        // TOKENS OF USER THAT WERE CREATED 90 days before will be deleted from db
        await Token.deleteAllExpiredTokens({userId}) 

        req.user = payload.user
        next()
    } 
    catch (error) {
        throw new CustomError.UnauthenticatedError("Authentication invalid.")
    }
}

module.exports = {authenticateUser, refreshTokenVerification, deleteRefreshTokenAuthentication, deactivateAccountTokenVerification}