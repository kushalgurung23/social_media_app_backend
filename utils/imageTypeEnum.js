const enumify = require('enumify')

class ImageTypeEnum extends enumify.Enumify {
    static userImage = 'user';
    static postImage = 'post';
}

module.exports = ImageTypeEnum