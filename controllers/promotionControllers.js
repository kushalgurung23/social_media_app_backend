const { StatusCodes } = require("http-status-codes")
const Promotions = require("../models/Promotions")

const getAllPromotions = async (req, res) => {

    const {order_by} = req.query
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const offset = (page -1) * limit

    const {totalPromotionsCount, promotions} = await Promotions.findAll({
        offset, limit, order_by
    })
    res.status(StatusCodes.OK).json({
        status: "Success",
        page,
        limit,
        count: totalPromotionsCount,
        promotions: !promotions ? [] : promotions
    })
}

module.exports = {getAllPromotions}