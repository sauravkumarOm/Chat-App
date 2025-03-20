import React from "react";
import { Link } from "react-router-dom";
import Logo from "../assets/chatlogo.png"
import userLogo from "../assets/userlogo.png"

const Navbar = () => {
    return (
        <div className=" flex justify-between p-4">
            <div className="w-12 h-12 cursor-pointer">
                <img src={Logo} alt="logo" />
            </div>
            <Link to="/profile"><div className="w-12 h-12 cursor-pointer">
                <img src={userLogo} alt="logo" />
            </div></Link>
        </div>
    )
}

export default Navbar;