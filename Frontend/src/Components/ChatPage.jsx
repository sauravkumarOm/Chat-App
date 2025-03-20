import React, { useEffect, useState, useRef } from "react";
import { auth, db } from "../firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { io } from "socket.io-client";

const socket = io("http://localhost:5013");

const ChatPage = ({ selectedChat }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [typingUser, setTypingUser] = useState(null);
    const currentUser = auth.currentUser;
    const [videoPreviews, setVideoPreviews] = useState({});
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!selectedChat?.chatId) return;
        console.log("Fetching messages for chatId:", selectedChat.chatId);

        const messagesRef = collection(db, "chats", selectedChat.chatId, "messages");
        const q = query(messagesRef, orderBy("timestamp", "asc"));

        const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
            setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        });

        socket.on("receiveMessage", (message) => {
            setMessages((prevMessages) => {
                if (!prevMessages.some((msg) => msg.id === message.id)) {
                    return [...prevMessages, message];
                }
                return prevMessages;
            });
        });

        socket.on("typingStatus", ({ userId, isTyping }) => {
            setTypingUser(isTyping && userId !== currentUser?.uid ? "User is typing..." : null);
        });

        return () => {
            unsubscribeFirestore();
            socket.off("receiveMessage");
            socket.off("typingStatus");
        };
    }, [selectedChat]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMediaMessage = async (file) => {
        if (!file || !selectedChat) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("chatId", selectedChat.chatId);
        formData.append("senderId", currentUser.uid);
        formData.append("senderName", currentUser.displayName || "You");

        try {
            const response = await fetch("http://localhost:5013/upload", { method: "POST", body: formData });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Upload failed");

            const messageData = {
                senderId: currentUser.uid,
                senderName: currentUser.displayName || "You",
                text: "",
                mediaUrl: data.fileUrl,
                mediaType: file.type.startsWith("image") ? "image" : "video",
                chatId: selectedChat.chatId,
                timestamp: serverTimestamp(),
            };

            const docRef = await addDoc(collection(db, "chats", selectedChat.chatId, "messages"), messageData);

            socket.emit("sendMessage", { ...messageData, id: docRef.id });
        } catch (error) {
            console.error("Upload failed:", error);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedChat) return;

        const messageData = {
            senderId: currentUser.uid,
            senderName: currentUser.displayName || "You",
            text: newMessage.trim(),
            mediaUrl: "",
            mediaType: "",
            chatId: selectedChat.chatId,
            timestamp: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, "chats", selectedChat.chatId, "messages"), messageData);
        socket.emit("sendMessage", { ...messageData, id: docRef.id });
        setNewMessage("");
        socket.emit("userTyping", { chatId: selectedChat.chatId, userId: currentUser.uid, isTyping: false });
    };

    return (
        <div className="bg-gray-100 w-[70rem] h-[43rem] rounded-3xl p-4 flex flex-col shadow-lg">
            {!selectedChat ? (
                <div className="text-center text-gray-500 flex-grow flex items-center justify-center text-lg">
                    Select a chat to start messaging
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold text-gray-800">
                            Chat with {selectedChat.chatPartnerName}
                        </h2>
                    </div>

                    <div className="flex-grow overflow-y-auto px-4 py-2 space-y-4">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex w-full ${msg.senderId === currentUser.uid ? "justify-end" : "justify-start"}`}>
                                <div className={`px-4 py-2 rounded-lg shadow-md text-black max-w-xs ${msg.senderId === currentUser.uid ? "bg-green-500 text-white self-end rounded-br-none" : "bg-blue-500 text-white self-start rounded-bl-none"}`}>
                                    <strong className="text-sm block">{msg.senderId === currentUser.uid ? "You" : msg.senderName}</strong>
                                    {msg.mediaType === "image" && <img src={msg.mediaUrl} alt="Sent" className="mt-2 rounded-lg shadow-md max-w-[200px]" />}
                                    {msg.mediaType === "video" && (<div className="mt-2">
                                        {!videoPreviews[msg.id] ? (
                                            <button onClick={() => setVideoPreviews(prev => ({ ...prev, [msg.id]: true }))} className="bg-gray-700 text-white px-3 py-1 rounded">Play Video</button>
                                        ) : (
                                            <video controls className="rounded-lg shadow-md max-w-[200px]">
                                                <source src={msg.mediaUrl} type="video/mp4" />
                                            </video>
                                        )}
                                    </div>)}
                                    {msg.mediaType == "audio" && <audio className="mt-2 w-full"><source src={msg.mediaUrl} type="audio/mpeg" /></audio>}
                                    {msg.text && <p className="text-md mt-1">{msg.text}</p>}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="flex items-center gap-2 bg-white p-3 rounded-lg shadow-sm">
                        <label className="cursor-pointer bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300">
                            📎
                            <input type="file" className="hidden" accept="image/*,video/*" onChange={(e) => handleSendMediaMessage(e.target.files[0])} />
                        </label>
                        <input type="text" className="flex-grow border p-3 rounded-lg outline-none text-gray-700 focus:ring-2 focus:ring-blue-400" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                        <button className="bg-blue-500 text-white px-5 py-2 rounded-lg hover:bg-blue-600 transition" onClick={handleSendMessage}>Send</button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ChatPage;
