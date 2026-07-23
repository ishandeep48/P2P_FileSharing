import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import React, { useEffect, useState, useRef, useCallback } from "react";
import Home from "./pages/Home";
import Sender from "./pages/Sender";
import Receiver from "./pages/Receiver";
import ParticleBackground from "./components/ParticleBackground";
import "./App.css";
import useSocketIO from "./hooks/useSocketIO";
import useFileTransfer from "./hooks/useFileTransfer";
import useFileReceive from "./hooks/useFileReceive";

function App() {
  const socketServerIP = import.meta.env.VITE_SOCKET_SERVER;
  const { socketRef, connected: socketConnected, error: socketError, reconnect } = useSocketIO(socketServerIP);
  
  const [connectionId, setConnectionId] = useState("");
  const [dataChOpen, setDataChOpen] = useState(false);
  const [isReadyToDownload, setIsReadyToDownload] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [transferCompletion, setTransferCompletion] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [receiverSpeed, setReceiverSpeed] = useState(0);
  const [wantsClose, setWantsClose] = useState(false);
  
  const startTimeRef = useRef(null);
  const isMetaDataReceivedRef = useRef(false);
  const peerRef = useRef();
  const dataChannel = useRef();
  const receivedData = useRef([]);
  const remoteSocketID = useRef(null);
  const pendingCandidates = useRef([]);
  const canSendData = useRef(false);
  const fileNameRef = useRef("received_file");
  const fileTypeRef = useRef("text/plain");
  const metadataRef = useRef(null);
  let fileHandle;
  const writableStream = useRef(null);
  const fileSizeRef = useRef(null);
  const byteSentRef = useRef(0);
  const lastChunkTimeRef = useRef(null);
  const lastBytesReceivedRef = useRef(0);
  const lastSenderChunkTimeRef = useRef(null);
  const lastSenderBytesSentRef = useRef(0);
  const lastUpdateTimeRef = useRef(0);
  const lastUpdateTransferRef = useRef(0);

  const logConnectionType = useCallback(async () => {
    if (!peerRef.current || peerRef.current.connectionState !== "connected") {
      // console.log("Peer connection not ready for stats");
      return;
    }

    try {
      const stats = await peerRef.current.getStats();
      // console.log(Array.from(stats.values()));
      // Modern browsers return a Map, older ones return RTCStatsReport
      const statsIterable = stats.values
        ? stats.values()
        : Object.values(stats);

      for (const report of statsIterable) {
        if (report.type === "candidate-pair" && report.selected) {
          // Handle different browser implementations
          const localCandidate = report.localCandidateId
            ? stats.get(report.localCandidateId)
            : report.localCandidate;

          const remoteCandidate = report.remoteCandidateId
            ? stats.get(report.remoteCandidateId)
            : report.remoteCandidate;

          if (!localCandidate) {
            console.warn("Local candidate not found");
            continue;
          }

          const connectionType =
            localCandidate.candidateType === "relay"
              ? "TURN Relay"
              : localCandidate.candidateType === "srflx"
              ? "STUN (Reflexive)"
              : "Direct P2P";

          console.group("WebRTC Connection Details");
          // console.log(`Connection Type: ${connectionType}`);
          // console.log("Local Candidate:", {
          //   type: localCandidate.candidateType,
          //   protocol: localCandidate.protocol,
          //   address: `${localCandidate.ip || localCandidate.address}:${
          //     localCandidate.port
          //   }`,
          //   networkType: localCandidate.networkType,
          // });

          if (remoteCandidate) {
            // console.log("Remote Candidate:", {
            //   type: remoteCandidate.candidateType,
            //   protocol: remoteCandidate.protocol,
            //   address: `${remoteCandidate.ip || remoteCandidate.address}:${
            //     remoteCandidate.port
            //   }`,
            // });
          }

          // console.log("Transport:", {
          //   bytesSent: report.bytesSent,
          //   bytesReceived: report.bytesReceived,
          //   currentRoundTripTime: report.currentRoundTripTime,
          // });
          console.groupEnd();
        }
      }
    } catch (error) {
      console.error("Error checking connection type:", error);
    }
  }, []);

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

  const dataChannelEvents = () => {
    dataChannel.current.onopen = () => {
      // console.log("opened data channel");
      setDataChOpen(true);
    };
    dataChannel.current.onerror = (error) => {
      setDataChOpen(false);
      console.error("DataChannel error:", error);
    };

    dataChannel.current.onbufferedamountlow = () => {
      // console.log("Buffer available - ready for more data");
    };
  };
  const senderDataChannelEvents = () => {
    dataChannel.current.bufferedAmountLowThreshold = 128 * 1024;
    dataChannel.current.onmessage = async (event) => {
      if (typeof event.data == "string" && event.data == "__EOF_ACK__") {
        // console.log("EOF ACK Received ");
        // dataChannel.current.close();
      } else if (typeof event.data == "string") {
        const parsedData = JSON.parse(event.data);
        const { status } = parsedData;
        // console.log(`status is ${status}`);
        // console.log(parsedData);
        if (status) {
          canSendData.current = true;
          // console.log(canSendData.current);
        } else if (!status) {
          canSendData.current = false;
          // console.log(canSendData.current);
        }
      }
    };
  };
  useEffect(() => {
    if (!isReadyToDownload) return;
    fileReceiveHooks.askForLocation();
  }, [isReadyToDownload]);
  const registerSocketHandlers = () => {
    // Add to the iceconnectionstatechange handler
    peerRef.current.oniceconnectionstatechange = () => {
      if (peerRef.current.iceConnectionState === "connected") {
        setTimeout(logConnectionType, 1000); // Log when connection is established
      }
    };
    peerRef.current.ondatachannel = (event) => {
      dataChannel.current = event.channel;
      receivedData.current = [];
      dataChannel.current.onopen = () => {
        setDataChOpen(true);
        lastChunkTimeRef.current = Date.now();
        lastBytesReceivedRef.current = 0;
        // console.log("data channel opened for transfer");
        // console.log(dataChannel.current.readyState);
      };

      // ---------------------------------------------------s

      dataChannel.current.onmessage = async (event) => {
        fileReceiveHooks.handleMessage(event);
      };

      // --------------------------------------
      dataChannel.current.onclose = async () => {
        generateNewId();
        // console.log("Data Channel is closed");
        setDataChOpen(false);
      };
    };
    socketRef.current.on("connection-id", (id) => {
      setConnectionId(id);
    });

    socketRef.current.on("wants-to-connect", async (data) => {
      const { who } = data;
      remoteSocketID.current = who;
      // console.log(`receiver is ${who}`);
      dataChannel.current = peerRef.current.createDataChannel("file-transfer", {
        ordered: true, // Faster than ordered delivery
        maxRetransmits: 3, // Disable retransmissions for maximum speed
        // maxPacketLifeTime: null, // Alternative to maxRetransmits: 0
        protocol: "udp", // Lower latency than TCP
        // negotiated: true, // Skip SDP negotiation for faster setup
        // id: 1, // Required when negotiated: true
        priority: "high", // Prioritize this channel
      });
      dataChannelEvents();
      senderDataChannelEvents();
      peerRef.current.onicecandidate = (event) => {
        if (event.candidate && peerRef.current.remoteDescription) {
          socketRef.current.emit("ice-candidate", {
            candidate: event.candidate,
            to: who,
          });
          // console.log("emitted a candidate ", event.candidate);
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
          // console.log("sent a candidate to receiver ", event.candidate);
        } else {
          pendingCandidates.current.push(event.candidate);
          // console.log(
          //   `pushed to pending candidate cause event.cadidate is  ${event.candidate} and `
          // );
        }
      };
      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);
      socketRef.current.emit("call-accepted", { answer, to: from });
    });

    socketRef.current.on("incoming-answer", async (data) => {
      const { from, offer } = data;
      // console.log(` socket id ${from} se answer receive hua`);
      await peerRef.current.setRemoteDescription(offer);
      pendingCandidates.current.forEach(async (candidate) => {
        try {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          // console.log("adding candidate ", candidate);
          // console.log("ice state is ", peerRef.current.iceGatheringState);
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
          if (dataChannel.current.readyState == "open") {
            // console.log("aakhir me data channel open hua");
          } else {
            // console.log("ab b n hua");
          }
        }
      };
      dataChannel.current.onclose = () => {
        generateNewId();
        // console.log("closed data channel");
        setDataChOpen(false);
      };
    });
    peerRef.current.addEventListener("iceconnectionstatechange", () => {
      if (peerConnection.iceConnectionState === "connected") {
        peerConnection.getStats().then((stats) => {
          stats.forEach((report) => {
            if (report.type === "candidate-pair" && report.selected) {
              // console.log(
              //   "Connection type:",
              //   report.localCandidate.candidateType === "relay"
              //     ? "TURN relay"
              //     : "Direct P2P"
              // );
            }
          });
        });
      }
    });
    socketRef.current.on("ice-candidate", async (data) => {
      // console.log(
      //   `received ice candidate from server and the candidate is ${data.candidate}`
      // );
      const { candidate } = data;
      if (!peerRef.current.remoteDescription) {
        pendingCandidates.current.push(candidate);
        // console.log("pushing to pending");
        return;
      }
      try {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        // console.log("bina pending me bheje add kara");
      } catch (err) {
        console.error("error addind candidate  ", err);
      }
    });
  };

  const rtcConfig = {
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
    // Optimized WebRTC configuration for better performance
    iceCandidatePoolSize: 10,
    bundlePolicy: "max-bundle",
    rtcpMuxPolicy: "require",
    iceConnectionState: "checking",
  };
  useEffect(() => {
    peerRef.current = new RTCPeerConnection(rtcConfig);

    registerSocketHandlers();

    return () => {
      if (peerRef.current) peerRef.current.close();
      if (dataChannel.current) dataChannel.current.close();
    };
  }, []);

  const connectTO = useCallback((remotePeer) => {
    if (peerRef.current || dataChannel.current) {
      try {
        dataChannel.current.close();
        // peerRef.current=null;
        dataChannel.current = null;
      } catch (err) {
        console.log(err);
      }
    }
    socketRef.current.emit("connect-to-sender", { to: remotePeer });
  }, []);

  // ----------------------------------------------------------------------
  useEffect(() => {
    if (wantsClose) {
      try {
        dataChannel.current.close();
        // console.log("data channel close called");
      } catch (err) {
        console.error("got error ", err);
      }
    }
  }, [wantsClose]);
  const generateNewId = useCallback(() => {
    setConnectionId("");
    setDataChOpen(false);
    setIsReadyToDownload(false);
    setShowApprove(false);
    setTransferCompletion(0);
    setSpeed(0);

    startTimeRef.current = null;
    isMetaDataReceivedRef.current = false;
    remoteSocketID.current = null;
    pendingCandidates.current = [];
    canSendData.current = false;
    fileNameRef.current = "received_file";
    fileTypeRef.current = "text/plain";
    metadataRef.current = null;
    fileSizeRef.current = null;
    byteSentRef.current = 0;

    if (dataChannel.current) {
      dataChannel.current.close();
      dataChannel.current = null;
    }

    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    // Recreate socket (connection state handled by useSocketIO)
    reconnect();
    
    // Recreate peer connection and re-register handlers
    peerRef.current = new RTCPeerConnection(rtcConfig);
    registerSocketHandlers();
  }, [registerSocketHandlers]);

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
