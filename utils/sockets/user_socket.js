const {addOnlineUser, removeOnlineUser, getAllOnlineUsers} = require('./online_user')
const userSocket = (io) => {

    io.on('connection', (socket) => {
        // when connect
        // userId is received from frontend
        socket.on("addUser", (userId) => {
          addOnlineUser(userId, socket.id);
          io.emit("getUsers", getAllOnlineUsers());
        });
    
        // when disconnect
        socket.on("disconnect", () => {
          removeOnlineUser(socket.id);
          io.emit("getUsers", getAllOnlineUsers());
        });
    });
}

module.exports = userSocket