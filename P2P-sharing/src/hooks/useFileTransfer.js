import { useCallback } from "react";
import { PROGRESS_POLL_INTERVAL } from "../context/P2PContext";

/**
 * useFileTransfer - Encapsulates WebRTC file upload logic with chunking, throttling, and progress tracking.
 * 
 * This hook extracts the entire `uploadFile()` function from App.jsx, including:
 * - File stream reading and 256KB chunking
 * - Buffer management (15MB MAX_BUFFERED_AMOUNT throttling)
 * - Progress percentage calculation (throttled to configurable interval)
 * - Speed calculation in Mbps (throttled to PROGRESS_POLL_INTERVAL)
 * - Metadata sending and EOF signaling
 * 
 * @param {Object} config - All dependencies from App.jsx that this hook needs
 * @param {React.RefObject} config.dataChannel - Ref to the RTCDataChannel instance
 * @param {Function} config.setTransferCompletion - State setter for upload progress (0-100)
 * @param {Function} config.setSpeed - State setter for current transfer speed (MB/s)
 * @param {React.RefObject} config.byteSentRef - Ref tracking total bytes sent
 * @param {React.RefObject} config.lastSenderChunkTimeRef - Ref for last chunk timestamp
 * @param {React.RefObject} config.lastSenderBytesSentRef - Ref for last byte count snapshot
 * @param {React.RefObject} config.lastUpdateTimeRef - Ref for speed update throttle
 * @param {React.RefObject} config.lastUpdateTransferRef - Ref for progress update throttle
 * @param {React.RefObject} config.canSendData - Ref indicating if data channel is ready
 * @param {React.RefObject} config.fileSizeRef - Ref storing total file size
 * @param {Function} [config.logConnectionType] - Optional callback to log connection type at transfer start
 * 
 * @returns {Object} - Contains the uploadFile function
 * @returns {Function} return.uploadFile - Async function to initiate file upload
 */
function useFileTransfer(config) {
  const {
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
  } = config;

  /**
   * Uploads a file over the data channel with chunking and progress tracking.
   * 
   * @param {File} file - The File object to upload (from <input type="file"> or drag-drop)
   * @returns {Promise<void>} Resolves when file transfer is complete (EOF sent)
   */
  const uploadFile = useCallback(
    async (file) => {
      // Validate data channel is open before proceeding
      if (!dataChannel.current || dataChannel.current.readyState !== "open") {
        console.error("Data Channel has not been initialised!!");
        return;
      }

      // ─── Configuration Constants ──────────────────────────────────────
      const MAX_BUFFERED_AMOUNT = 15 * 1024 * 1024; // 15 MB - throttle when buffer exceeds this
      const CHUNK_SIZE = 256 * 1024;                 // 256 KB - size of each chunk to send
      const THROTTLE_DELAY = 5;                      // 5ms - delay between buffer checks

      // ─── Reset Progress Tracking State ────────────────────────────────
      setTransferCompletion(0);
      setSpeed(0);
      byteSentRef.current = 0;
      lastSenderChunkTimeRef.current = Date.now();
      lastSenderBytesSentRef.current = 0;
      lastUpdateTimeRef.current = 0;
      lastUpdateTransferRef.current = 0;

      // ─── Send File Metadata ──────────────────────────────────────────
      const metadata = JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });
      fileSizeRef.current = file.size;
      dataChannel.current.send(metadata);

      // Log connection type at transfer start (optional)
      logConnectionType?.();

      // ─── Wait for Data Channel to Be Ready ───────────────────────────
      await new Promise((resolve, reject) => {
        const check = () => {
          if (canSendData.current) {
            resolve();
          } else if (dataChannel.current.readyState === "open") {
            setTimeout(check, 100);
          } else {
            reject(new Error("Data closed while waiting"));
          }
        };
        check();
      });

      // ─── Stream File in Chunks ──────────────────────────────────────
      const stream = file.stream();
      const reader = stream.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            // Transfer complete - send EOF marker and update progress to 100%
            setTransferCompletion(100);
            dataChannel.current.send("__EOF__");
            break;
          }

          // Split each read chunk into smaller pieces for controlled sending
          for (let i = 0; i < value.length; i += CHUNK_SIZE) {
            const chunk = value.slice(i, i + CHUNK_SIZE);

            // ─── Buffer Throttling ──────────────────────────────────────
            // Wait if the data channel's send buffer is too full
            while (
              dataChannel.current.readyState === "open" &&
              dataChannel.current.bufferedAmount > MAX_BUFFERED_AMOUNT
            ) {
              await new Promise((res) => setTimeout(res, THROTTLE_DELAY));
            }

            // Check if channel closed during throttle wait
            if (dataChannel.current.readyState !== "open") {
              throw new Error("Data channel closed during transfer");
            }

            try {
              dataChannel.current.send(chunk);

              // ─── Speed Calculation ──────────────────────────────────
              const now = Date.now();
              const bytesSent = byteSentRef.current + chunk.byteLength;
              const timeDelta = (now - (lastSenderChunkTimeRef.current || now)) / 1000;
              const bytesDelta = bytesSent - (lastSenderBytesSentRef.current || 0);

              // Only update speed if enough time has passed and throttle allows
              if (timeDelta > 0) {
                const instSpeed = parseFloat(
                  ((bytesDelta * 8) / (timeDelta * 1024 * 1024)).toFixed(2)
                );
                if (now - lastUpdateTimeRef.current >= PROGRESS_POLL_INTERVAL) {
                  setSpeed(instSpeed);
                  lastUpdateTimeRef.current = now;
                }
              }

              // ─── Update Tracking Refs ───────────────────────────────
              lastSenderChunkTimeRef.current = now;
              lastSenderBytesSentRef.current = bytesSent;
              byteSentRef.current += chunk.byteLength;

              // ─── Progress Update (throttled to configurable interval) ──
              if (now - lastUpdateTransferRef.current >= PROGRESS_POLL_INTERVAL) {
                setTransferCompletion(
                  parseFloat((byteSentRef.current / fileSizeRef.current) * 100)
                );
                lastUpdateTransferRef.current = now;
              }
            } catch (e) {
              console.error("Error sending chunk:", e);
            }
          }
        }
      } finally {
        // Always release the reader lock, even if an error occurs
        reader.releaseLock();
      }
    },
    [
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
    ]
  );

  return { uploadFile };
}

export default useFileTransfer;