const User = require('../models/User')
const CustomError = require('../errors/index')
const {StatusCodes} = require('http-status-codes')
const {uploadSingleImage, ImageTypeEnum, UserDetails} = require('../utils')

const editProfilePicture = async (req, res) => {
    const {userId} = req.user
    const imagePath = await uploadSingleImage(req, res, userId, ImageTypeEnum.userImage)
    if(!imagePath) {
        throw new CustomError.BadRequestError('Unable to update profile picture.')
    }
    await User.editProfilePicture({profilePicture: imagePath, userId})
    res.status(StatusCodes.OK).json({status: "Success", image: imagePath, msg: "Profile picture updated successfully."})
}

const editUserDetails = async (req, res) => {
    const {userId} = req.user

    if(Object.keys(req.body).length === 0) {
        throw new CustomError.BadRequestError('User details cannot be empty.')
    }

    const user = await User.findUserById({userId})
    if(!user) {
        throw new CustomError.NotFoundError('This user does not exist.')
    }
    await User.editUserDetails({toBeUpdatedFields: req.body, userId})
    res.json({status: "Success", msg: "User details updated successfully."})
}

const getMyDetails = async (req, res) => {
    const {userId} = req.user
    const user = await User.findUserWithDeviceToken({userId, getFrom: UserDetails.fromId})
    if(!user) {
        throw new CustomError.NotFoundError('User not found.')
    }
    res.json({status: "Success", user})
}

const getOtherUserDetails = async (req, res) => {
    const {id: userId} = req.params
    const user = await User.findUserWithDeviceToken({userId, getFrom: UserDetails.fromId})
    if(!user) {
        throw new CustomError.NotFoundError('User not found.')
    }
    res.json({status: "Success", user})
}

const getFollowings = async (req, res) => {
    const {userId} = req.user
    const {order_by} = req.query
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const offset = (page-1) * limit
    const {totalFollowingsCount, followings} = await User.getFollowings({userId, offset, limit, order_by})
    res.status(StatusCodes.OK).json({
        status: "Success",
        count: totalFollowingsCount, 
        page,
        limit,
        followings: !followings ? [] : followings})
}

const getFollowers = async (req, res) => {
    const {userId} = req.user
    const {order_by} = req.query
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const offset = (page-1) * limit
    const {totalFollowersCount, followers} = await User.getFollowers({userId, offset, limit, order_by})
    res.status(StatusCodes.OK).json({
        status: "Success",
        count: totalFollowersCount, 
        page,
        limit,
        followers: !followers ? [] : followers})
}

module.exports = {
    editProfilePicture,
    editUserDetails,
    getMyDetails,
    getOtherUserDetails,
    getFollowings,
    getFollowers
}