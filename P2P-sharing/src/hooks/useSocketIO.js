import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

/**
 * useSocketIO — Manages socket.io lifecycle (connection, reconnection, cleanup).
 * 
 * Handles:
 * - Initial socket.io connection with config
 * - Connection state tracking (connected/error)
 * - Reconnection logic for generateNewId() reuse
 * - Cleanup on unmount or before reinitialization
 * - Custom handler attachment via onConnectRef callback ref (called SYNCHRONOUSLY after every connect/reconnect)
 * 
 * @param {string} serverURL - Socket server URL from env
 * @param {Object} [options] - Optional configuration
 * @param {Function} [options.onConnectRef] - Ref to a function called when socket connects (for attaching custom handlers)
 * @returns {{ socketRef: RefObject, connected: boolean, error: boolean, reconnect: Function }}
 */
function useSocketIO(serverURL, options = {}) {
  const { onConnectRef } = options || {};
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(false);

  /**
   * Internal: Attach connection state handlers to a socket instance.
   * Called after every socket creation (initial mount + reconnect).
   */
  const attachConnectionHandlers = useCallback((socket) => {
    if (!socket) return;

    socket.on("connect", () => {
      setConnected(true);
      setError(false);
      // Call handler on connect for initial mount
      if (onConnectRef?.current) {
        onConnectRef.current(socket);
      }
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setConnected(false);
      setError(true);
    });

    socket.on("reconnect", (attemptNumber) => {
      setConnected(true);
      setError(false);
    });

    socket.on("reconnect_error", (err) => {
      console.error("Socket reconnection error:", err);
      setConnected(false);
      setError(true);
    });
  }, []);

  /**
   * Internal: Cleanup existing socket before creating a new one.
   */
  const cleanupSocket = useCallback(() => {
    if (socketRef.current) {
      // Remove all listeners to prevent stale callbacks
      socketRef.current.off("connect");
      socketRef.current.off("disconnect");
      socketRef.current.off("connect_error");
      socketRef.current.off("reconnect");
      socketRef.current.off("reconnect_error");
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  /**
   * Create a new socket.io connection.
   * Used on initial mount and when reconnecting (generateNewId).
   */
  const createSocket = useCallback(() => {
    cleanupSocket();

    const newSocket = io(serverURL, {
      transports: ["websocket"],
      upgrade: false,
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = newSocket;
    attachConnectionHandlers(newSocket);

    // Handle case where socket is already connected on mount (e.g., page refresh)
    if (newSocket.connected) {
      setConnected(true);
      setError(false);
    }
  }, [serverURL, cleanupSocket, attachConnectionHandlers]);

  // Initial socket creation on mount
  useEffect(() => {
    createSocket();

    return () => {
      cleanupSocket();
    };
  }, [createSocket, cleanupSocket]);



  /**
   * Reinitialize the socket connection.
   * Called by generateNewId() to tear down and recreate everything.
   */
  const reconnect = useCallback(() => {
    createSocket();
  }, [createSocket]);

  return { socketRef, connected, error, reconnect };
}

export default useSocketIO;
