import React from 'react';
import NavBar from './NavBar';
import { Link } from 'react-router-dom';

function Home() {
    return (
        <div className="min-h-screen">
            <NavBar />
            <div className="container mx-auto px-4 pt-24 pb-16">
                <div className="text-center space-y-8">
                    {/* Hero Section */}
                    <div className="space-y-6">
                        <h1 className="text-6xl font-bold text-white mb-4">
                            <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                                P2P File Sharing
                            </span>
                        </h1>
                        <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
                            Lightning-fast peer-to-peer file sharing powered by WebRTC. 
                            Transfer files directly between devices with no server storage.
                        </p>
                    </div>

                    {/* Features */}
                    <div className="grid md:grid-cols-3 gap-8 mt-16">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
                            <div className="text-4xl mb-4">⚡</div>
                            <h3 className="text-xl font-semibold text-white mb-2">Lightning Fast</h3>
                            <p className="text-white/70">Direct peer-to-peer transfer with speeds limited only by your network connection.</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
                            <div className="text-4xl mb-4">🔒</div>
                            <h3 className="text-xl font-semibold text-white mb-2">Secure</h3>
                            <p className="text-white/70">Files never touch our servers. End-to-end encrypted transfers between peers.</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
                            <div className="text-4xl mb-4">📱</div>
                            <h3 className="text-xl font-semibold text-white mb-2">Easy to Use</h3>
                            <p className="text-white/70">Simple QR code sharing or manual connection ID entry. No accounts required.</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-6 justify-center mt-16">
                        <Link
                            to="/sender"
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent"
                        >
                            📤 Send Files
                        </Link>
                        <Link
                            to="/receiver"
                            className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-transparent"
                        >
                            📥 Receive Files
                        </Link>
                    </div>

                    {/* Info Section */}
                    <div className="mt-16 bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 max-w-4xl mx-auto">
                        <h2 className="text-2xl font-bold text-white mb-4">How It Works</h2>
                        <div className="grid md:grid-cols-2 gap-8 text-left">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">For Senders:</h3>
                                <ol className="text-white/80 space-y-2 list-decimal list-inside">
                                    <li>Generate a unique connection ID</li>
                                    <li>Share the QR code or ID with the receiver</li>
                                    <li>Select and upload your file</li>
                                    <li>Wait for receiver approval and transfer</li>
                                </ol>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">For Receivers:</h3>
                                <ol className="text-white/80 space-y-2 list-decimal list-inside">
                                    <li>Scan QR code or enter connection ID</li>
                                    <li>Approve the incoming file transfer</li>
                                    <li>Choose download location</li>
                                    <li>File downloads automatically</li>
                                </ol>
                            </div>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <div className="mt-16 text-white/60 text-sm">
                        <p>
                            Built with ❤️ for seamless file sharing. Transfer rates depend on your network connection, not server performance.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default Home;