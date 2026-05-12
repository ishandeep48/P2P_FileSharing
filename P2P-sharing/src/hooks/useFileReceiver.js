import { useCallback, useEffect, useRef } from "react";
import {
  DEFAULT_FILE_NAME,
  DEFAULT_FILE_TYPE,
  EOF_ACK_MARKER,
  EOF_MARKER,
  SPEED_UPDATE_INTERVAL_MS,
} from "../lib/constants";

// useFileReceiver owns the receive side of the data channel:
//   - parses metadata, sets up the writable file stream, writes chunks,
//     handles __EOF__ (with the size-mismatch check), and resets state.
//   - exposes attachToDataChannel(channel) which useSignaling calls inside its
//     peer.ondatachannel handler.
//   - watches isReadyToDownload so it can pop the showSaveFilePicker once the
//     user approves the incoming transfer.
export default function useFileReceiver({
  dataChannelRef,
  isReadyToDownload,
  setIsReadyToDownload,
  setShowApprove,
  setTransferCompletion,
  setReceiverSpeed,
  setTransferError,
  setDataChOpen,
  onChannelClose,
}) {
  const isMetaDataReceivedRef = useRef(false);
  const fileNameRef = useRef(DEFAULT_FILE_NAME);
  const fileTypeRef = useRef(DEFAULT_FILE_TYPE);
  const fileSizeRef = useRef(null);
  const metadataRef = useRef(null);
  const writableStreamRef = useRef(null);
  const byteReceivedRef = useRef(0);
  const lastChunkTimeRef = useRef(null);
  const lastBytesReceivedRef = useRef(0);
  const lastUpdateTimeRef = useRef(0);
  const lastUpdateTransferRef = useRef(0);

  // Reset every piece of per-transfer state. Called both on metadata receipt
  // (start of new file) and on EOF (clean up after transfer).
  const resetTransferState = useCallback(() => {
    isMetaDataReceivedRef.current = false;
    byteReceivedRef.current = 0;
    lastChunkTimeRef.current = null;
    lastBytesReceivedRef.current = 0;
    lastUpdateTimeRef.current = 0;
    lastUpdateTransferRef.current = 0;
  }, []);

  const resetAll = useCallback(() => {
    resetTransferState();
    fileNameRef.current = DEFAULT_FILE_NAME;
    fileTypeRef.current = DEFAULT_FILE_TYPE;
    fileSizeRef.current = null;
    metadataRef.current = null;
    writableStreamRef.current = null;
  }, [resetTransferState]);

  const handleMessage = useCallback(
    async (event) => {
      const channel = dataChannelRef.current;
      if (!channel) return;

      if (!isMetaDataReceivedRef.current) {
        if (typeof event.data === "string") {
          try {
            metadataRef.current = JSON.parse(event.data);
            fileNameRef.current =
              metadataRef.current.fileName || DEFAULT_FILE_NAME;
            fileTypeRef.current =
              metadataRef.current.fileType || DEFAULT_FILE_TYPE;
            fileSizeRef.current = metadataRef.current.fileSize;
            isMetaDataReceivedRef.current = true;

            // Reset progress tracking for new file
            setTransferCompletion(0);
            setReceiverSpeed(0);
            byteReceivedRef.current = 0;
            lastChunkTimeRef.current = Date.now();
            lastBytesReceivedRef.current = 0;
            lastUpdateTimeRef.current = 0;
            lastUpdateTransferRef.current = 0;

            setShowApprove(true);
          } catch (e) {
            console.warn("Error parsing metadata:", e);
          }
        }
        return;
      }

      if (typeof event.data === "string" && event.data === EOF_MARKER) {
        const expected = fileSizeRef.current;
        const actual = byteReceivedRef.current;
        const mismatch = expected != null && actual !== expected;

        if (writableStreamRef.current) {
          if (
            mismatch &&
            typeof writableStreamRef.current.abort === "function"
          ) {
            try {
              await writableStreamRef.current.abort();
            } catch (err) {
              console.error("Error aborting writable stream:", err);
            }
          } else {
            await writableStreamRef.current.close();
          }
        }

        if (mismatch) {
          console.error(
            `Transfer size mismatch: expected ${expected} bytes, received ${actual} bytes`
          );
          setTransferError(
            `Transfer failed: expected ${expected} bytes, got ${actual}`
          );
          setTransferCompletion(0);
        } else {
          setTransferCompletion(100);
          setTransferError(null);
          channel.send(EOF_ACK_MARKER);
        }

        // Reset state after file transfer
        resetTransferState();
        writableStreamRef.current = null;
        setIsReadyToDownload(false);
        setShowApprove(false);

        const reportMessage = { status: false };
        channel.send(JSON.stringify(reportMessage));
        return;
      }

      if (event.data && writableStreamRef.current) {
        await writableStreamRef.current.write(event.data);
        const now = Date.now();
        const chunkSize = event.data.size || event.data.byteLength || 0;
        byteReceivedRef.current += chunkSize;

        // Calculate speed
        const timeDelta = (now - (lastChunkTimeRef.current || now)) / 1000;
        if (timeDelta > 0) {
          let instSpeed = (chunkSize * 8) / (timeDelta * 1024 * 1024);
          instSpeed = parseFloat(instSpeed).toFixed(2);
          if (now - lastUpdateTimeRef.current >= SPEED_UPDATE_INTERVAL_MS) {
            setReceiverSpeed(parseFloat(instSpeed));
            lastUpdateTimeRef.current = now;
          }
        }

        lastChunkTimeRef.current = now;

        // Update progress more frequently for real-time feel.
        // Note: the legacy code updated progress on every chunk on the receive
        // side (no PROGRESS_UPDATE_INTERVAL_MS throttle); preserved as-is.
        const progress =
          (byteReceivedRef.current / fileSizeRef.current) * 100;
        setTransferCompletion(parseFloat(progress));
        return;
      }

      console.warn("Unknown data received");
    },
    [
      dataChannelRef,
      resetTransferState,
      setIsReadyToDownload,
      setReceiverSpeed,
      setShowApprove,
      setTransferCompletion,
      setTransferError,
    ]
  );

  // Wires the freshly created (or newly received) RTCDataChannel up to the
  // receive-side handlers. Called from useSignaling.peerRef.ondatachannel.
  const attachToDataChannel = useCallback(
    (channel) => {
      dataChannelRef.current = channel;
      channel.binaryType = "arraybuffer";
      // Start with a clean per-channel buffer of any previously-received data.
      // The legacy code did `receivedData.current = []` here; that array was
      // never appended to anywhere, so we drop it.
      channel.onopen = () => {
        setDataChOpen(true);
        lastChunkTimeRef.current = Date.now();
        lastBytesReceivedRef.current = 0;
      };
      channel.onmessage = handleMessage;
      channel.onclose = async () => {
        setDataChOpen(false);
        if (onChannelClose) onChannelClose();
      };
    },
    [dataChannelRef, handleMessage, onChannelClose, setDataChOpen]
  );

  // File picker effect: when the user clicks "approve", showSaveFilePicker is
  // opened. If they cancel we revert isReadyToDownload and notify the sender.
  useEffect(() => {
    if (!isReadyToDownload) return;

    const askForLocation = async () => {
      const channel = dataChannelRef.current;
      try {
        const ext = fileNameRef.current.split(".").pop();
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: fileNameRef.current,
          types: [
            {
              description: " Received File",
              accept: { [fileTypeRef.current]: ["." + ext] },
            },
          ],
        });
        writableStreamRef.current = await fileHandle.createWritable();
        const reportMessage = { status: true };
        const sentData = JSON.stringify(reportMessage);
        channel.send(sentData);
      } catch {
        setIsReadyToDownload(false);
        if (channel && channel.readyState === "open") {
          const reportMessage = { status: false };
          const sentData = JSON.stringify(reportMessage);
          channel.send(sentData);
        }
      }
    };
    askForLocation();
  }, [isReadyToDownload, dataChannelRef, setIsReadyToDownload]);

  return {
    attachToDataChannel,
    resetReceiverState: resetAll,
  };
}
