import React from "react";
import userLogo from "../assets/userlogo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

const Card = ({ name, onClick, unreadCount, onDelete }) => {
    console.log(" Rendering Card Component with Name: ", name);

    return (
        <div
            className="w-[272px] h-16 mx-auto mt-4 flex items-center gap-4 cursor-pointer bg-gray-700 rounded-3xl shadow-2xl shadow-amber-700 p-2"
            onClick={() => {
                console.log("Card Clicked: ", name);
                onClick();
            }}
        >
            <div className="w-[34px] h-[34px]">
                <img
                    src={userLogo}
                    alt="User Profile"
                    className="w-full h-full object-contain rounded-full"
                />
            </div>
            <div>
                <h1 className="text-white text-lg font-semibold">{name || "Unknown"}</h1>
            </div>
            <button
                className="text-red-400 hover:text-red-600 m-auto cursor-pointer"
                onClick={(e) => {
                    e.stopPropagation(); 
                    onDelete();
                }}
            >
                <FontAwesomeIcon icon={faTrash} />
            </button>
            {unreadCount > 0 && (
                <div className="  top-1 right-2 bg-red-500 text-white text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full">
                    {unreadCount}
                </div>
            )}
        </div>
    );
};

export default Card;
