import React, { useState } from "react";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth, db } from "../firebase";
import { v4 as uuidv4 } from "uuid";

const SignUp = ({ toggleForm }) => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
            const authInstance = getAuth();
            const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
            const user = userCredential.user;

            // Update user profile with name
            await updateProfile(user, { displayName: name });

            // Generate a unique public code
            const publicCode = uuidv4().split("-")[0];

            // Store user details in Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name,
                email,
                publicCode,
                createdAt: new Date(),
            });

            setSuccess("Account created successfully! You can now log in.");
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full">
            <h2 className="text-2xl font-semibold text-center mb-4">Sign Up</h2>
            {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
            {success && <p className="text-green-500 text-sm text-center mb-4">{success}</p>}
            <form onSubmit={handleSignUp}>
                <div className="mb-4">
                    <label className="block text-gray-700">Name</label>
                    <input
                        type="text"
                        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-400"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700">Email</label>
                    <input
                        type="email"
                        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-400"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700">Password</label>
                    <input
                        type="password"
                        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-400"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-red-500 text-white p-2 rounded-md hover:bg-red-600 transition cursor-pointer"
                >
                    Sign Up
                </button>
                <p className="text-center text-sm text-gray-600 mt-4">
                    Already have an account?{" "}
                    <span onClick={toggleForm} className="text-blue-500 cursor-pointer">Login</span>
                </p>
            </form>
        </div>
    );
};

export default SignUp;
