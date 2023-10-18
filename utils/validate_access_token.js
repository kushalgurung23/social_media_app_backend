const Token = require("../models/Token");
const createHash = require("./createHash")
const {isTokenValid} = require("./jwt")

const validateAccessToken = async ({accessToken}) => {
    const payload = isTokenValid(accessToken)
    if(!payload) {
        return false;
    }
    const {userId} = payload.user
    const access_token = createHash(accessToken)
    const token = await Token.findByAccessToken({access_token, userId})
    if(!token) {
        return false;
    }
    return true;
}

module.exports = {validateAccessToken}