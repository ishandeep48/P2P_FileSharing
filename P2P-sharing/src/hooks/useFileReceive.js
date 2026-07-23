import { useCallback } from "react";
import { PROGRESS_POLL_INTERVAL } from "../context/P2PContext";

/**
 * useFileReceive - Encapsulates WebRTC file receive logic with chunked writing, progress tracking, and save dialog.
 * 
 * This hook extracts the entire file receiving logic from App.jsx's `dataChannel.onmessage` handler, including:
 * - Metadata parsing (JSON) for fileName, fileType, fileSize
 * - File data chunk writing to writable stream via File System Access API
 * - Progress percentage calculation (throttled to configurable interval)
 * - Speed calculation in Mbps (throttled to PROGRESS_POLL_INTERVAL)
 * - EOF handling and ACK signaling
 * - Save file picker dialog integration
 * 
 * @param {Object} config - All dependencies from App.jsx that this hook needs
 * @param {React.RefObject} config.dataChannel - Ref to the RTCDataChannel instance (receiver side)
 * @param {React.RefObject} config.writableStream - Ref to the WritableStream for file writing
 * @param {React.RefObject} config.fileNameRef - Ref storing received file name
 * @param {React.RefObject} config.fileTypeRef - Ref storing received file type
 * @param {React.RefObject} config.fileSizeRef - Ref storing total file size
 * @param {React.RefObject} config.metadataRef - Ref storing parsed metadata object
 * @param {React.RefObject} config.isMetaDataReceivedRef - Ref tracking if metadata has been processed
 * @param {Function} config.setTransferCompletion - State setter for download progress (0-100)
 * @param {Function} config.setReceiverSpeed - State setter for current receive speed (MB/s)
 * @param {Function} config.setShowApprove - State setter to show approval dialog
 * @param {Function} config.setIsReadyToDownload - State setter to trigger save file picker
 * @param {React.RefObject} config.byteSentRef - Ref tracking total bytes received (used for progress calc)
 * @param {React.RefObject} config.lastChunkTimeRef - Ref for last chunk timestamp
 * @param {React.RefObject} config.lastBytesReceivedRef - Ref for last byte count snapshot
 * @param {React.RefObject} config.lastUpdateTimeRef - Ref for speed update throttle
 * @param {React.RefObject} config.lastUpdateTransferRef - Ref for progress update throttle
 * 
 * @returns {Object} - Contains file receive functions and state management
 * @returns {Function} return.handleMessage - Function to handle incoming data channel messages
 * @returns {Function} return.askForLocation - Async function to trigger save file picker dialog
 */
function useFileReceive(config) {
  const {
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
  } = config;

  /**
   * Handles incoming data channel messages for file receiving.
   * 
   * Processes three types of messages:
   * 1. Metadata (JSON string) - Sets up file info and shows approval dialog
   * 2. File chunks (ArrayBuffer/Blob) - Writes to writable stream with progress tracking
   * 3. EOF marker ("__EOF__") - Closes stream, sends ACK, resets state
   * 
   * @param {Event} event - The data channel message event containing the received data
   */
  const handleMessage = useCallback(
    async (event) => {
      // ─── Case 1: Receive Metadata ──────────────────────────────────────
      if (!isMetaDataReceivedRef.current) {
        if (typeof event.data === "string") {
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

            // Show approval dialog to user
            setShowApprove(true);
          } catch (e) {
            console.warn("Error parsing metadata:", e);
          }
        }
      }
      // ─── Case 2: Receive EOF Marker ────────────────────────────────────
      else if (typeof event.data === "string" && event.data === "__EOF__") {
        // Close the writable stream
        if (writableStream.current) {
          await writableStream.current.close();
        }

        setTransferCompletion(100);
        
        // Send ACK back to sender
        dataChannel.current.send("__EOF_ACK__");

        // Reset state after file transfer completes
        isMetaDataReceivedRef.current = false;
        byteSentRef.current = 0;
        lastChunkTimeRef.current = null;
        lastBytesReceivedRef.current = 0;
        lastUpdateTimeRef.current = 0;
        lastUpdateTransferRef.current = 0;
        writableStream.current = null;
        setIsReadyToDownload(false);
        setShowApprove(false);

        // Notify sender to stop sending (cleanup)
        const reportMessage = { status: false };
        dataChannel.current.send(JSON.stringify(reportMessage));
      }
      // ─── Case 3: Receive File Data Chunks ──────────────────────────────
      else if (event.data && writableStream.current) {
        try {
          await writableStream.current.write(event.data);

          const now = Date.now();
          const chunkSize = event.data.size || event.data.byteLength || 0;
          byteSentRef.current += chunkSize;

          // ─── Speed Calculation (throttled to configurable interval) ─
          const timeDelta = (now - (lastChunkTimeRef.current || now)) / 1000;
          if (timeDelta > 0) {
            let instSpeed = (chunkSize * 8) / (timeDelta * 1024 * 1024);
            instSpeed = parseFloat(instSpeed).toFixed(2);

            // Only update speed display at configured interval to avoid excessive re-renders
            if (now - lastUpdateTimeRef.current >= PROGRESS_POLL_INTERVAL) {
              setReceiverSpeed(parseFloat(instSpeed));
              lastUpdateTimeRef.current = now;
            }
          }

          lastChunkTimeRef.current = now;

          // ─── Progress Update (throttled to configurable interval) ─────
          if (now - lastUpdateTransferRef.current >= PROGRESS_POLL_INTERVAL) {
            const progress = (byteSentRef.current / fileSizeRef.current) * 100;
            setTransferCompletion(parseFloat(progress));
            lastUpdateTransferRef.current = now;
          }
        } catch (e) {
          console.error("Error writing chunk to stream:", e);
        }
      } else {
        console.warn("Unknown data received or no writable stream available");
      }
    },
    [
      isMetaDataReceivedRef,
      metadataRef,
      fileNameRef,
      fileTypeRef,
      fileSizeRef,
      setTransferCompletion,
      setReceiverSpeed,
      setShowApprove,
      setIsReadyToDownload,
      byteSentRef,
      lastChunkTimeRef,
      lastBytesReceivedRef,
      lastUpdateTimeRef,
      writableStream,
    ]
  );

  /**
   * Triggers the browser's save file picker dialog using File System Access API.
   * 
   * This function is called when metadata is received and user approves the download.
   * It creates a WritableStream for writing incoming file chunks.
   * 
   * If the user cancels or an error occurs, it sends a rejection message to the sender.
   */
  const askForLocation = useCallback(async () => {
    try {
      // Extract file extension from filename
      const ext = fileNameRef.current.split(".").pop();

      // Trigger browser save dialog with suggested name and type filter
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: fileNameRef.current,
        types: [
          {
            description: "Received File",
            accept: { [fileTypeRef.current]: ["." + ext] },
          },
        ],
      });

      // Create writable stream for file chunks
      writableStream.current = await fileHandle.createWritable();

      // Notify sender that receiver is ready to receive data
      const reportMessage = { status: true };
      dataChannel.current.send(JSON.stringify(reportMessage));
    } catch (err) {
      // User cancelled the dialog or an error occurred
      setIsReadyToDownload(false);

      // If data channel is still open, send rejection message to sender
      if (dataChannel.current && dataChannel.current.readyState === "open") {
        const reportMessage = { status: false };
        dataChannel.current.send(JSON.stringify(reportMessage));
      }
    }
  }, [fileNameRef, fileTypeRef, writableStream, setIsReadyToDownload]);

  return { handleMessage, askForLocation };
}

export default useFileReceive;
