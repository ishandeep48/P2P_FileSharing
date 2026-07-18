import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { io } from "socket.io-client";
import React, { useEffect, useState, useRef } from "react";
import Home from "./pages/Home";
import Sender from "./pages/Sender";
import Receiver from "./pages/Receiver";
import ParticleBackground from "./components/ParticleBackground";
import "./App.css";
import { useCallback } from "react";
function App() {
  const socketServerIP = import.meta.env.VITE_SOCKET_SERVER;
  const [connectionId, setConnectionId] = useState("");
  const [isSocket, setIsSocket] = useState(false);
  const [downloadURL, setDownloadURL] = useState(null);
  const [signalState, setSignalState] = useState(false);
  const [dataChOpen, setDataChOpen] = useState(false);
  const [isReadyToDownload, setIsReadyToDownload] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [transferCompletion, setTransferCompletion] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [receiverSpeed, setReceiverSpeed] = useState(0);
  const [wantsClose, setWantsClose] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState(false);
  const startTimeRef = useRef(null);
  const isMetaDataReceivedRef = useRef(false);
  const socketRef = useRef();
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

    const askForLocation = async () => {
      try {
        // console.log("ask for location");
        let ext = fileNameRef.current.split(".").pop();
        fileHandle = await window.showSaveFilePicker({
          suggestedName: fileNameRef.current,
          types: [
            {
              description: " Received File",
              accept: { [fileTypeRef.current]: ["." + ext] },
            },
          ],
        });
        writableStream.current = await fileHandle.createWritable();
        // console.log("gonna send report from receiver to sender");
        const reportMessage = {
          status: true,
        };
        const sentData = JSON.stringify(reportMessage);
        dataChannel.current.send(sentData);
        // console.log("sent report to sender ", sentData);
      } catch (err) {
        // console.log("User closed the box");
        setIsReadyToDownload(false);
        if (dataChannel.current && dataChannel.current.readyState === "open") {
          const reportMessage = {
            status: false,
          };
          const sentData = JSON.stringify(reportMessage);
          dataChannel.current.send(sentData);
          // console.log("Sent cancellation report to sender");
        }
      }
    };
    askForLocation();
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
        if (!isMetaDataReceivedRef.current) {
          if (typeof event.data == "string") {
            try {
              metadataRef.current = JSON.parse(event.data);
              fileNameRef.current =
                metadataRef.current.fileName || "received_file";
              fileTypeRef.current =
                metadataRef.current.fileType || "text/plain";
              fileSizeRef.current = metadataRef.current.fileSize;
              isMetaDataReceivedRef.current = true;

              // Reset progress tracking for new file
              setTransferCompletion(0);
              setReceiverSpeed(0);
              byteSentRef.current = 0;
              lastChunkTimeRef.current = Date.now();
              lastBytesReceivedRef.current = 0;
              lastUpdateTimeRef.current = 0;
              lastUpdateTransferRef.current = 0;

              // console.log("metadata received");
              setShowApprove(true);
              // console.log("receiving and saving to ", fileNameRef.current);
            } catch (e) {
              console.warn("Error parsing metadata:", e);
            }
          }
        } else if (typeof event.data == "string" && event.data == "__EOF__") {
          // console.log("EOF Received, closing stream");
          if (writableStream.current) {
            await writableStream.current.close();
          }
          setTransferCompletion(100);
          dataChannel.current.send("__EOF_ACK__");

          // Reset state after file transfer
          isMetaDataReceivedRef.current = false;
          byteSentRef.current = 0;
          lastChunkTimeRef.current = null;
          lastBytesReceivedRef.current = 0;
          lastUpdateTimeRef.current = 0;
          lastUpdateTransferRef.current = 0;
          writableStream.current = null;
          setIsReadyToDownload(false);
          setShowApprove(false);

          const reportMessage = {
            status: false,
          };
          const sentData = JSON.stringify(reportMessage);
          dataChannel.current.send(sentData);
          // console.log("sent report to sender to not send without permission");
          return;
        } else if (event.data && writableStream.current) {
          // console.log("receiving file data");

          await writableStream.current.write(event.data);
          const now = Date.now();
          const chunkSize = event.data.size || event.data.byteLength || 0;
          byteSentRef.current += chunkSize;

          // Calculate speed
          const timeDelta = (now - (lastChunkTimeRef.current || now)) / 1000;
          if (timeDelta > 0) {
            let instSpeed = (chunkSize * 8) / (timeDelta * 1024 * 1024);
            instSpeed = parseFloat(instSpeed).toFixed(2);
            if (now - lastUpdateTimeRef.current >= 500) {
              setReceiverSpeed(parseFloat(instSpeed));
              lastUpdateTimeRef.current = now;
            }
          }

          lastChunkTimeRef.current = now;

          // Update progress more frequently for real-time feel
          const progress = (byteSentRef.current / fileSizeRef.current) * 100;
          setTransferCompletion(parseFloat(progress));
        } else {
          console.warn("Unknown data received");
        }
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
      setSignalState(true);
      socketRef.current.emit("call-accepted", { answer, to: from });
    });

    socketRef.current.on("incoming-answer", async (data) => {
      const { from, offer } = data;
      // console.log(` socket id ${from} se answer receive hua`);
      await peerRef.current.setRemoteDescription(offer);
      setSignalState(true);
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
    socketRef.current = io(socketServerIP, {
      transports: ["websocket"],
      upgrade: false,
      timeout: 10000, // 10 second timeout
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    peerRef.current = new RTCPeerConnection(rtcConfig);

    // Socket connection event handlers
    socketRef.current.on("connect", () => {
      // console.log("Connected to socket server");
      setSocketConnected(true);
      setSocketError(false);
      setIsSocket(true);
      // console.log("Socket connected state set to true");
      // console.log("Socket connected property:", socketRef.current.connected);
    });

    socketRef.current.on("disconnect", () => {
      // console.log("Disconnected from socket server");
      setSocketConnected(false);
      setIsSocket(false);
      // console.log("Socket connected state set to false");
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setSocketConnected(false);
      setSocketError(true);
      setIsSocket(false);
    });

    socketRef.current.on("reconnect", (attemptNumber) => {
      // console.log(
      //   "Reconnected to socket server after",
      //   attemptNumber,
      //   "attempts"
      // );
      setSocketConnected(true);
      setSocketError(false);
      setIsSocket(true);
    });

    socketRef.current.on("reconnect_error", (error) => {
      console.error("Socket reconnection error:", error);
      setSocketConnected(false);
      setSocketError(true);
      setIsSocket(false);
    });

    registerSocketHandlers();

    // Check if socket is already connected
    if (socketRef.current.connected) {
      // console.log("Socket already connected on mount");
      setSocketConnected(true);
      setSocketError(false);
      setIsSocket(true);
    }

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
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
  // ----------------------------------------------------------------------------
  const uploadFile = useCallback(async (file) => {
    // console.log("test 2");
    if (!dataChannel.current || dataChannel.current.readyState !== "open") {
      console.error("Data Channel has not been initialised!!");
      return;
    }
    // console.log("test 3");
    // console.log(dataChannel.current.readyState);
    const MAX_BUFFERED_AMOUNT = 15 * 1024 * 1024;
    const CHUNK_SIZE = 256 * 1024;
    const THROTTLE_DELAY = 5;
    if (dataChannel.current.readyState == "open") {
      // Reset all progress tracking for new file transfer
      setTransferCompletion(0);
      setSpeed(0);
      byteSentRef.current = 0;
      lastSenderChunkTimeRef.current = Date.now();
      lastSenderBytesSentRef.current = 0;
      lastUpdateTimeRef.current = 0;
      lastUpdateTransferRef.current = 0;

      const metadata = JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });
      fileSizeRef.current = file.size;
      dataChannel.current.send(metadata);
      logConnectionType(); // Check connection type at start of transfer

      // startTimeRef.current = Date.now();
      lastSenderChunkTimeRef.current = Date.now();
      lastSenderBytesSentRef.current = 0;
      // console.log("sent metadata");
      await new Promise((res) => {
        const check = () => {
          if (canSendData.current) {
            res();
          } else if (dataChannel.current.readyState) {
            setTimeout(check, 100);
          } else {
            throw new Error("Data closed while Waiting");
          }
        };
        check();
      });
      const stream = file.stream();
      const reader = stream.getReader();
      // let senderBytesSent = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // console.log("sending EOF. the real success");
          setTransferCompletion(100);
          dataChannel.current.send("__EOF__");
          break;
        }
        for (let i = 0; i < value.length; i += CHUNK_SIZE) {
          const chunk = value.slice(i, i + CHUNK_SIZE);
          while (
            dataChannel.current.readyState === "open" &&
            dataChannel.current.bufferedAmount > MAX_BUFFERED_AMOUNT
          ) {
            await new Promise((res) => setTimeout(res, THROTTLE_DELAY));
          }
          if (dataChannel.current.readyState !== "open") {
            throw new Error("Data channel closed during transfer");
          }
          try {
            dataChannel.current.send(chunk);
            const now = Date.now();
            const bytesSent = byteSentRef.current + chunk.byteLength;
            const timeDelta =
              (now - (lastSenderChunkTimeRef.current || now)) / 1000;
            const bytesDelta =
              bytesSent - (lastSenderBytesSentRef.current || 0);
            if (timeDelta > 0) {
              let instSpeed = (bytesDelta * 8) / (timeDelta * 1024 * 1024);
              instSpeed = parseFloat(instSpeed).toFixed(2);
              if (now - lastUpdateTimeRef.current >= 500) {
                setSpeed(parseFloat(instSpeed));
                lastUpdateTimeRef.current = now;
              }
            }
            lastSenderChunkTimeRef.current = now;
            lastSenderBytesSentRef.current = bytesSent;
            byteSentRef.current += chunk.byteLength;
            if (now - lastUpdateTransferRef.current >= 100) {
              setTransferCompletion(
                parseFloat((byteSentRef.current / fileSizeRef.current) * 100)
              );
              lastUpdateTransferRef.current = now;
            }
          } catch (e) {
            console.error("error sendinfg ", e);
          }
        }
      }
      // console.log("file sent successfully");
    } else {
      // console.log("data channel is closed atp (before sharing anything) ");
    }
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
    setIsSocket(false);
    setDownloadURL(null);
    setSignalState(false);
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

    if (socketRef.current) {
      socketRef.current.off("connection-id");
      socketRef.current.off("wants-to-connect");
      socketRef.current.off("incoming-call");
      socketRef.current.off("incoming-answer");
      socketRef.current.off("ice-candidate");
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    socketRef.current = io(socketServerIP, {
      transports: ["websocket"],
      upgrade: false,
      timeout: 10000, // 10 second timeout
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    peerRef.current = new RTCPeerConnection(rtcConfig);

    peerRef.current.oniceconnectionstatechange = () => {
      if (peerRef.current.iceConnectionState === "connected") {
        logConnectionType();
      }
    };
    // Set up socket connection event handlers for the new socket
    socketRef.current.on("connect", () => {
      // console.log("Connected to socket server (generateNewId)");
      setSocketConnected(true);
      setSocketError(false);
      setIsSocket(true);
      // console.log("Socket connected state set to true (generateNewId)");
    });

    socketRef.current.on("disconnect", () => {
      // console.log("Disconnected from socket server (generateNewId)");
      setSocketConnected(false);
      setIsSocket(false);
      // console.log("Socket connected state set to false (generateNewId)");
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("Socket connection error (generateNewId):", error);
      setSocketConnected(false);
      setSocketError(true);
      setIsSocket(false);
    });

    socketRef.current.on("reconnect", (attemptNumber) => {
      // console.log(
      //   "Reconnected to socket server after",
      //   attemptNumber,
      //   "attempts (generateNewId)"
      // );
      setSocketConnected(true);
      setSocketError(false);
      setIsSocket(true);
    });

    socketRef.current.on("reconnect_error", (error) => {
      console.error("Socket reconnection error (generateNewId):", error);
      setSocketConnected(false);
      setSocketError(true);
      setIsSocket(false);
    });

    setIsSocket(true);
    registerSocketHandlers();

    // Check if socket is already connected
    if (socketRef.current.connected) {
      // console.log("Socket already connected on generateNewId");
      setSocketConnected(true);
      setSocketError(false);
      setIsSocket(true);
    }
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
              isSocket={isSocket}
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
              downloadURL={downloadURL}
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
