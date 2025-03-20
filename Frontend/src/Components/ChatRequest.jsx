import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, query, onSnapshot, doc, deleteDoc, addDoc, getDoc, setDoc } from "firebase/firestore";

const ChatRequests = () => {
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(collection(db, "users", user.uid, "requests"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newRequests = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setRequests(newRequests);
        });

        return () => unsubscribe();
    }, []);

    const handleAccept = async (requestId, senderUid, senderName) => {
        const user = auth.currentUser;
        if (!user) return;
    
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            const receiverName = userDoc.exists() ? userDoc.data().name : "Unknown";
    
            let updatedSenderName = senderName;
            if (!updatedSenderName) {
                const senderDoc = await getDoc(doc(db, "users", senderUid));
                updatedSenderName = senderDoc.exists() ? senderDoc.data().name : "Unknown";
            }
    
            const chatRef = await addDoc(collection(db, "chats"), {
                users: [user.uid, senderUid],
                userNames: {
                    [user.uid]: receiverName,
                    [senderUid]: updatedSenderName,
                },
                timestamp: new Date(),
            });
    
            await setDoc(doc(db, "users", user.uid, "chats", chatRef.id), {
                chatId: chatRef.id,
                otherUserId: senderUid,
                otherUserName: updatedSenderName,  
            });
    
            await setDoc(doc(db, "users", senderUid, "chats", chatRef.id), {
                chatId: chatRef.id,
                otherUserId: user.uid,
                otherUserName: receiverName,  
            });
    
            await deleteDoc(doc(db, "users", user.uid, "requests", requestId));
    
        } catch (error) {
            console.error(" Error accepting request:", error);
        }
    };
    
    
    


    const handleReject = async (requestId) => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            await deleteDoc(doc(db, "users", user.uid, "requests", requestId));
            console.log("Chat request rejected");
        } catch (error) {
            console.error("Error rejecting request:", error);
        }
    };




    return (
        <div className="bg-white p-4 rounded-lg shadow-md w-80">
            <h2 className="text-lg font-semibold mb-2">Chat Requests</h2>
            {requests.length === 0 ? (
                <p className="text-gray-500">No chat requests.</p>
            ) : (
                requests.map((request) => (
                    <div key={request.id} className="flex justify-between items-center bg-gray-100 p-3 mb-2 rounded-md">
                        <p>{request.senderName} wants to chat</p>
                        <div className="flex gap-2">
                            <button
                                className="bg-green-500 text-white px-2 py-1 rounded-md hover:bg-green-600"
                                onClick={() => handleAccept(request.id, request.senderUid)}
                            >
                                Accept
                            </button>
                            <button
                                className="bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-600"
                                onClick={() => handleReject(request.id)}
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default ChatRequests;
