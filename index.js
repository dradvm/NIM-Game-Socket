const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Cho phép tất cả client kết nối
    },
});

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Xử lý khi người dùng gửi dữ liệu
    socket.on("sendMove", (data) => {
        console.log("Move received:", data);
        socket.broadcast.emit("receiveMove", data); // Gửi move đến người chơi còn lại
    });

    // Xử lý khi người dùng ngắt kết nối
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

server.listen(3001, () => {
    console.log("Server is running on port 3001");
});
