import React from "react";
import HomeLogo from "./HomeLogo";
import SenderReceiver from "./SenderReceiver";

export default function NavBar() {
    return (
<nav className="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-[#4e525f80] to-[#13121480] backdrop-blur-xl border-b border-white/10 shadow-2xl">            <div className="flex items-center justify-between px-6 py-4">
                <HomeLogo />
                <SenderReceiver />
            </div>
        </nav>
    );
}