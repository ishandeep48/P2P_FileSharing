import { useState, useRef, useCallback } from "react";

/**
 * useUIState - Manages all UI-related state variables and their handlers.
 * 
 * This hook encapsulates:
 * - Connection state (connectionId, dataChOpen)
 * - Transfer progress state (transferCompletion, speed, receiverSpeed)
 * - UI control state (isReadyToDownload, showApprove, wantsClose)
 * - Reset/cleanup logic (generateNewId equivalent)
 * - Connection actions (connectTO)
 * 
 * @param {Object} deps - Dependencies for action handlers
 * @param {React.RefObject} deps.socketRef - Socket.io reference for emitting events
 * @param {React.RefObject} deps.dataChannel - Shared data channel ref from useWebRTC
 * @param {Function} deps.reconnect - Reconnection function from useSocketIO
 * @param {Object} deps.rtcConfig - WebRTC configuration object
 * @param {Function} deps.registerSocketHandlers - Handler registration function
 * @returns {Object} State variables and action handlers
 */
function useUIState({ socketRef, dataChannel: sharedDataChannel, reconnect, rtcConfig, registerSocketHandlers }) {
  // ─── Connection State ────────────────────────────────────────────────
  const [connectionId, setConnectionId] = useState("");
  const [dataChOpen, setDataChOpen] = useState(false);

  // ─── Transfer Progress State ────────────────────────────────────────
  const [transferCompletion, setTransferCompletion] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [receiverSpeed, setReceiverSpeed] = useState(0);

  // ─── UI Control State ───────────────────────────────────────────────
  const [isReadyToDownload, setIsReadyToDownload] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [wantsClose, setWantsClose] = useState(false);

  // ─── Refs for Shared State ──────────────────────────────────────────
  // Use the shared dataChannel ref from useWebRTC instead of creating a new one
  const dataChannel = sharedDataChannel || useRef();
  const receivedData = useRef([]);
  const startTimeRef = useRef(null);
  const isMetaDataReceivedRef = useRef(false);
  const remoteSocketID = useRef(null);
  const peerRef = useRef();
  const pendingCandidates = useRef([]);
  const canSendData = useRef(false);
  const fileNameRef = useRef("received_file");
  const fileTypeRef = useRef("text/plain");
  const metadataRef = useRef(null);
  const writableStream = useRef(null);
  const fileSizeRef = useRef(null);
  const byteSentRef = useRef(0);
  const lastChunkTimeRef = useRef(null);
  const lastBytesReceivedRef = useRef(0);
  const lastSenderChunkTimeRef = useRef(null);
  const lastSenderBytesSentRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);
  const lastUpdateTransferRef = useRef(0);

  // ─── Reset/Cleanup Function ─────────────────────────────────────────
  /**
   * Resets all UI state and reconnects.
   * Called when data channel closes or user wants to start fresh.
   */
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

    if (dataChannel?.current) {
      try {
        dataChannel.current.close();
      } catch (err) {
        console.error("Error closing data channel in generateNewId:", err);
      }
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
  }, [reconnect, rtcConfig, registerSocketHandlers]);

  // ─── Connection Action Handlers ─────────────────────────────────────
  
  /**
   * Initiates connection to a remote peer.
   * @param {string} remotePeer - Remote peer's socket ID
   */
  const connectTO = useCallback((remotePeer) => {
    if (peerRef?.current || dataChannel?.current) {
      try {
        dataChannel.current.close();
        dataChannel.current = null;
      } catch (err) {
        console.error("Error in connectTO:", err);
      }
    }
    socketRef.current.emit("connect-to-sender", { to: remotePeer });
  }, [socketRef, dataChannel]);

  // ─── Data Channel Event Handlers ────────────────────────────────────
  
  /**
   * Sets up data channel event listeners for receiver side.
   */
  const dataChannelEvents = useCallback(() => {
    if (!dataChannel?.current) {
      console.error("dataChannelEvents: dataChannel.current is undefined");
      return;
    }
    
    dataChannel.current.onopen = () => {
      setDataChOpen(true);
    };
    dataChannel.current.onerror = (error) => {
      setDataChOpen(false);
      console.error("DataChannel error:", error);
    };

    dataChannel.current.onbufferedamountlow = () => {
      // Buffer available - ready for more data
    };
  }, [dataChannel]);

  /**
   * Sets up data channel event listeners for sender side.
   */
  const senderDataChannelEvents = useCallback(() => {
    if (!dataChannel?.current) {
      console.error("senderDataChannelEvents: dataChannel.current is undefined");
      return;
    }
    
    dataChannel.current.bufferedAmountLowThreshold = 128 * 1024;
    dataChannel.current.onmessage = async (event) => {
      if (typeof event.data == "string" && event.data == "__EOF_ACK__") {
        // EOF ACK Received
      } else if (typeof event.data == "string") {
        const parsedData = JSON.parse(event.data);
        const { status } = parsedData;
        if (status) {
          canSendData.current = true;
        } else if (!status) {
          canSendData.current = false;
        }
      }
    };
  }, []);

  // ─── Cleanup Effect ─────────────────────────────────────────────────
  
  /**
   * Handles cleanup when wantsClose state changes.
   */
  const handleWantsCloseCleanup = useCallback(() => {
    if (wantsClose && dataChannel?.current) {
      try {
        dataChannel.current.close();
      } catch (err) {
        console.error("got error ", err);
      }
    }
  }, [wantsClose, dataChannel]);

  // ─── Return State and Handlers ──────────────────────────────────────
  
  return {
    // State variables
    connectionId,
    dataChOpen,
    transferCompletion,
    speed,
    receiverSpeed,
    isReadyToDownload,
    showApprove,
    wantsClose,

    // Refs (for sharing with other hooks)
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

    // Action handlers
    generateNewId,
    connectTO,
    dataChannelEvents,
    senderDataChannelEvents,
    handleWantsCloseCleanup,
    setWantsClose,

    // State setters (for external updates)
    setConnectionId,
    setDataChOpen,
    setTransferCompletion,
    setSpeed,
    setReceiverSpeed,
    setIsReadyToDownload,
    setShowApprove,
  };
}

export default useUIState;
