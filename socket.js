const { Server } = require("socket.io");

let io; // Biến để lưu WebSocket server

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*", // Cấu hình CORS (tùy vào frontend)
    },
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("joinPostRoom", (postId) => {
      console.log(`Client ${socket.id} is trying to join room: ${postId}`);
      socket.join(postId); 
      console.log(`Client ${socket.id} successfully joined room: ${postId}`);

      socket.emit("joinPostRoomSuccess", postId)
    });

    socket.on("bid", (data) => {
      const { postId, amount } = data;
      console.log(`Bid received for post ${postId}: $${amount}`);

      io.to(postId).emit("newBid", {
        amount,
        postId,
      });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
  return io;
}

function getSocketIO() {
  if (!io) {
    throw new Error("Socket.io chưa được khởi tạo!");
  }
  return io;
}

module.exports = { initializeSocket, getSocketIO };
