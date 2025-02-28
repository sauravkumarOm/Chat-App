import React, { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import ProfileImage from "../assets/userlogo.png";
import Loader01 from "../Loaders/Loader01";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

const Profile = () => {
    const [name, setName] = useState("");
    const [publicCode, setPublicCode] = useState("");
    const [loading, setLoading] = useState(true);
    const [copySuccess, setCopySuccess] = useState(false);
    const navigate = useNavigate();
    const canvasRef = useRef(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userDocRef = doc(db, "users", user.uid);
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists()) {
                        setName(userDocSnap.data().name || "Unknown");
                        setPublicCode(userDocSnap.data().publicCode || "Not set");
                    } else {
                        console.log("No such document in Firestore!");
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            } else {
                console.log("User is not logged in");
                setName("Not logged in");
                setPublicCode("");
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(publicCode).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        }).catch((err) => {
            console.log("Copy failed", err);
        });
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            console.log("👋 User logged out successfully");
            navigate("/");
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    if (loading) {
        return <Loader01 />;
    }

    return (
        <div className="min-h-screen flex justify-center relative">

            <div className="bg-white w-[41rem] h-[41rem] m-auto shadow-2xl rounded-4xl flex flex-col items-center p-6">
                <img src={ProfileImage} alt="Profile" className="w-32 h-32 mb-4" />
                <div className="text-2xl text-center">
                    <h2 className="text-xl font-semibold text-center">Name: {name}</h2>
                    <div className="flex items-center justify-center gap-2">
                        <h3 className="text-gray-600 text-center">Public Code: {publicCode}</h3>
                        <FontAwesomeIcon
                            icon={faCopy}
                            className="text-gray-500 cursor-pointer hover:text-gray-700 transition"
                            onClick={handleCopy}
                        />
                    </div>
                    {copySuccess && <p className="text-green-500 text-sm mt-2">Copied to clipboard!</p>}
                </div>
                <button
                    onClick={handleLogout}
                    className="mt-6 bg-red-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-600 transition cursor-pointer"
                >
                    <FontAwesomeIcon icon={faSignOutAlt} /> Logout
                </button>
            </div>
        </div>
    );
};

export default Profile;
