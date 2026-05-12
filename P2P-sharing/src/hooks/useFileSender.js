import { useCallback, useRef } from "react";
import {
  APPROVAL_POLL_INTERVAL_MS,
  BUFFERED_AMOUNT_LOW_THRESHOLD,
  CHUNK_SIZE,
  EOF_MARKER,
  MAX_BUFFERED_AMOUNT,
  PROGRESS_UPDATE_INTERVAL_MS,
  SPEED_UPDATE_INTERVAL_MS,
  THROTTLE_DELAY,
} from "../lib/constants";

// useFileSender owns the send side of the data channel: metadata send,
// waiting for receiver approval, and the chunked send-loop with backpressure.
//
// It exposes:
//   - uploadFile(file): the main public action.
//   - attachToDataChannel(channel): called by useSignaling immediately after
//     the sender creates the data channel (before the offer is created).
//   - resetSenderState(): wipe per-transfer counters on disconnect.
export default function useFileSender({
  dataChannelRef,
  setDataChOpen,
  setTransferCompletion,
  setSpeed,
  logConnectionType,
}) {
  const canSendDataRef = useRef(false);
  const fileSizeRef = useRef(null);
  const byteSentRef = useRef(0);
  const lastSenderChunkTimeRef = useRef(null);
  const lastSenderBytesSentRef = useRef(0);
  const lastUpdateTimeRef = useRef(0);
  const lastUpdateTransferRef = useRef(0);

  const resetSenderState = useCallback(() => {
    canSendDataRef.current = false;
    fileSizeRef.current = null;
    byteSentRef.current = 0;
    lastSenderChunkTimeRef.current = null;
    lastSenderBytesSentRef.current = 0;
    lastUpdateTimeRef.current = 0;
    lastUpdateTransferRef.current = 0;
  }, []);

  // Wires up the *sender* side of the channel. Equivalent to the legacy
  // dataChannelEvents() + senderDataChannelEvents() pair, plus the binaryType
  // and bufferedAmountLowThreshold settings.
  const attachToDataChannel = useCallback(
    (channel) => {
      dataChannelRef.current = channel;
      channel.binaryType = "arraybuffer";
      channel.bufferedAmountLowThreshold = BUFFERED_AMOUNT_LOW_THRESHOLD;

      channel.onopen = () => {
        setDataChOpen(true);
      };
      channel.onerror = (error) => {
        setDataChOpen(false);
        console.error("DataChannel error:", error);
      };
      channel.onbufferedamountlow = () => {
        // intentionally empty: matches legacy behaviour. Optimisation for
        // future work, not part of this refactor.
      };

      channel.onmessage = async (event) => {
        if (typeof event.data === "string" && event.data === "__EOF_ACK__") {
          // Receiver ACKed the EOF; nothing further required here.
          return;
        }
        if (typeof event.data === "string") {
          const parsedData = JSON.parse(event.data);
          const { status } = parsedData;
          canSendDataRef.current = !!status;
        }
      };
    },
    [dataChannelRef, setDataChOpen]
  );

  const uploadFile = useCallback(
    async (file) => {
      const channel = dataChannelRef.current;
      if (!channel || channel.readyState !== "open") {
        console.error("Data Channel has not been initialised!!");
        return;
      }

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
      channel.send(metadata);
      if (logConnectionType) {
        logConnectionType(); // Check connection type at start of transfer
      }

      lastSenderChunkTimeRef.current = Date.now();
      lastSenderBytesSentRef.current = 0;

      // Block until receiver sends `{ status: true }` (i.e. user approved
      // and the writable stream is ready).
      await new Promise((res) => {
        const check = () => {
          if (canSendDataRef.current) {
            res();
          } else if (channel.readyState) {
            setTimeout(check, APPROVAL_POLL_INTERVAL_MS);
          } else {
            throw new Error("Data closed while Waiting");
          }
        };
        check();
      });

      const stream = file.stream();
      const reader = stream.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          setTransferCompletion(100);
          channel.send(EOF_MARKER);
          break;
        }
        for (let i = 0; i < value.length; i += CHUNK_SIZE) {
          const chunk = value.slice(i, i + CHUNK_SIZE);
          while (
            channel.readyState === "open" &&
            channel.bufferedAmount > MAX_BUFFERED_AMOUNT
          ) {
            await new Promise((res) => setTimeout(res, THROTTLE_DELAY));
          }
          if (channel.readyState !== "open") {
            throw new Error("Data channel closed during transfer");
          }
          try {
            channel.send(chunk);
            const now = Date.now();
            const bytesSent = byteSentRef.current + chunk.byteLength;
            const timeDelta =
              (now - (lastSenderChunkTimeRef.current || now)) / 1000;
            const bytesDelta =
              bytesSent - (lastSenderBytesSentRef.current || 0);
            if (timeDelta > 0) {
              let instSpeed = (bytesDelta * 8) / (timeDelta * 1024 * 1024);
              instSpeed = parseFloat(instSpeed).toFixed(2);
              if (now - lastUpdateTimeRef.current >= SPEED_UPDATE_INTERVAL_MS) {
                setSpeed(parseFloat(instSpeed));
                lastUpdateTimeRef.current = now;
              }
            }
            lastSenderChunkTimeRef.current = now;
            lastSenderBytesSentRef.current = bytesSent;
            byteSentRef.current += chunk.byteLength;
            if (
              now - lastUpdateTransferRef.current >=
              PROGRESS_UPDATE_INTERVAL_MS
            ) {
              setTransferCompletion(
                parseFloat(
                  (byteSentRef.current / fileSizeRef.current) * 100
                )
              );
              lastUpdateTransferRef.current = now;
            }
          } catch (e) {
            console.error("error sendinfg ", e);
          }
        }
      }
    },
    [dataChannelRef, logConnectionType, setSpeed, setTransferCompletion]
  );

  return {
    uploadFile,
    attachToDataChannel,
    resetSenderState,
  };
}
