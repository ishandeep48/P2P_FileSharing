import React from 'react';

const ServerWarning = ({ socketError, socketConnected }) => {
  // Only show warning when there's an error AND not connected
  if (!socketError || socketConnected) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md">
      <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-4 rounded-lg shadow-2xl border border-red-300/50 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-lg">⚠️</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">Server Connection Error</h3>
            <p className="text-sm opacity-90 leading-relaxed">
              Cannot reach the backend server right now. Please wait for 5 minutes as our instance may be starting up, or contact the admin if the issue persists.
            </p>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-white/20">
          <div className="flex items-center justify-between text-xs">
            <span className="opacity-75">Status: {socketConnected ? 'Connected' : 'Disconnected'}</span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
              <span>{socketConnected ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerWarning;
