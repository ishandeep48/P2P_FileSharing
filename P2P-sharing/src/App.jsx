import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Home from "./pages/Home";
import Sender from "./pages/Sender";
import Receiver from "./pages/Receiver";
import ParticleBackground from "./components/ParticleBackground";
import "./App.css";
import useSocketIO from "./hooks/useSocketIO";
import useFileTransfer from "./hooks/useFileTransfer";
import useFileReceive from "./hooks/useFileReceive";
import useUIState from "./hooks/useUIState";

function App() {
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
  
  // ─── UI State Hook ────────────────────────────────────────────────
  const registerSocketHandlersRef = useRef(null);
  
  const {
    connectionId,
    dataChOpen,
    transferCompletion,
    speed,
    receiverSpeed,
    isReadyToDownload,
    showApprove,
    wantsClose,
    dataChannel,
    receivedData,
    startTimeRef,
    isMetaDataReceivedRef,
    remoteSocketID,
    peerRef,
    pendingCandidates,
    canSendData,
    fileNameRef,
    fileTypeRef,
    metadataRef,
    writableStream,
    fileSizeRef,
    byteSentRef,
    lastChunkTimeRef,
    lastBytesReceivedRef,
    lastSenderChunkTimeRef,
    lastSenderBytesSentRef,
    lastUpdateTimeRef,
    lastUpdateTransferRef,
    generateNewId,
    connectTO,
    dataChannelEvents,
    senderDataChannelEvents,
    handleWantsCloseCleanup,
    setConnectionId,
    setDataChOpen,
    setTransferCompletion,
    setSpeed,
    setReceiverSpeed,
    setIsReadyToDownload,
    setShowApprove,
    setWantsClose,
  } = useUIState({ socketRef, reconnect, rtcConfig, registerSocketHandlers: null });
  
  // ─── Connection Type Logger ───────────────────────────────────────
  const logConnectionType = useCallback(async () => {
    if (!peerRef.current || peerRef.current.connectionState !== "connected") {
      return;
    }

    try {
      const stats = await peerRef.current.getStats();
      const statsIterable = stats.values ? stats.values() : Object.values(stats);

      for (const report of statsIterable) {
        if (report.type === "candidate-pair" && report.selected) {
          const localCandidate = report.localCandidateId
            ? stats.get(report.localCandidateId)
            : report.localCandidate;

          if (!localCandidate) continue;

          console.group("WebRTC Connection Details");
          console.groupEnd();
        }
      }
    } catch (error) {
      console.error("Error checking connection type:", error);
    }
  }, []);
  
  // Set the ref after hook initialization to avoid circular dependency
  registerSocketHandlersRef.current = () => {
    peerRef.current.oniceconnectionstatechange = () => {
      if (peerRef.current.iceConnectionState === "connected") {
        setTimeout(logConnectionType, 1000);
      }
    };
    peerRef.current.ondatachannel = (event) => {
      dataChannel.current = event.channel;
      receivedData.current = [];
      dataChannel.current.onopen = () => {
        setDataChOpen(true);
        lastChunkTimeRef.current = Date.now();
        lastBytesReceivedRef.current = 0;
      };

      dataChannel.current.onmessage = async (event) => {
        fileReceiveHooks.handleMessage(event);
      };

      dataChannel.current.onclose = async () => {
        generateNewId();
        setDataChOpen(false);
      };
    };
    socketRef.current.on("connection-id", (id) => {
      setConnectionId(id);
    });

    socketRef.current.on("wants-to-connect", async (data) => {
      const { who } = data;
      remoteSocketID.current = who;
      dataChannel.current = peerRef.current.createDataChannel("file-transfer", {
        ordered: true,
        maxRetransmits: 3,
        priority: "high",
      });
      dataChannelEvents();
      senderDataChannelEvents();
      peerRef.current.onicecandidate = (event) => {
        if (event.candidate && peerRef.current.remoteDescription) {
          socketRef.current.emit("ice-candidate", {
            candidate: event.candidate,
            to: who,
          });
        } else {
          pendingCandidates.current.push(event.candidate);
        }
      };
      const fromOffer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(fromOffer);
      socketRef.current.emit("outgoing-call", { to: who, fromOffer });
    });

    socketRef.current.on("incoming-call", async (data) => {
      const { from, offer } = data;
      remoteSocketID.current = from;
      await peerRef.current.setRemoteDescription(offer);
      pendingCandidates.current.forEach(async (candidate) => {
        try {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Error adding pending candidate (receiver):", err);
        }
      });
      peerRef.current.onicecandidate = (event) => {
        if (event.candidate && peerRef.current.remoteDescription) {
          socketRef.current.emit("ice-candidate", {
            to: from,
            candidate: event.candidate,
          });
        } else {
          pendingCandidates.current.push(event.candidate);
        }
      };
      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);
      socketRef.current.emit("call-accepted", { answer, to: from });
    });

    socketRef.current.on("incoming-answer", async (data) => {
      const { from, offer } = data;
      await peerRef.current.setRemoteDescription(offer);
      pendingCandidates.current.forEach(async (candidate) => {
        try {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Error adding pending candidate (sender):", err);
        }
      });

      peerRef.current.onicegatheringstatechange = () => {
        if (peerRef.current.iceGatheringState == "complete") {
          dataChannel.current = peerRef.current.createDataChannel(
            "file-transfer",
            { ordered: true }
          );
          senderDataChannelEvents();
        }
      };
      dataChannel.current.onclose = () => {
        generateNewId();
        setDataChOpen(false);
      };
    });

    socketRef.current.on("ice-candidate", async (data) => {
      const { candidate } = data;
      if (!peerRef.current.remoteDescription) {
        pendingCandidates.current.push(candidate);
        return;
      }
      try {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("error adding candidate  ", err);
      }
    });
  };

  // ─── File Transfer Hook ─────────────────────────────────────────────
  const { uploadFile } = useFileTransfer({
    dataChannel,
    setTransferCompletion,
    setSpeed,
    byteSentRef,
    lastSenderChunkTimeRef,
    lastSenderBytesSentRef,
    lastUpdateTimeRef,
    lastUpdateTransferRef,
    canSendData,
    fileSizeRef,
    logConnectionType,
  });

  // ─── File Receive Hook ──────────────────────────────────────────────
  const fileReceiveHooks = useFileReceive({
    dataChannel,
    writableStream,
    fileNameRef,
    fileTypeRef,
    fileSizeRef,
    metadataRef,
    isMetaDataReceivedRef,
    setTransferCompletion,
    setReceiverSpeed,
    setShowApprove,
    setIsReadyToDownload,
    byteSentRef,
    lastChunkTimeRef,
    lastBytesReceivedRef,
    lastUpdateTimeRef,
    lastUpdateTransferRef,
  });

  useEffect(() => {
    if (!isReadyToDownload) return;
    fileReceiveHooks.askForLocation();
  }, [isReadyToDownload]);
  
  // ─── Wants Close Cleanup Effect ───────────────────────────────────
  useEffect(() => {
    handleWantsCloseCleanup();
  }, [wantsClose]);

  useEffect(() => {
    peerRef.current = new RTCPeerConnection(rtcConfig);

    registerSocketHandlersRef.current();

    return () => {
      if (peerRef.current) peerRef.current.close();
      if (dataChannel.current) dataChannel.current.close();
    };
  }, []);

  // ----------------------------------------------------------------------

  return (
    <Router>
      <ParticleBackground />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/sender"
          element={
            <Sender
              connectionId={connectionId}
              generateNewId={generateNewId}
              uploadFile={uploadFile}
              dataChOpen={dataChOpen}
              transferCompletion={transferCompletion}
              speed={speed}
              setWantsClose={setWantsClose}
              socketConnected={socketConnected}
              socketError={socketError}
            />
          }
        />
        <Route
          path="/receiver"
          element={
            <Receiver
              connectTO={connectTO}
              dataChOpen={dataChOpen}
              showApprove={showApprove}
              setIsReadyToDownload={setIsReadyToDownload}
              transferCompletion={transferCompletion}
              speed={receiverSpeed}
              setWantsClose={setWantsClose}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
export default App;
