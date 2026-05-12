import { useCallback, useRef, useState } from "react";
import { SPEED_UPDATE_INTERVAL_MS } from "../lib/constants";

// Tracks instantaneous transfer speed in Mbps, throttling state updates to
// SPEED_UPDATE_INTERVAL_MS so React doesn't re-render on every chunk.
//
// The math intentionally matches the legacy implementation in App.jsx:
//   speed (Mbps) = (bytesDelta * 8) / (timeDelta * 1024 * 1024)
// where bytesDelta is the chunk size in bytes and timeDelta is in seconds.
export default function useTransferSpeed() {
  const [speedMbps, setSpeedMbps] = useState(0);
  const lastChunkTimeRef = useRef(null);
  const lastBytesRef = useRef(0);
  const lastUpdateTimeRef = useRef(0);
  const totalBytesRef = useRef(0);

  const reset = useCallback(() => {
    setSpeedMbps(0);
    lastChunkTimeRef.current = Date.now();
    lastBytesRef.current = 0;
    lastUpdateTimeRef.current = 0;
    totalBytesRef.current = 0;
  }, []);

  // recordChunk(bytes) updates running totals and possibly publishes a new
  // speed reading. Returns the new total bytes transferred so callers can
  // also use it for progress accounting if desired.
  const recordChunk = useCallback((chunkBytes) => {
    const now = Date.now();
    totalBytesRef.current += chunkBytes;
    const prevTime = lastChunkTimeRef.current || now;
    const timeDelta = (now - prevTime) / 1000;

    if (timeDelta > 0) {
      // Match legacy behaviour: instantaneous speed from this chunk alone.
      let instSpeed = (chunkBytes * 8) / (timeDelta * 1024 * 1024);
      instSpeed = parseFloat(parseFloat(instSpeed).toFixed(2));
      if (now - lastUpdateTimeRef.current >= SPEED_UPDATE_INTERVAL_MS) {
        setSpeedMbps(instSpeed);
        lastUpdateTimeRef.current = now;
      }
    }
    lastChunkTimeRef.current = now;
    lastBytesRef.current = totalBytesRef.current;
    return totalBytesRef.current;
  }, []);

  return { speedMbps, recordChunk, reset };
}
