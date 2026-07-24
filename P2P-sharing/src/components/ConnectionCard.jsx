import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useP2P } from '../context/P2PContext';

const ConnectionCard = () => {
  const { connectionId, generateNewId: onGenerateNewId, socketConnected, dataChOpen, setNotification } = useP2P();
  console.log('ConnectionCard Debug:', { socketConnected, dataChOpen, connectionId });

  const handleCopyId = async () => {
    if (!connectionId) return;
    try {
      await navigator.clipboard.writeText(connectionId);
      setNotification({ message: 'Connection ID copied!', type: 'success' });
    } catch (err) {
      setNotification({ message: 'Failed to copy Connection ID', type: 'error' });
    }
  };
  return (
    <div className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-white/20">
      <div className="text-center">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Connection ID</h2>
          <div className="bg-white/20 rounded-lg p-4 mb-4 relative">
            <span className="text-3xl font-mono font-bold text-blue-300 tracking-wider block text-center truncate">
              {connectionId || '------'}
            </span>
            {connectionId && (
              <button
                onClick={handleCopyId}
                className="absolute top-1/2 -translate-y-1/2 right-3 px-3 py-1.5 rounded-xl backdrop-blur-sm bg-white/10 border border-white/20 text-white/80 text-xs font-medium tracking-wide hover:bg-white/20 hover:text-white transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/30"
                title="Copy Connection ID"
              >
                COPY
              </button>
            )}
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
            <div className={`w-3 h-3 rounded-full mr-2 ${dataChOpen ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></div>
            <span className="text-white text-sm">
              Peer: {dataChOpen ? 'Connected' : 'Waiting'}
            </span>
          </div>
        </div>

        <button
          onClick={() => onGenerateNewId()}
          className="w-full bg-gradient-to-r from-red-400 to-yellow-700 hover:from-red-500 hover:to-yellow-800 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-transparent"
        >
          Generate New ID
        </button>
      </div>
    </div>
  );
};

export default ConnectionCard;
