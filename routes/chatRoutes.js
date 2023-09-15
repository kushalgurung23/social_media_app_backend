const express = require('express')
const router = express.Router()

const {getAllConversations, getOneConversation} = require('../controllers/chatControllers')

router.route('/').get(getAllConversations)
router.route('/:id').get(getOneConversation)

module.exports = router
