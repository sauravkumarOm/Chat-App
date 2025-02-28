const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

let onlineUsers = {};

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // User joins a chat room
    socket.on("joinChat", ({ chatId, userId }) => {
        socket.join(chatId);
        onlineUsers[userId] = socket.id;
        console.log(` User ${userId} joined chat ${chatId}`);
    });

    socket.on("sendMessage", (message) => {
        console.log(" Message Received:", message);
        io.to(message.chatId).emit("receiveMessage", message); 
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected:", socket.id);
        Object.keys(onlineUsers).forEach((userId) => {
            if (onlineUsers[userId] === socket.id) delete onlineUsers[userId];
        });
    });
});

server.listen(5013, () => {
    console.log(" WebSocket Server running on port 5013");
});
