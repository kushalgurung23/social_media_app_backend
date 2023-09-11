const enumify = require('enumify')

class ImageTypeEnum extends enumify.Enumify {
    static userImage = 'user';
    static newsPostImage = 'news-post';
}

class UserDetails extends enumify.Enumify {
    static fromId = 'from-id';
    static fromEmail = 'from-email';
    static fromUsername = 'from-username';
}

module.exports = {
    ImageTypeEnum,
    UserDetails
}