// RTCPeerConnection configuration. Reads TURN credentials from Vite env vars.
export const rtcConfig = {
  iceTransportPolicy: "all",
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun.services.mozilla.com" },
    {
      urls: import.meta.env.VITE_TURN_SERVER,
      username: import.meta.env.VITE_TURN_USERNAME,
      credential: import.meta.env.VITE_TURN_PASSWORD,
    },
  ],
  // Optimized WebRTC configuration for better performance
  iceCandidatePoolSize: 10,
  bundlePolicy: "max-bundle",
  rtcpMuxPolicy: "require",
  iceConnectionState: "checking",
};
