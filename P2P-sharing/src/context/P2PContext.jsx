import { useMemo, useRef, useState } from "react";
import useFileReceiver from "../hooks/useFileReceiver";
import useFileSender from "../hooks/useFileSender";
import useSignaling from "../hooks/useSignaling";
import { P2PContext } from "./p2pContextInstance";

// P2PProvider owns all WebRTC + signaling state for the app. The previous
// monolithic App.jsx held this state inside a single component and drilled
// it through 3-4 layers of props; consumers now grab what they need from
// useP2P() instead.
export function P2PProvider({ children }) {
  const socketServerIP = import.meta.env.VITE_SOCKET_SERVER;

  // ---- UI state (mirrors what App.jsx used to own) ----
  const [connectionId, setConnectionId] = useState("");
  const [isSocket, setIsSocket] = useState(false);
  const [dataChOpen, setDataChOpen] = useState(false);
  const [isReadyToDownload, setIsReadyToDownload] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [transferCompletion, setTransferCompletion] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [receiverSpeed, setReceiverSpeed] = useState(0);
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState(false);
  const [transferError, setTransferError] = useState(null);

  // ---- Refs shared across hooks ----
  // dataChannelRef is the single source of truth for the active
  // RTCDataChannel. useSignaling either creates one (sender) or receives one
  // via ondatachannel (receiver). useFileSender / useFileReceiver attach
  // their own event handlers when invoked.
  const dataChannelRef = useRef(null);

  // logConnectionType is owned by useSignaling but used by useFileSender at
  // the start of every transfer. generateNewId is owned by useSignaling but
  // needs to be reachable from the receiver hook (data channel close => recycle
  // connection). We pass ref-based indirections to avoid circular hook-
  // dependencies between the three hooks.
  const logConnectionTypeRef = useRef(() => {});
  const generateNewIdRef = useRef(() => {});

  // Stable callbacks (refs to constant closures) so the hooks don't see new
  // identities every render.
  const stableLogConnectionType = useRef(() => logConnectionTypeRef.current());
  const stableOnChannelClose = useRef(() => generateNewIdRef.current());

  const sender = useFileSender({
    dataChannelRef,
    setDataChOpen,
    setTransferCompletion,
    setSpeed,
    logConnectionType: stableLogConnectionType.current,
  });

  const receiver = useFileReceiver({
    dataChannelRef,
    isReadyToDownload,
    setIsReadyToDownload,
    setShowApprove,
    setTransferCompletion,
    setReceiverSpeed,
    setTransferError,
    setDataChOpen,
    onChannelClose: stableOnChannelClose.current,
  });

  const signaling = useSignaling({
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
    onSenderChannel: sender.attachToDataChannel,
    onReceiverChannel: receiver.attachToDataChannel,
    onResetSenderState: sender.resetSenderState,
    onResetReceiverState: receiver.resetReceiverState,
  });

  // After signaling is built, expose its actions through the refs we handed
  // to the sender/receiver hooks.
  logConnectionTypeRef.current = signaling.logConnectionType;
  generateNewIdRef.current = signaling.generateNewId;

  // setWantsClose closes the active data channel. This used to be a state +
  // useEffect dance in App.jsx; collapsing it here removes one piece of
  // unused state without changing observable behaviour.
  const setWantsClose = (next) => {
    if (next) {
      try {
        if (dataChannelRef.current) {
          dataChannelRef.current.close();
        }
      } catch (err) {
        console.error("got error ", err);
      }
    }
  };

  const value = useMemo(
    () => ({
      // state
      connectionId,
      isSocket,
      dataChOpen,
      isReadyToDownload,
      showApprove,
      transferCompletion,
      speed,
      receiverSpeed,
      socketConnected,
      socketError,
      transferError,
      // actions
      uploadFile: sender.uploadFile,
      connectTO: signaling.connectTO,
      generateNewId: signaling.generateNewId,
      setIsReadyToDownload,
      setWantsClose,
    }),
    [
      connectionId,
      isSocket,
      dataChOpen,
      isReadyToDownload,
      showApprove,
      transferCompletion,
      speed,
      receiverSpeed,
      socketConnected,
      socketError,
      transferError,
      sender.uploadFile,
      signaling.connectTO,
      signaling.generateNewId,
    ]
  );

  return <P2PContext.Provider value={value}>{children}</P2PContext.Provider>;
}
