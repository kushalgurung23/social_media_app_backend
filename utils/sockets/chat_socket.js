const axios = require('axios').default;
const Chat = require('../../models/Chat');
const {validateAccessToken} = require('../validate_access_token');
const {getOnlineUser} = require('./online_user')
const {formatUtcTime} = require('../current_date_time')

const chatSocket = (io) => {
    io.on('connection', (socket) => {
        // send and get message
        socket.on('sendMessage', async ({ 
            sender, receiver, text, has_receiver_seen, 
            conversation_id, access_token, sent_at_utc
        }) => {
            const isValid = await validateAccessToken({accessToken: access_token})
            if(!isValid) {
                return {
                    'status': 'Error',
                    'msg': 'Token is invalid'
                }
            }

            const createdAtUtc = formatUtcTime({utcDate: new Date(sent_at_utc)})

            const chat = new Chat({
                text: text,
                sender: sender,
                receiver: receiver,
                has_receiver_seen: has_receiver_seen,
                created_at_utc: createdAtUtc,
                updated_at_utc: createdAtUtc,
                conversationId: conversation_id
            })
            const {status, chatId} = await chat.continueConversation();
            console.log("STTATUS IS", status);
            if(!status) {
                return {
                    'status': 'Error',
                    'msg': 'Error occured while saving chat message.'
                }
            }

            const senderUser = getOnlineUser(sender);
            const receivingUser = getOnlineUser(receiver);

            // messageText object will be emitted to chatting users
            const messageText = {
                status: 'Success',
                chat: {
                    id: chatId,
                    text,
                    sender: {
                        id: sender
                    },
                    receiver: {
                        id: receiver
                    },
                    created_at: sent_at_utc,
                    updated_at: sent_at_utc,
                    has_receiver_seen
                }
            }
            console.log(messageText);
            if (senderUser !== undefined) {
                io.to(senderUser.socketId).emit("getMessageForSender", messageText);
            }
            if (receivingUser !== undefined) {
                io.to(receivingUser.socketId).emit("getMessageForReceiver", messageText);
            }
        });
    })
}

module.exports = chatSocket