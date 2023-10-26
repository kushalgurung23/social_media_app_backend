const { StatusCodes } = require("http-status-codes")
const Chat = require("../models/Chat")

// ALL CONVERSATION WITH DIFFERENT USERS (LOADS ONLY LATEST TEXT)
const getAllConversations = async (req, res) => {
    const userId = req.user.userId

    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const offset = (page -1)*limit

    const {totalConversationCount, conversations} = await Chat.findAll({offset, limit, userId})
    if(!conversations) {
        return res.status(StatusCodes.OK).json({
            status: 'Success',
            count: totalConversationCount,
            page,
            limit,
            conversations: []
        })
    }
    res.status(StatusCodes.OK).json({
        status: 'Success',
        count: totalConversationCount,
        page,
        limit,
        conversations
    })
}

// All CHAT MESSAGES WITH ONE USER (LOADS ALL WITH PAGINATION)
const getOneConversation = async (req, res) => {
    const userId = req.user.userId
    const {id:conversationId} = req.params
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const offset = (page -1) * limit

    const {chat_messages} = await Chat.findOne({userId, conversationId, limit, offset})
    if(!chat_messages) {
        return res.status(StatusCodes.OK).json({
            status: 'Success',
            chat_messages: []
        })
    }
    res.status(StatusCodes.OK).json({
        status: 'Success',
        chat_messages
    })
}

module.exports = {getAllConversations, getOneConversation}