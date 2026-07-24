import { useCallback } from "react";

/**
 * useSocketHandlers — Manages all socket.io event handler attachments.
 * 
 * Provides:
 * - attachHandlers() — Attaches all socket listeners and peer connection handlers
 * - detachHandlers() — Removes all socket listeners (for cleanup/reconnect)
 * 
 * @param {Object} deps - Dependencies for handler functions
 * @param {React.RefObject} deps.peerRef - WebRTC peer connection ref
 * @param {React.RefObject} deps.dataChannel - Data channel ref
 * @param {React.RefObject} deps.receivedData - Received data buffer ref
 * @param {React.RefObject} deps.fileReceiveHooksRef - File receive hooks ref
 * @param {Function} deps.logConnectionType - Log connection type function
 * @param {Function} deps.sendCall - Send call function
 * @param {Function} deps.handleIncomingCall - Handle incoming call function
 * @param {Function} deps.handleIncomingAnswer - Handle incoming answer function
 * @param {Function} deps.handleIceCandidate - Handle ICE candidate function
 * @param {React.RefObject} deps.lastChunkTimeRef - Last chunk time ref
 * @param {React.RefObject} deps.lastBytesReceivedRef - Last bytes received ref
 * @param {Function} deps.setDataChOpen - Set data channel open state setter
 * @param {Function} deps.setConnectionId - Set connection ID state setter
 * @param {Function} deps.generateNewId - Generate new ID function
 * @param {Function} deps.dataChannelEvents - Data channel events function
 * @param {Function} deps.senderDataChannelEvents - Sender data channel events function
 * @returns {{ attachHandlers: Function, detachHandlers: Function }}
 */
function useSocketHandlers({
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
}) {
  
  /**
   * Detaches all socket listeners (for cleanup before re-attaching).
   */
  const detachHandlers = useCallback((socket) => {
    if (!socket) return;
    
    socket.off("connection-id");
    socket.off("wants-to-connect");
    socket.off("incoming-call");
    socket.off("incoming-answer");
    socket.off("ice-candidate");
  }, []);

  /**
   * Attaches all socket listeners and peer connection handlers.
   */
  const attachHandlers = useCallback((socket) => {
    if (!socket) return;

    detachHandlers(socket);

    // ─── Peer-specific handlers (only if peer exists) ──────────────
    if (peerRef.current) {
      peerRef.current.oniceconnectionstatechange = () => {
        if (peerRef.current.iceConnectionState === "connected") {
          setTimeout(logConnectionType, 1000);
        }
      };

      // Data channel creation handler (receiver side)
      peerRef.current.ondatachannel = (event) => {
        const channel = event.channel;
        dataChannel.current = channel;
        receivedData.current = [];

        setTimeout(() => {
          if (!channel) return;
          
          // Check if channel is already open (timing issue)
          if (channel.readyState === "open") {
            setDataChOpen(true);
            lastChunkTimeRef.current = Date.now();
            lastBytesReceivedRef.current = 0;
          }
          
          channel.onopen = () => {
            setDataChOpen(true);
            lastChunkTimeRef.current = Date.now();
            lastBytesReceivedRef.current = 0;
          };

          channel.onmessage = async (event) => fileReceiveHooksRef.current.handleMessage(event);
          
          channel.onclose = async () => {
            generateNewId();
            setDataChOpen(false);
          };
        }, 0);
      };
    }

    // ─── Socket event handlers (always attached) ────────────────────
    
    socket.on("connection-id", (id) => {
      console.log("[useSocketHandlers] Received connection-id:", id);
      setConnectionId(id);
    });

    // Request connection ID explicitly (covers race condition where server sent it before handlers attached)
    socket.emit("get-connection-id");

    socket.on("wants-to-connect", async (data) => {
      const { who } = data;
      await sendCall(who);
      setTimeout(() => {
        if (dataChannel.current) {
          // Check if channel is already open before attaching handlers
          if (dataChannel.current.readyState === "open") {
            setDataChOpen(true);
          }
          dataChannelEvents();
          senderDataChannelEvents();
        }
      }, 0);
    });

    socket.on("incoming-call", async (data) => handleIncomingCall(data));

    socket.on("incoming-answer", async (data) => {
      const { from, offer } = data;
      handleIncomingAnswer({ from, offer });
      
      if (peerRef.current) {
        peerRef.current.onicegatheringstatechange = () => {
          if (peerRef.current.iceGatheringState === "complete") {
            const channel = peerRef.current.createDataChannel("file-transfer", { ordered: true });
            dataChannel.current = channel;
            setTimeout(() => senderDataChannelEvents(), 0);
          }
        };
      }
    });

    socket.on("ice-candidate", async (data) => handleIceCandidate(data));
  }, [
    peerRef, dataChannel, receivedData, fileReceiveHooksRef,
    logConnectionType, sendCall, handleIncomingCall, handleIncomingAnswer,
    handleIceCandidate, lastChunkTimeRef, lastBytesReceivedRef, setDataChOpen,
    setConnectionId, generateNewId, dataChannelEvents, senderDataChannelEvents, detachHandlers,
  ]);

  return { attachHandlers, detachHandlers };
}

export default useSocketHandlers;
