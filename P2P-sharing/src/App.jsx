import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import React, { useEffect, useRef, useState } from "react";
import Home from "./pages/Home";
import Sender from "./pages/Sender";
import Receiver from "./pages/Receiver";
import ParticleBackground from "./components/ParticleBackground";
import "./App.css";
import { P2PProvider } from "./context/P2PContext";
import useSocketIO from "./hooks/useSocketIO";
import useWebRTC from "./hooks/useWebRTC";
import useFileTransfer from "./hooks/useFileTransfer";
import useFileReceive from "./hooks/useFileReceive";
import useUIState from "./hooks/useUIState";
import useSocketHandlers from "./hooks/useSocketHandlers";

function App() {
  const [file, setFile] = useState(null);
  const [notification, setNotification] = useState(null);
  
  const socketServerIP = import.meta.env.VITE_SOCKET_SERVER;
  
  // ─── Handler Ref for initial mount (onConnectRef in useSocketIO) ──
  const attachHandlersRef = useRef(null);
  
  // ─── Socket Hook (onConnectRef for initial mount, onReconnect callback for generateNewId) ──
  const { socketRef, connected: socketConnected, error: socketError, reconnect } = useSocketIO(socketServerIP, {
    onConnectRef: attachHandlersRef,
  });
  
  // ─── WebRTC Configuration ─────────────────────────────────────────
  const rtcConfig = useRef({
    iceTransportPolicy: "all",
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun.services.mozilla.com" },
      {
        urls: import.meta.env.VITE_TURN_SERVER,
        username: import.meta.env.VITE_TURN_USERNAME,
        credential: import.meta.env.VITE_TURN_PASSWORD,
      },
    ],
    iceCandidatePoolSize: 10,
    bundlePolicy: "max-bundle",
    rtcpMuxPolicy: "require",
    iceConnectionState: "checking",
  });

  // ─── WebRTC Hook ────────────────────────────────────────────────
  const {
    peerRef, dataChannel, pendingCandidates, remoteSocketID,
    createPeerConnection, sendCall, handleIncomingCall,
    handleIncomingAnswer, handleIceCandidate, cleanup: webRTCCleanup, logConnectionType,
  } = useWebRTC({ socketRef, rtcConfig });

  // ─── Refs for runtime values (fileReceiveHooks changes on every render) ──
  const fileReceiveHooksRef = useRef(null);
  
  // ─── UI State Hook ────────────────────────────────────────────────
  const {
    connectionId, dataChOpen, transferCompletion, speed, receiverSpeed,
    isReadyToDownload, showApprove, wantsClose, receivedData,
    startTimeRef, isMetaDataReceivedRef, canSendData,
    fileNameRef, fileTypeRef, metadataRef, writableStream, fileSizeRef,
    byteSentRef, lastChunkTimeRef, lastBytesReceivedRef,
    lastSenderChunkTimeRef, lastSenderBytesSentRef,averageSpeed,
    lastUpdateTimeRef, lastUpdateTransferRef,
    generateNewId, connectTO, dataChannelEvents, senderDataChannelEvents,
    handleWantsCloseCleanup, setConnectionId, setDataChOpen,
    setTransferCompletion, setSpeed, setReceiverSpeed, setAverageSpeed,
    setIsReadyToDownload, setShowApprove, setWantsClose,
  } = useUIState({ 
    socketRef, dataChannel, peerRef, reconnect, rtcConfig,
    onReconnect: () => {
      if (socketRef.current) {
        console.log("[onReconnect] Attaching handlers via hook");
        onReconnectAttach(socketRef.current);
      }
    },
  });

  // ─── Socket Handlers Hook ─────────────────────────────────────────
  const { attachHandlers: onReconnectAttach, detachHandlers } = useSocketHandlers({
    peerRef,
    dataChannel,
    receivedData,
    fileReceiveHooksRef,
    logConnectionType,
    sendCall,
    handleIncomingCall,
    handleIncomingAnswer,
    handleIceCandidate,
    lastChunkTimeRef,
    lastBytesReceivedRef,
    setDataChOpen,
    setConnectionId,
    generateNewId,
    dataChannelEvents,
    senderDataChannelEvents,
  });

  // Set ref for initial mount (onConnectRef in useSocketIO)
  attachHandlersRef.current = onReconnectAttach;

  // ─── File Transfer Hook ─────────────────────────────────────────────
  const { uploadFile } = useFileTransfer({
    dataChannel, setTransferCompletion, setSpeed, byteSentRef,
    lastSenderChunkTimeRef, lastSenderBytesSentRef,
    lastUpdateTimeRef, lastUpdateTransferRef, canSendData, fileSizeRef, logConnectionType,
  });

  // ─── File Receive Hook ──────────────────────────────────────────────
  const fileReceive = useFileReceive({
    dataChannel, writableStream, fileNameRef, fileTypeRef, fileSizeRef,
    metadataRef, isMetaDataReceivedRef, setTransferCompletion, setReceiverSpeed,
    setShowApprove, setIsReadyToDownload, byteSentRef, lastChunkTimeRef,
    lastBytesReceivedRef, lastUpdateTimeRef, lastUpdateTransferRef, setAverageSpeed,
  });



  // Update ref so handler always has current fileReceiveHooks
  useEffect(() => {
    fileReceiveHooksRef.current = fileReceive;
  }, [fileReceive]);

  // ─── Effects ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isReadyToDownload) return;
    fileReceive.askForLocation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReadyToDownload]);

  useEffect(() => { handleWantsCloseCleanup(); }, [wantsClose, handleWantsCloseCleanup]);

  useEffect(() => {
    createPeerConnection();
    return () => webRTCCleanup();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── P2P Context Value ──────────────────────────────────────────────
  const p2pValue = {
    connectionId,
    generateNewId,
    uploadFile,
    dataChOpen,
    transferCompletion,
    speed,
    receiverSpeed,
    averageSpeed,
    setWantsClose,
    socketConnected,
    socketError,
    connectTO,
    showApprove,
    setIsReadyToDownload,
    file,
    setFile,
    notification,
    setNotification,
  };

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <Router>
      <ParticleBackground />
      <P2PProvider value={p2pValue}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sender" element={<Sender />} />
          <Route path="/receiver" element={<Receiver />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </P2PProvider>
    </Router>
  );
}

export default App;
