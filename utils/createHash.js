const crypto = require('crypto')

const hashString = (string) => crypto.createHash('md5').update(string.toString()).digest('hex')

module.exports = hashString