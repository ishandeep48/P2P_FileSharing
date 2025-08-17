import React, { useState,useRef,useLayoutEffect,useEffect } from "react";
import ConnectionCard from "../components/ConnectionCard";
import FileUpload from "../components/FileUpload";
import ProgressBar from "../components/ProgressBar";
import LoadingSpinner from "../components/LoadingSpinner";
import Notification from "../components/Notification";
import ServerWarning from "../components/ServerWarning";

export default function SenderForm({ 
  connectionId, 
  generateNewId, 
  isSocket, 
  uploadFile, 
  dataChOpen, 
  transferCompletion, 
  speed,
  setWantsClose,
  socketConnected,
  socketError
}) {
  // console.log('SenderForm Debug:', { socketConnected, socketError, dataChOpen, connectionId });
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState(null);
  const conCardRef = useRef(null)
  const uploadRef = useRef()
  const progressRef = useRef()
  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
  };
let changed = false;
  const handleSubmitFile = async () => {
    if (file && dataChOpen) {
      setIsUploading(true);
      setNotification({ message: 'Starting file transfer...', type: 'info' });
      
      try {
        await uploadFile(file);
        setNotification({ message: 'File sent successfully!', type: 'success' });
      } catch (error) {
        setNotification({ message: `Transfer failed: ${error.message}`, type: 'error' });
      } finally {
        setIsUploading(false);
      }
    }
  };

  useLayoutEffect(()=>{
    if(conCardRef.current){
      conCardRef.current.scrollIntoView({
        behavior:'smooth',
        block:'center'
      });
    }
  },[])
  useEffect(()=>{
    if(dataChOpen && uploadRef.current){
      uploadRef.current.scrollIntoView({
        behavior:'smooth',
        block:'center'
      })
    }
  },[dataChOpen])

  useEffect(()=>{
    if(transferCompletion>0 && progressRef.current && !changed){
      progressRef.current.scrollIntoView({
        behavior:'smooth',
        block:'center'
      });
      changed=(changed?true:true);
    }
  },[transferCompletion])
  return (
    <div className="min-h-screen py-16 px-4">
      {/* Server Warning */}
      <ServerWarning socketError={socketError} socketConnected={socketConnected} />
      
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Connection Card */}
        <div ref = {conCardRef}>
        <ConnectionCard
          connectionId={connectionId}
          isConnected={dataChOpen}
          onGenerateNewId={generateNewId}
          socketConnected={socketConnected}
          socketError={socketError}
        /></div>

        {/* File Upload Section */}
        <div className="space-y-6" ref={uploadRef}>
          <FileUpload
            onFileSelect={handleFileSelect}
            selectedFile={file}
            isConnected={dataChOpen}
          />

          {/* Send Button */}
          {file && dataChOpen && (
            <div className="text-center">
              <button
                onClick={handleSubmitFile}
                disabled={isUploading}
                className={`bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-transparent ${
                  isUploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isUploading ? (
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" text="" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  ' Send File'
                )}
              </button>
            </div>
          )}

          {/* Status Messages */}
          {!dataChOpen && (
            <div className="text-center p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-200">
                ⏳ Waiting for receiver to connect...
              </p>
            </div>
          )}

          {file && !dataChOpen && (
            <div className="text-center p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
              <p className="text-blue-200">
                📤 File ready to send. Waiting for connection...
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div ref={progressRef}>
        {(transferCompletion > 0 || speed > 0) && (
          <ProgressBar
            progress={transferCompletion}
            speed={speed}
            fileName={file?.name}
            fileSize={file?.size}
          />
        )}
        </div>
        {/* Notification */}
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
    </div>
  );
}