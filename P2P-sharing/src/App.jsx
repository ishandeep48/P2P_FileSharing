import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
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

function App() {
  const [file, setFile] = useState(null);
  const [notification, setNotification] = useState(null);
  
  const socketServerIP = import.meta.env.VITE_SOCKET_SERVER;
  const { socketRef, connected: socketConnected, error: socketError, reconnect } = useSocketIO(socketServerIP);
  
  // ─── WebRTC Configuration ─────────────────────────────────────────
  const rtcConfig = useMemo(() => ({
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
  }), []);
  
  // ─── WebRTC Hook ────────────────────────────────────────────────
  const {
    peerRef, dataChannel, pendingCandidates, remoteSocketID,
    createPeerConnection, sendCall, handleIncomingCall,
    handleIncomingAnswer, handleIceCandidate, cleanup: webRTCCleanup, logConnectionType,
  } = useWebRTC({ socketRef, rtcConfig });

  // ─── UI State Hook ────────────────────────────────────────────────
  const {
    connectionId, dataChOpen, transferCompletion, speed, receiverSpeed,
    isReadyToDownload, showApprove, wantsClose, receivedData,
    startTimeRef, isMetaDataReceivedRef, canSendData,
    fileNameRef, fileTypeRef, metadataRef, writableStream, fileSizeRef,
    byteSentRef, lastChunkTimeRef, lastBytesReceivedRef,
    lastSenderChunkTimeRef, lastSenderBytesSentRef,
    lastUpdateTimeRef, lastUpdateTransferRef,
    generateNewId, connectTO, dataChannelEvents, senderDataChannelEvents,
    handleWantsCloseCleanup, setConnectionId, setDataChOpen,
    setTransferCompletion, setSpeed, setReceiverSpeed,
    setIsReadyToDownload, setShowApprove, setWantsClose,
  } = useUIState({ socketRef, dataChannel, peerRef, reconnect, rtcConfig });

  // ─── File Transfer Hook ─────────────────────────────────────────────
  const { uploadFile } = useFileTransfer({
    dataChannel, setTransferCompletion, setSpeed, byteSentRef,
    lastSenderChunkTimeRef, lastSenderBytesSentRef,
    lastUpdateTimeRef, lastUpdateTransferRef, canSendData, fileSizeRef, logConnectionType,
  });

  // ─── File Receive Hook ──────────────────────────────────────────────
  const fileReceiveHooks = useFileReceive({
    dataChannel, writableStream, fileNameRef, fileTypeRef, fileSizeRef,
    metadataRef, isMetaDataReceivedRef, setTransferCompletion, setReceiverSpeed,
    setShowApprove, setIsReadyToDownload, byteSentRef, lastChunkTimeRef,
    lastBytesReceivedRef, lastUpdateTimeRef, lastUpdateTransferRef,
  });

  // ─── Socket Event Handlers ──────────────────────────────────────────
  const registerSocketHandlers = useMemo(() => {
    return () => {
      if (!peerRef.current || !socketRef?.current) return;

      peerRef.current.oniceconnectionstatechange = () => {
        if (peerRef.current.iceConnectionState === "connected") {
          setTimeout(logConnectionType, 1000);
        }
      };

      peerRef.current.ondatachannel = (event) => {
        const channel = event.channel;
        dataChannel.current = channel;
        receivedData.current = [];

        setTimeout(() => {
          if (!channel) return;
          channel.onopen = () => {
            setDataChOpen(true);
            lastChunkTimeRef.current = Date.now();
            lastBytesReceivedRef.current = 0;
          };
          channel.onmessage = async (event) => fileReceiveHooks.handleMessage(event);
          channel.onclose = async () => { generateNewId(); setDataChOpen(false); };
        }, 0);
      };

      socketRef.current.on("connection-id", (id) => setConnectionId(id));

      socketRef.current.on("wants-to-connect", async (data) => {
        const { who } = data;
        await sendCall(who);
        setTimeout(() => { if (dataChannel.current) { dataChannelEvents(); senderDataChannelEvents(); } }, 0);
      });

      socketRef.current.on("incoming-call", async (data) => await handleIncomingCall(data));

      socketRef.current.on("incoming-answer", async (data) => {
        const { from, offer } = data;
        await handleIncomingAnswer({ from, offer });
        peerRef.current.onicegatheringstatechange = () => {
          if (peerRef.current.iceGatheringState === "complete") {
            const channel = peerRef.current.createDataChannel("file-transfer", { ordered: true });
            dataChannel.current = channel;
            setTimeout(() => senderDataChannelEvents(), 0);
          }
        };
      });

      socketRef.current.on("ice-candidate", async (data) => await handleIceCandidate(data));
    };
  }, [peerRef, socketRef, logConnectionType, dataChannel, receivedData, fileReceiveHooks, sendCall, 
      handleIncomingCall, handleIncomingAnswer, handleIceCandidate, generateNewId, setDataChOpen,
      lastChunkTimeRef, lastBytesReceivedRef, dataChannelEvents, senderDataChannelEvents]);

  // ─── Effects ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isReadyToDownload) return;
    fileReceiveHooks.askForLocation();
  }, [isReadyToDownload, fileReceiveHooks]);

  useEffect(() => { handleWantsCloseCleanup(); }, [wantsClose, handleWantsCloseCleanup]);

  useEffect(() => {
    createPeerConnection();
    registerSocketHandlers();
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
