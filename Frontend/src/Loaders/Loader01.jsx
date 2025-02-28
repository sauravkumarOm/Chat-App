import React from "react";
import "./Loader01.css";

const Loader01 = () => {
    return (
        <div className="loader-container">
            <svg className="hourglass" viewBox="0 0 56 56" width="56px" height="56px" role="img" aria-label="Loading...">
                <g transform="translate(2,2)">
                    <g fill="none" stroke="hsl(0,0%,100%)" stroke-dasharray="153.94 153.94" stroke-dashoffset="153.94" stroke-linecap="round" transform="rotate(-90,26,26)">
                        <circle className="hourglass__motion-thick" strokeWidth="2.5" cx="26" cy="26" r="24.5" transform="rotate(0,26,26)" />
                        <circle className="hourglass__motion-medium" strokeWidth="1.75" cx="26" cy="26" r="24.5" transform="rotate(90,26,26)" />
                        <circle className="hourglass__motion-thin" strokeWidth="1" cx="26" cy="26" r="24.5" transform="rotate(180,26,26)" />
                    </g>
                    <g className="hourglass__model" transform="translate(13.75,9.25)">
                        <path fill="hsl(223,90%,85%)" d="M 1.5 2 L 23 2 C 23 2 22.5 8.5 19 12 C 16 15.5 13.5 13.5 13.5 16.75 C 13.5 20 16 18 19 21.5 C 22.5 25 23 31.5 23 31.5 L 1.5 31.5 C 1.5 31.5 2 25 5.5 21.5 C 8.5 18 11 20 11 16.75 C 11 13.5 8.5 15.5 5.5 12 C 2 8.5 1.5 2 1.5 2 Z" />
                    </g>
                </g>
            </svg>
            <p className="loading-text">Loading...</p>
        </div>
    )
}

export default Loader01;