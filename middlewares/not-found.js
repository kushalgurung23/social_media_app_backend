const {StatusCodes} = require('http-status-codes')

const notFound = (req, res) => res.status(StatusCodes.NOT_FOUND).json({Status: "Error", msg: 'Route does not exist'})

module.exports = notFound
