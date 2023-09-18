const { Server } = require('socket.io');
const axios = require('axios').default;

// users object stores user id and socket id
let users = [];

// Adding new user in the socket
const addUser = (userId, socketId) => {
  !users.some(user => user.userId === userId) && users.push({ userId, socketId });
};

// Removing user 
const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
}

// get user id and socket id 
const getUser = (userId) => {
  return users.find(user => user.userId === userId);
}

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*"
    }
  });

  io.on('connection', (socket) => {
    console.log("A new user has logged in.");
    // when connect
    socket.on("addUser", (userId) => {
      addUser(userId, socket.id);
      io.emit("getUsers", users);
    });

    // send and get message
    socket.on('sendMessage', async ({ senderId, receiverUserId, message, conversationId, jwt }) => {
      const senderUser = getUser(senderId);
      const receivingUser = getUser(receiverUserId);

      const currentDateTime = Date.now();
      // strapiData object will be passed to strapi
      let strapiChatMessageData = {
        data: {
          sender: senderId,
          receiver: receiverUserId,
          text: message,
          conversation: conversationId,
          createdAt: currentDateTime,
        }
      }

      let strapiConversationData = {
        data: {
          last_text_at: Date.now(),
        }
      }

      // messageText object will be emitted to chatting users
      const messageText = {
        senderId: senderId,
        receiverUserId: receiverUserId,
        message: message,
        sentAt: currentDateTime,
        conversationId: conversationId,
      }

      try {
        // Add new message in chat message collection type
        await axios.post("http://192.168.30.125:1337/api/chat-messages", strapiChatMessageData, {
          headers: {
            'Authorization': `Bearer ${jwt}`
          }
        });

        // updating time in conversation collection type
        await axios.put("http://192.168.30.125:1337/api/conversations/" + conversationId, strapiConversationData, {
          headers: {
            'Authorization': `Bearer ${jwt}`
          }
        });

        if (senderUser !== undefined) {
          io.to(senderUser.socketId).emit("getMessageForSender", messageText);
        }
        if (receivingUser !== undefined) {
          io.to(receivingUser.socketId).emit("getMessageForReceiver", messageText);
        }
      }
      catch (e) {
        console.log(e);
      }
    });

    // when disconnect
    socket.on("disconnect", () => {
      removeUser(socket.id);
      io.emit("getUsers", users);
    });
  });
};

module.exports = initializeSocket;