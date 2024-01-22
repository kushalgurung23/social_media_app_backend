const express = require('express')
const { getAllPromotions } = require('../controllers/promotionControllers')
const router = express.Router()

router.route('/').get(getAllPromotions)

module.exports = router