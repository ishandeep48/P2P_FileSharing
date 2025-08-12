import React from 'react';

const ProgressBar = ({ progress, speed, fileName, fileSize }) => {
  // Ensure progress is a number and handle edge cases
  const safeProgress = typeof progress === 'number' ? progress : 0;
  const safeSpeed = typeof speed === 'number' ? speed : 0;

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (speed) => {
    if (!speed || speed === 0) return '0 Mbps';
    return `${speed} Mbps`;
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-2xl border border-white/20">
      {fileName && (
        <div className="mb-4">
          <h3 className="text-white font-semibold text-sm truncate">{fileName}</h3>
          {fileSize && (
            <p className="text-white/70 text-xs">{formatFileSize(fileSize)}</p>
          )}
        </div>
      )}
      
      <div className="mb-4">
        <div className="flex justify-between text-white text-sm mb-2">
          <span>Progress</span>
          <span>{safeProgress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300 ease-out relative"
            style={{ width: `${Math.min(safeProgress, 100)}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-white/80 text-sm">
          Speed: {formatSpeed(safeSpeed)}
        </div>
        <div className="flex space-x-2">
          {safeProgress > 0 && safeProgress < 100 && (
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          )}
          {safeProgress >= 100 && (
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
