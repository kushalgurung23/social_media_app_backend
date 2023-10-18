const { Server } = require('socket.io');
const chatSocket = require('./chat_socket')
const userSocket = require('./user_socket')

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
          origin: "*"
        }
    });
    userSocket(io)
    chatSocket(io)
}

module.exports = initializeSocket;