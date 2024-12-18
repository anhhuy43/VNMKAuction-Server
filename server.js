// const express = require('express');
// const app = express();
// const path = require('path'); 
// const methodOverride = require('method-override');
// const morgan = require('morgan');
// const cookieParser = require('cookie-parser');
// const port = 3000
// const cors = require('cors');
// const db = require('./config/db')
// const Post = require("./app/models/Post");
// const route = require("./routes");

// db.connect()

// app.use(cors()); 

// // Middleware phục vụ các file tĩnh trong thư mục 'uploads'
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use(
//   express.urlencoded({
//     extended: true,
//   })
// );
// app.use(express.json())
// app.use(methodOverride("_method"));
// app.use(morgan("combined"));
// app.use(cookieParser());

// route(app)

// app.listen(port, () => {
//   console.log(Example app listening on port ${port})
// })

// part 2

// const express = require("express");
// const app = express();
// const http = require("http");
// const { Server } = require("socket.io");
// const jwt = require("jsonwebtoken");
// const path = require("path");
// const methodOverride = require("method-override");
// const morgan = require("morgan");
// const cookieParser = require("cookie-parser");
// const port = 3000;
// const cors = require("cors");
// const db = require("./config/db");
// const Post = require("./app/models/Post");
// const route = require("./routes");
// const authConstant = require("./constants/authConstant");

// // Tạo server HTTP
// const server = http.createServer(app);

// // Khởi tạo socket.io
// const io = new Server(server, {
//   cors: {
//     origin: "*", // Cho phép mọi domain (có thể cấu hình cụ thể hơn)
//     methods: ["GET", "POST"],
//   },
// });

// module.exports = io;

// db.connect();

// app.use(cors());
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());
// app.use(methodOverride("_method"));
// app.use(morgan("combined"));
// app.use(cookieParser());

// // Gọi các route
// route(app);

// // Middleware xác thực token cho socket.io
// io.use((socket, next) => {
//   const token = socket.handshake.auth.token;
//   if (!token) {
//     return next(new Error("Authentication error"));
//   }

//   try {
//     // Giải mã và xác thực token
//     const user = jwt.verify(token, authConstant.JWT_SECRET_KEY);
//     socket.user = user;
//     next();
//   } catch (err) {
//     next(new Error("Authentication error"));
//   }
// });

// // Sự kiện kết nối WebSocket
// io.on("connection", (socket) => {
//   console.log("⚡ A user connected:", socket.id);

//   // Lắng nghe sự kiện join room từ client
//   socket.on("joinPostRoom", (postId) => {
//     socket.join(`postRoom:${postId}`);
//     console.log(`📌 User ${socket.id} joined postRoom:${postId}`);
//   });

//   // Lắng nghe sự kiện rời room
//   socket.on("leavePostRoom", (postId) => {
//     socket.leave(`postRoom:${postId}`);
//     console.log(`📤 User ${socket.id} left postRoom:${postId}`);
//   });

//   // Xử lý khi client gửi bid mới
//   socket.on("placeBid", async ({ postId, bidAmount, userId }) => {
//     console.log("📤 Received bid:", { postId, bidAmount, userId });

//     try {
//       // Tìm bài post
//       const post = await Post.findById(postId);
//       if (!post) {
//         socket.emit("error", { message: "Post not found" });
//         return;
//       }

//       // Kiểm tra nếu bidAmount hợp lệ
//       if (post.topBid && bidAmount <= post.topBid) {
//         socket.emit("error", {
//           message: "Bid must be higher than current top bid",
//         });
//         return;
//       }

//       // Cập nhật giá bid cao nhất
//       post.topBid = bidAmount;
//       post.highestBidder = userId; // Giả sử userId được truyền từ client
//       await post.save();

//       // Gửi cập nhật đến tất cả client trong room của bài post
//       io.to(`postRoom:${postId}`).emit("postUpdate", {
//         postId,
//         topBid: bidAmount,
//         highestBidder: userId,
//       });

//       console.log("✅ Updated top bid:", bidAmount);
//     } catch (error) {
//       console.error("Error handling bid:", error);
//       socket.emit("error", { message: "Error handling bid" });
//     }
//   });

//   // Sự kiện ngắt kết nối
//   socket.on("disconnect", () => {
//     console.log("❌ A user disconnected:", socket.id);
//   });
// });

// // Lắng nghe yêu cầu trên cổng 3000
// server.listen(port, () => {
//   console.log(`⚡ Server running on http://localhost:${port}`);
// });


const express = require('express');
const app = express();
const path = require('path');
const methodOverride = require('method-override');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const http = require('http');
const cors = require('cors');
const db = require('./config/db');
const route = require('./routes');
const { initializeSocket } = require('./socket'); 

const port = 3000;

// Kết nối database
db.connect();

// Middleware
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.json());
app.use(methodOverride('_method'));
app.use(morgan('combined'));
app.use(cookieParser());

// Routes
route(app);

// Tạo HTTP server
const server = http.createServer(app);

// Khởi tạo WebSocket server
initializeSocket(server);

// Khởi động server
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
