// socket.io-client options shared between initial connect and generateNewId reconnect.
export const socketIoOptions = {
  transports: ["websocket"],
  upgrade: false,
  timeout: 10000, // 10 second timeout
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
};
