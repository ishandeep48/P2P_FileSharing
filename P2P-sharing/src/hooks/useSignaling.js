import { useCallback, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { rtcConfig } from "../lib/rtcConfig";
import { socketIoOptions } from "../lib/socketConfig";

// useSignaling owns the socket.io connection, the RTCPeerConnection, and all
// signaling event handlers (offer/answer/ICE). It exposes refs to the data
// channel so useFileSender / useFileReceiver can plug their event handlers in
// when a channel comes into existence.
//
// External wiring:
//   - sender path: createDataChannel happens here (in "wants-to-connect"),
//     then we hand the channel to onSenderChannel(channel) which lets
//     useFileSender register its onopen / onmessage / etc.
//   - receiver path: peerRef.current.ondatachannel fires and we forward the
//     channel to onReceiverChannel(channel) which is provided by
//     useFileReceiver.
//
// Returns { connectTO, generateNewId, socketRef, peerRef, dataChannelRef }.
export default function useSignaling({
  socketServerIP,
  dataChannelRef,
  setConnectionId,
  setIsSocket,
  setDataChOpen,
  setIsReadyToDownload,
  setShowApprove,
  setTransferCompletion,
  setSpeed,
  setTransferError,
  setSocketConnected,
  setSocketError,
  onSenderChannel,
  onReceiverChannel,
  onResetSenderState,
  onResetReceiverState,
}) {
  const socketRef = useRef();
  const peerRef = useRef();
  const remoteSocketID = useRef(null);
  const pendingCandidates = useRef([]);

  // Inspect the selected ICE candidate pair to surface connection type info
  // in the console. Identical to the legacy logConnectionType().
  const logConnectionType = useCallback(async () => {
    if (!peerRef.current || peerRef.current.connectionState !== "connected") {
      return;
    }

    try {
      const stats = await peerRef.current.getStats();
      const statsIterable = stats.values
        ? stats.values()
        : Object.values(stats);

      for (const report of statsIterable) {
        if (report.type === "candidate-pair" && report.selected) {
          const localCandidate = report.localCandidateId
            ? stats.get(report.localCandidateId)
            : report.localCandidate;

          if (!localCandidate) {
            console.warn("Local candidate not found");
            continue;
          }

          console.group("WebRTC Connection Details");
          console.groupEnd();
        }
      }
    } catch (error) {
      console.error("Error checking connection type:", error);
    }
  }, []);

  // Wires the socket.io connection-lifecycle handlers. Used both on first
  // mount and from generateNewId() after a reset.
  const registerSocketLifecycleHandlers = useCallback(
    (socket) => {
      socket.on("connect", () => {
        setSocketConnected(true);
        setSocketError(false);
        setIsSocket(true);
      });

      socket.on("disconnect", () => {
        setSocketConnected(false);
        setIsSocket(false);
      });

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setSocketConnected(false);
        setSocketError(true);
        setIsSocket(false);
      });

      socket.on("reconnect", () => {
        setSocketConnected(true);
        setSocketError(false);
        setIsSocket(true);
      });

      socket.on("reconnect_error", (error) => {
        console.error("Socket reconnection error:", error);
        setSocketConnected(false);
        setSocketError(true);
        setIsSocket(false);
      });
    },
    [setIsSocket, setSocketConnected, setSocketError]
  );

  // All the signaling event handlers: connection-id from server, wants-to-
  // connect (sender side initiates offer), incoming-call (receiver answers),
  // incoming-answer (sender sets remote desc), and ice-candidate exchange.
  const registerSignalingHandlers = useCallback(() => {
    peerRef.current.oniceconnectionstatechange = () => {
      if (peerRef.current.iceConnectionState === "connected") {
        setTimeout(logConnectionType, 1000);
      }
    };

    // Receiver side: sender opens a data channel, the receiver's
    // RTCPeerConnection fires ondatachannel.
    peerRef.current.ondatachannel = (event) => {
      onReceiverChannel(event.channel);
    };

    socketRef.current.on("connection-id", (id) => {
      setConnectionId(id);
    });

    socketRef.current.on("wants-to-connect", async (data) => {
      const { who } = data;
      remoteSocketID.current = who;
      const channel = peerRef.current.createDataChannel("file-transfer", {
        ordered: true,
        priority: "high",
      });
      onSenderChannel(channel);

      peerRef.current.onicecandidate = (event) => {
        if (event.candidate && peerRef.current.remoteDescription) {
          socketRef.current.emit("ice-candidate", {
            candidate: event.candidate,
            to: who,
          });
        } else {
          // Note: matches legacy semantics. Null candidates (end-of-
          // candidates marker) are still pushed here when there is no
          // remoteDescription yet; we intentionally don't change this.
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
      const { offer } = data;
      await peerRef.current.setRemoteDescription(offer);
      pendingCandidates.current.forEach(async (candidate) => {
        try {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Error adding pending candidate (sender):", err);
        }
      });

      // Sender side: once we have an answer, attach the close handler so we
      // recycle the connection if the receiver disappears.
      if (dataChannelRef.current) {
        dataChannelRef.current.onclose = () => {
          generateNewIdRef.current && generateNewIdRef.current();
          setDataChOpen(false);
        };
      }
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
        console.error("error addind candidate  ", err);
      }
    });
  }, [
    dataChannelRef,
    logConnectionType,
    onReceiverChannel,
    onSenderChannel,
    setConnectionId,
    setDataChOpen,
  ]);

  // generateNewId tears down everything (socket + peer + data channel +
  // refs + UI state) and rebuilds from scratch. Used after a disconnect or
  // when the user clicks "Generate New ID".
  //
  // Note: registerSignalingHandlers references generateNewId via this ref to
  // avoid a circular useCallback dependency.
  const generateNewIdRef = useRef(null);

  const generateNewId = useCallback(() => {
    setConnectionId("");
    setIsSocket(false);
    setDataChOpen(false);
    setIsReadyToDownload(false);
    setShowApprove(false);
    setTransferCompletion(0);
    setSpeed(0);
    setTransferError(null);

    if (onResetSenderState) onResetSenderState();
    if (onResetReceiverState) onResetReceiverState();

    remoteSocketID.current = null;
    pendingCandidates.current = [];

    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
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

    socketRef.current = io(socketServerIP, socketIoOptions);
    peerRef.current = new RTCPeerConnection(rtcConfig);

    peerRef.current.oniceconnectionstatechange = () => {
      if (peerRef.current.iceConnectionState === "connected") {
        logConnectionType();
      }
    };

    registerSocketLifecycleHandlers(socketRef.current);

    setIsSocket(true);
    registerSignalingHandlers();

    if (socketRef.current.connected) {
      setSocketConnected(true);
      setSocketError(false);
      setIsSocket(true);
    }
  }, [
    dataChannelRef,
    logConnectionType,
    onResetReceiverState,
    onResetSenderState,
    registerSignalingHandlers,
    registerSocketLifecycleHandlers,
    setConnectionId,
    setDataChOpen,
    setIsReadyToDownload,
    setIsSocket,
    setShowApprove,
    setSocketConnected,
    setSocketError,
    setSpeed,
    setTransferCompletion,
    setTransferError,
    socketServerIP,
  ]);

  // Keep ref pointer up to date so signaling handlers can call the latest
  // version after a regeneration.
  generateNewIdRef.current = generateNewId;

  const connectTO = useCallback(
    (remotePeer) => {
      if (peerRef.current || dataChannelRef.current) {
        try {
          if (dataChannelRef.current) {
            dataChannelRef.current.close();
            dataChannelRef.current = null;
          }
        } catch (err) {
          console.log(err);
        }
      }
      socketRef.current.emit("connect-to-sender", { to: remotePeer });
    },
    [dataChannelRef]
  );

  // Mount: initial socket + peer + handler registration.
  useEffect(() => {
    socketRef.current = io(socketServerIP, socketIoOptions);
    peerRef.current = new RTCPeerConnection(rtcConfig);

    registerSocketLifecycleHandlers(socketRef.current);
    registerSignalingHandlers();

    if (socketRef.current.connected) {
      setSocketConnected(true);
      setSocketError(false);
      setIsSocket(true);
    }

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (peerRef.current) peerRef.current.close();
      if (dataChannelRef.current) dataChannelRef.current.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    connectTO,
    generateNewId,
    logConnectionType,
    socketRef,
    peerRef,
  };
}
