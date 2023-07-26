const jwt = require('jsonwebtoken');
const enumify = require('enumify')

class TokenType extends enumify.Enumify {
    static ACCESSTOKEN = 'accessToken';
    static REFRESHTOKEN = 'refreshToken';
}

const isTokenValid = (token) => jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if(err) {
        return false
    }
    else {
        return decoded
    }
});

const createJWT = ({payload, tokenType}) => {
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        
        expiresIn: tokenType === TokenType.ACCESSTOKEN ? process.env.JWT_ACCESS_TOKEN_LIFETIME :
        process.env.JWT_REFRESH_TOKEN_LIFETIME
    });
    return token;
}

module.exports = {
    isTokenValid,
    createJWT,
    TokenType
}