const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");
const { Readable } = require("stream");

const app = express();
const server = http.createServer(app);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const io = socketIo(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5500"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// ✅ MongoDB Connection
const mongoURI = "mongodb+srv://ss2362347:T9yeubzvwXTa2XYx@cluster0.m30gg.mongodb.net/chatappdb?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const conn = mongoose.connection;
let gfs;

conn.once("open", () => {
    console.log("✅ MongoDB Connected");
    gfs = new GridFSBucket(conn.db, { bucketName: "file" });
});

// ✅ Multer Setup (File Upload to Memory)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ File Upload Route
app.post("/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    try {
        console.log("Request Body:", req.body);
        console.log("Uploaded File:", req.file);

        // ✅ Create a readable stream from the buffer
        const readableStream = new Readable();
        readableStream.push(req.file.buffer);
        readableStream.push(null);

        // ✅ Upload to MongoDB GridFS
        const uploadStream = gfs.openUploadStream(req.file.originalname);
        readableStream.pipe(uploadStream);

        uploadStream.on("finish", () => {
            console.log("✅ File uploaded successfully:", uploadStream.id);
            const fileUrl = `http://localhost:5013/file/${uploadStream.id}`;
            res.json({ success: true, fileId: uploadStream.id, fileUrl, filename: req.file.originalname });
            
        });

        uploadStream.on("error", (err) => {
            console.error("❌ Upload error:", err);
            res.status(500).json({ error: "Upload failed" });
        });

    } catch (err) {
        console.error("❌ Upload Error:", err);
        res.status(500).json({ error: "Upload failed" });
    }
});


app.get("/file/:id", async (req, res) => {
    try {
        const fileId = new mongoose.Types.ObjectId(req.params.id);
        const downloadStream = gfs.openDownloadStream(fileId);

        res.set("Content-Type", "application/octet-stream");
        downloadStream.pipe(res);
    } catch (error) {
        console.error("❌ File retrieval error:", error);
        res.status(500).json({ error: "File fetch failed" });
    }
});

// ✅ WebSocket for Chat App
let onlineUsers = {};

io.on("connection", (socket) => {
    console.log("✅ A user connected:", socket.id);

    socket.on("joinChat", ({ chatId, userId }) => {
        socket.join(chatId);
        onlineUsers[userId] = socket.id;
        console.log(`📩 User ${userId} joined chat ${chatId}`);
    });

    socket.on("sendMessage", (message) => {
        console.log("📩 Message Received:", message);
        io.to(message.chatId).emit("receiveMessage", message);
    });

    socket.on("userTyping", ({ chatId, userId, isTyping }) => {
        socket.to(chatId).emit("typingStatus", { userId, isTyping });
    });

    socket.on("disconnect", () => {
        console.log("❌ A user disconnected:", socket.id);
        Object.keys(onlineUsers).forEach((userId) => {
            if (onlineUsers[userId] === socket.id) delete onlineUsers[userId];
        });
    });
});

// ✅ Start Server
const PORT = 5013;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
