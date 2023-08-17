const { StatusCodes } = require("http-status-codes")
const Services = require("../models/Services")
const CustomError = require("../errors/index")

const getAllServices = async (req, res) => {
    const {userId} = req.user
    const {search, order_by} = req.query
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const offset = (page -1) * limit

    const {totalServicesCount, services} = await Services.findAll({
        offset, limit, search, order_by, userId
    })
    if(!services) {
        return res.status(StatusCodes.OK).json({
            status: "Success",
            page,
            limit,
            count: totalServicesCount,
            services: []
        })
    }
    res.status(StatusCodes.OK).json({
        status: "Success",
        page,
        limit,
        count: totalServicesCount,
        services
    })
}

const getServiceById = async (req, res) => {
    const {userId} = req.user
    const {id:serviceId} = req.params
    const service = await Services.getOneService({serviceId, userId})
    if(!service) {
        throw new CustomError.NotFoundError(`Service of id: ${serviceId} does not exists.`)
    }
    res.status(StatusCodes.OK).json({
        status: "Success",
        service
    })
}

const toggleServiceSave = async (req, res) => {
    const {userId} = req.user
    const {service_id: serviceId} = req.body
    if(!serviceId) {
        throw new CustomError.BadRequestError('Please provide service_id.')
    }
    const service = await Services.checkById(serviceId)
    if(!service) {
        throw new CustomError.NotFoundError(`Service with id: ${serviceId} does not exists.`)
    }
    await Services.toggleServiceSave({serviceId, userId})
    res.status(StatusCodes.OK).json({
        status: "Success",
        msg: "Service save is toggled successfully."
    })
}

module.exports = {
    getAllServices,
    getServiceById,
    toggleServiceSave
}