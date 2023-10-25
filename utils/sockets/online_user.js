 // users object stores user id and socket id
 let onlineUsers = [];

 // Adding new user in the socket
 const addOnlineUser = (userId, socketId) => {
    if (!onlineUsers.some(user => user.userId === userId)) {
      onlineUsers.push({ userId, socketId });
    }
 };

 // Removing user 
 const removeOnlineUser = (socketId) => {
    onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
 }

 // get user id and socket id 
 const getOnlineUser = (userId) => {
   console.log(onlineUsers)
    return onlineUsers.find(onlineUsers => onlineUsers.userId === userId);
 }

 const getAllOnlineUsers = () => {
   console.log(onlineUsers);
    return onlineUsers;
 }

 module.exports = {addOnlineUser, removeOnlineUser, getOnlineUser, getAllOnlineUsers}