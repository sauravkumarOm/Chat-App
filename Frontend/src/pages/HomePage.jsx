import React, { useEffect, useState } from "react";
import Navbar from "../Components/Navbar";
import Card from "../Components/Card";
import ChatPage from "../Components/ChatPage";
import ChatRequests from "../Components/ChatRequest";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, addDoc, doc, getDoc, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";
import Loader01 from "../Loaders/Loader01";

const HomePage = () => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [publicCode, setPublicCode] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [chatUsers, setChatUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedChat, setSelectedChat] = useState(null);
    const [unreadCount, setUnreadCount] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            if (user) {
                fetchChatUsers(user.uid);
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const fetchChatUsers = (userId) => {
        const q = query(collection(db, "users", userId, "chats"));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const chats = [];
            const unreadData = {}; // 🔥 Track unread messages for each chat

            for (const docSnapshot of snapshot.docs) {
                const chatData = docSnapshot.data();
                const chatId = docSnapshot.id;
                const chatPartnerId = chatData.otherUserId;
                const chatPartnerName = chatData.otherUserName || "Unknown";

                // 🔥 Fetch unread messages count
                const messagesQuery = query(collection(db, "chats", chatId, "messages"));
                const messagesSnapshot = await getDocs(messagesQuery);
                const unreadCount = messagesSnapshot.docs.filter(msg => !msg.data().read).length;

                unreadData[chatId] = unreadCount;

                chats.push({
                    id: chatId,
                    chatId,
                    chatPartnerId,
                    chatPartnerName,
                });
            }
            chats.sort((a, b) => (unreadData[b.chatId] || 0) - (unreadData[a.chatId] || 0));
            setLoading(false);
            setChatUsers(chats);
            setUnreadCount(unreadData);
        });

        return () => unsubscribe();
    };

    const markMessagesAsRead = async (chatId) => {
        const messagesRef = collection(db, "chats", chatId, "messages");
        const messagesSnapshot = await getDocs(messagesRef);

        messagesSnapshot.docs.forEach(async (msgDoc) => {
            const msgRef = doc(db, "chats", chatId, "messages", msgDoc.id);
            await setDoc(msgRef, { read: true }, { merge: true });
        });

        setUnreadCount((prev) => ({ ...prev, [chatId]: 0 }));
    };

    const handleChatSelection = (user) => {
        console.log(" Clicked User:", user);
        if (!user || !user.chatId) {
            console.log(" Error: Selected user is undefined or missing chatId");
            return;
        }
        markMessagesAsRead(user.chatId);
        setSelectedChat(user);
        console.log("✅ Updated selectedChat:", user);
    };


    const handleSubmit = async () => {
        setError("");
        setSuccess("");

        if (!publicCode) {
            setError("Please enter a valid public code.");
            return;
        }

        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("publicCode", "==", publicCode));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError("User not found!");
                return;
            }

            const receiverDoc = querySnapshot.docs[0];
            const receiverData = receiverDoc.data();
            const receiverUid = receiverDoc.id;

            const sender = auth.currentUser;
            if (!sender) {
                setError("You need to be logged in to send a request.");
                return;
            }

            const senderDoc = await getDoc(doc(db, "users", sender.uid));
            const senderName = senderDoc.exists() ? senderDoc.data().name : "Unknown User";

            const chatCheckQuery = query(collection(db, "users", sender.uid, "chats"), where("otherUserId", "==", receiverUid));
            const chatCheckSnapshot = await getDocs(chatCheckQuery);

            if (!chatCheckSnapshot.empty) {
                setError("Chat already exists!");
                return;
            }

            await addDoc(collection(db, "users", receiverUid, "requests"), {
                senderUid: sender.uid,
                senderName: senderName,
                status: "pending",
                timestamp: new Date(),
            });

            setSuccess("Chat request sent successfully!");
            setIsFormOpen(false);
        } catch (error) {
            console.error("Error sending request:", error);

            setError("Failed to send request.");
        }
    };

    const handleDeleteChat = async (chatId) => {
        if (!currentUser) return;

        try {
            await deleteDoc(doc(db, "users", currentUser.uid, "chats", chatId));

            const chatDoc = await getDoc(doc(db, "chats", chatId));
            if (chatDoc.exists()) {
                const otherUserId = chatDoc.data().users.find((id) => id !== currentUser.uid);
                if (otherUserId) {
                    await deleteDoc(doc(db, "users", otherUserId, "chats", chatId));
                }
            }
            await deleteDoc(doc(db, "chats", chatId));

            setChatUsers((prevChats) => prevChats.filter((chat) => chat.chatId !== chatId));

            console.log("✅ Chat deleted successfully:", chatId);
        } catch (error) {
            console.error("❌ Error deleting chat:", error);
        }
    };


    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader01 />
            </div>
        );
    }

    return (
        <div className="relative min-h-screen w-screen canvas">
            <div className="p-5 mt-2 flex flex-row gap-20">
                <div className="bg-white h-[43rem] w-72 rounded-2xl pb-5">
                    <Navbar />
                    <div className="w-72 h-0.5 bg-black"></div>
                    <div
                        className="w-72 h-12 right-2 flex text-5xl cursor-pointer mt-4"
                        onClick={() => setIsFormOpen(true)}
                    >
                        <div className="w-72 flex justify-end mr-3.5">+</div>
                    </div>
                    {chatUsers.length > 0 ? (
                        chatUsers.map((user) => {
                            console.log(" Passing to Card Component:", user.chatPartnerName);
                            return <Card key={user.id} name={user.chatPartnerName} unreadCount={unreadCount[user.chatId]} onClick={() => handleChatSelection(user)} onDelete={() => { handleDeleteChat(user.chatId) }} />;
                        })
                    ) : (
                        <p className="text-center mt-4 text-gray-600">No active chats</p>
                    )}

                </div>

                {/* Chat Section */}
                <ChatPage selectedChat={selectedChat} />
                <ChatRequests />

                {/* Popup Form for Entering Public Code */}
                {isFormOpen && (
                    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-md bg-black/30">
                        <div className="bg-white p-6 rounded-xl shadow-lg w-96">
                            <h2 className="text-xl font-semibold mb-4 text-center">Enter Public Code</h2>
                            <input
                                type="text"
                                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                                placeholder="Enter Public Code"
                                value={publicCode}
                                onChange={(e) => setPublicCode(e.target.value)}
                            />
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                            {success && <p className="text-green-500 text-sm text-center">{success}</p>}
                            <div className="flex justify-between mt-4">
                                <button
                                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                                    onClick={handleSubmit}
                                >
                                    Submit
                                </button>
                                <button
                                    className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500"
                                    onClick={() => setIsFormOpen(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomePage;
