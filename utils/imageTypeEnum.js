const enumify = require('enumify')

class ImageTypeEnum extends enumify.Enumify {
    static userImage = 'user';
    static newsPostImage = 'news-post';
}

module.exports = ImageTypeEnum