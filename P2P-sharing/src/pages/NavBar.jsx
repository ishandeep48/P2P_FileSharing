import React,{useEffect,useState} from "react";
import HomeLogo from "./HomeLogo";
import SenderReceiver from "./SenderReceiver";
export default function NavBar(){
    return(
        <div className="flex items-center justify-between fixed top-0 left-0 w-full z-50 bg-gray-700 text-white p-1 shadow">
            <HomeLogo/>
            <SenderReceiver/>
        </div>
    )
}