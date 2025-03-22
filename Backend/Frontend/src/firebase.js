import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyA2Jgrf76jC9aVbhuFs2l2cs9T0cNTSkrk",
  authDomain: "chat-app-60fb9.firebaseapp.com",
  projectId: "chat-app-60fb9",
  storageBucket: "chat-app-60fb9.firebasestorage.app",
  messagingSenderId: "630548682032",
  appId: "1:630548682032:web:d745645f4324470ef9a4f5",
  measurementId: "G-5HCB7TK5V4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

export { app, auth, db, rtdb };


