import React, { useState, useRef } from 'react';

const FileUpload = ({ onFileSelect, selectedFile, isConnected }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          isDragOver
            ? 'border-blue-400 bg-blue-50/20'
            : 'border-white/30 bg-white/5'
        } ${!isConnected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => isConnected && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          disabled={!isConnected}
        />
        
        <div className="space-y-4">
          <div className="text-6xl text-white/60">📁</div>
          
          {selectedFile ? (
            <div className="space-y-2">
              <h3 className="text-white font-semibold text-lg">{selectedFile.name}</h3>
              <p className="text-white/70 text-sm">{formatFileSize(selectedFile.size)}</p>
              <p className="text-white/50 text-xs">{selectedFile.type || 'Unknown type'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="text-white font-semibold text-lg">
                {isConnected ? 'Drop your file here' : 'Connect first to upload'}
              </h3>
              <p className="text-white/70 text-sm">
                {isConnected ? 'or click to browse' : 'Establish connection to start sharing'}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {!isConnected && (
        <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-200 text-sm text-center">
            ⚠️ Please establish a connection before uploading files
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
