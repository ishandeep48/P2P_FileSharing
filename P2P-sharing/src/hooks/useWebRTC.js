import { useRef, useCallback } from "react";

/**
 * useWebRTC - Manages WebRTC peer connection lifecycle.
 * 
 * This hook encapsulates:
 * - RTCPeerConnection initialization and cleanup
 * - ICE candidate gathering and handling
 * - SDP exchange (createOffer/setLocalDescription, createAnswer/setRemoteDescription)
 * - Connection state tracking
 * - Data channel creation
 * 
 * @param {Object} deps - Dependencies for WebRTC operations
 * @param {React.RefObject} deps.socketRef - Socket.io reference for emitting events
 * @param {Object} deps.rtcConfig - WebRTC configuration object
 * @returns {Object} Peer connection state and methods
 */
function useWebRTC({ socketRef = null, rtcConfig = {} }) {
  const peerRef = useRef(null);
  const dataChannel = useRef(null);
  const pendingCandidates = useRef([]);
  const remoteSocketID = useRef(null);

  // ─── Callbacks (passed in by consumer) ────────────────────────────
  const onIceCandidateCallback = useCallback((candidate) => {}, []);
  const onDataChannelCallback = useCallback((channel) => {}, []);
  const onConnectionStateChangeCallback = useCallback((state) => {}, []);

  // ─── Methods ──────────────────────────────────────────────────────

  /**
   * Creates a new RTCPeerConnection with the provided config.
   */
  function createPeerConnection() {
    if (peerRef.current) {
      peerRef.current.close();
    }
    
    peerRef.current = new RTCPeerConnection(rtcConfig);
    pendingCandidates.current = [];

    // Track ICE connection state changes
    peerRef.current.oniceconnectionstatechange = () => {
      onConnectionStateChangeCallback?.(peerRef.current.iceConnectionState);
    };

    // Handle incoming data channel (receiver side)
    peerRef.current.ondatachannel = (event) => {
      const channel = event.channel;
      dataChannel.current = channel;
      channel.receivedData = [];
      onDataChannelCallback?.(channel);
    };

    // Handle ICE candidates
    peerRef.current.onicecandidate = (event) => {
      if (!socketRef?.current) return;

      if (event.candidate && peerRef.current.remoteDescription) {
        // Send candidate to remote peer
        onIceCandidateCallback?.(event.candidate);
        socketRef.current.emit("ice-candidate", {
          candidate: event.candidate,
          to: remoteSocketID.current,
        });
      } else if (!event.candidate) {
        // Gathering complete - create data channel if not already done
        if (peerRef.current.iceGatheringState === "complete" && !dataChannel.current) {
          onDataChannelCallback?.(null, true);
        }
      } else {
        // No remote description yet - queue candidate
        pendingCandidates.current.push(event.candidate);
      }
    };
  }

  /**
   * Sends an outgoing call with SDP offer.
   */
  async function sendCall(to) {
    if (!peerRef.current || !socketRef?.current) return false;

    remoteSocketID.current = to;

    // Create data channel (sender side)
    dataChannel.current = peerRef.current.createDataChannel("file-transfer", {
      ordered: true,
      maxRetransmits: 3,
      priority: "high",
    });

    try {
      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);
      socketRef.current.emit("outgoing-call", { to, fromOffer: offer });
      return true;
    } catch (err) {
      console.error("Error creating outgoing call:", err);
      return false;
    }
  }

  /**
   * Handles incoming call - sets remote description and creates answer.
   */
  async function handleIncomingCall(data) {
    const { from, offer } = data;
    if (!peerRef.current || !socketRef?.current) return false;

    try {
      remoteSocketID.current = from;
      await peerRef.current.setRemoteDescription(offer);

      // Add pending candidates
      for (const candidate of pendingCandidates.current) {
        try {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Error adding pending candidate (receiver):", err);
        }
      }
      pendingCandidates.current = [];

      // Create and set local answer
      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);
      socketRef.current.emit("call-accepted", { answer, to: from });
      return true;
    } catch (err) {
      console.error("Error handling incoming call:", err);
      return false;
    }
  }

  /**
   * Handles incoming answer - sets remote description and queues candidates.
   */
  async function handleIncomingAnswer(data) {
    const { from, offer } = data;
    if (!peerRef.current || !socketRef?.current) return false;

    try {
      await peerRef.current.setRemoteDescription(offer);

      // Add pending candidates
      for (const candidate of pendingCandidates.current) {
        try {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Error adding pending candidate (sender):", err);
        }
      }
      pendingCandidates.current = [];

      return true;
    } catch (err) {
      console.error("Error handling incoming answer:", err);
      return false;
    }
  }

  /**
   * Handles incoming ICE candidate.
   */
  async function handleIceCandidate(data) {
    const { candidate } = data;
    if (!peerRef.current) return false;

    try {
      if (!peerRef.current.remoteDescription) {
        pendingCandidates.current.push(candidate);
        return true;
      }
      await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      return true;
    } catch (err) {
      console.error("Error adding ICE candidate:", err);
      return false;
    }
  }

  /**
   * Cleans up the peer connection and data channel.
   */
  function cleanup() {
    if (peerRef.current) {
      try {
        peerRef.current.close();
      } catch (err) {
        console.error("Error closing peer connection:", err);
      }
      peerRef.current = null;
    }

    if (dataChannel.current) {
      try {
        dataChannel.current.close();
      } catch (err) {
        console.error("Error closing data channel:", err);
      }
      dataChannel.current = null;
    }
  }

  // ─── Exports ──────────────────────────────────────────────────────
  return {
    peerRef,
    dataChannel,
    pendingCandidates,
    remoteSocketID,
    createPeerConnection,
    sendCall,
    handleIncomingCall,
    handleIncomingAnswer,
    handleIceCandidate,
    cleanup,
    onIceCandidateCallback,
    onDataChannelCallback,
    onConnectionStateChangeCallback,
  };
}

export default useWebRTC;
