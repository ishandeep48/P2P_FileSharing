import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const ConnectionCard = ({ connectionId, isConnected, onGenerateNewId, socketConnected, socketError }) => {
  console.log('ConnectionCard Debug:', { socketConnected, socketError, isConnected, connectionId });
  return (
    <div className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-white/20">
      <div className="text-center">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Connection ID</h2>
          <div className="bg-white/20 rounded-lg p-4 mb-4">
            <span className="text-3xl font-mono font-bold text-blue-300 tracking-wider">
              {connectionId || '------'}
            </span>
          </div>
        </div>

        {connectionId && (
          <div className="mb-6">
            <div className="bg-white p-4 rounded-lg shadow-lg inline-block">
              <QRCodeCanvas 
                value={connectionId} 
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
          </div>
        )}

        {/* Connection Status */}
        <div className="space-y-3 mb-6">
          {/* Socket Server Status */}
          <div className="flex items-center justify-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${socketConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className="text-white text-sm">
              Server: {socketConnected ? 'Online' : 'Offline'}
            </span>
          </div>
          
          {/* Peer Connection Status */}
          <div className="flex items-center justify-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></div>
            <span className="text-white text-sm">
              Peer: {isConnected ? 'Connected' : 'Waiting'}
            </span>
          </div>
        </div>

        <button
          onClick={onGenerateNewId}
          className="w-full bg-gradient-to-r from-red-400 to-yellow-700 hover:from-red-500 hover:to-yellow-800 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-transparent"
        >
          Generate New ID
        </button>
      </div>
    </div>
  );
};

export default ConnectionCard;
