import React, { useEffect, useState, useRef } from "react";
import { auth, db } from "../firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { io } from "socket.io-client";

const socket = io("https://localhost:5013");

const ChatPage = ({ selectedChat }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const currentUser = auth.currentUser;
    const messagesEndRef = useRef(null); 


    useEffect(() => {
        if (!selectedChat || !selectedChat.chatId) {
            console.log(" No chat selected yet.");
            return;
        }

        console.log(" Fetching messages for chatId:", selectedChat.chatId);

        const messagesRef = collection(db, "chats", selectedChat.chatId, "messages");
        const q = query(messagesRef, orderBy("timestamp", "asc"));

        const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
            const fetchedMessages = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            console.log(" Firestore Messages:", fetchedMessages);

            setMessages(fetchedMessages);
        });

        socket.on("receiveMessage", (message) => {
            console.log(" WebSocket New Message:", message);

            setMessages((prevMessages) => {
                if (!prevMessages.some((msg) => msg.id === message.id)) {
                    return [...prevMessages, message];
                }
                return prevMessages;
            });
        });

        return () => {
            unsubscribeFirestore();
            socket.off("receiveMessage");
        };
    }, [selectedChat]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedChat) {
            console.log("⚠️ Cannot send message, no chat selected.");
            return;
        }

        const messageData = {
            senderId: currentUser.uid,
            senderName: currentUser.displayName || "You",
            text: newMessage.trim(),
            chatId: selectedChat.chatId,
            timestamp: serverTimestamp(),
        };

        console.log(" Sending message:", messageData);
        const docRef = await addDoc(collection(db, "chats", selectedChat.chatId, "messages"), messageData);

        socket.emit("sendMessage", { ...messageData, id: docRef.id });

        setNewMessage("");
    };

    const handleKeyPress = (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="bg-gray-100 w-[70rem] h-[43rem] rounded-3xl p-4 flex flex-col shadow-lg">
            {!selectedChat ? (
                <div className="text-center text-gray-500 flex-grow flex items-center justify-center text-lg">
                    Select a chat to start messaging
                </div>
            ) : (
                <>
                    {/*  Chat Header */}
                    <h2 className="text-2xl font-semibold mb-4 text-center text-gray-800">
                        Chat with {selectedChat.chatPartnerName}
                    </h2>

                    {/*  Messages Container */}
                    <div className="flex-grow overflow-y-auto px-4 py-2 space-y-2">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex w-full ${
                                    msg.senderId === currentUser.uid ? "justify-end" : "justify-start"
                                }`}
                            >
                                <div
                                    className={`px-4 py-2 rounded-lg shadow-md text-black ${
                                        msg.senderId === currentUser.uid
                                            ? "bg-green-500 text-black self-end rounded-br-none"
                                            : "bg-blue-500 text-black self-start rounded-bl-none"
                                    }`}
                                    style={{ maxWidth: "75%" }} 
                                >
                                    <strong className="text-sm block text-black-200">
                                        {msg.senderId === currentUser.uid ? "You" : msg.senderName}
                                    </strong>
                                    <p className="text-md">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} /> 
                    </div>

                    {/*  Input & Send Button */}
                    <div className="flex mt-4 bg-white p-3 rounded-lg shadow-sm">
                        <input
                            type="text"
                            className="flex-grow border p-3 rounded-lg outline-none text-gray-700 focus:ring-2 focus:ring-blue-400"
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyPress}
                        />
                        <button
                            className="bg-blue-500 text-black px-5 py-2 ml-3 rounded-lg hover:bg-blue-600 transition"
                            onClick={handleSendMessage}
                        >
                            Send
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ChatPage;
