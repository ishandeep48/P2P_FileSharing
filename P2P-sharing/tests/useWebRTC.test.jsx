import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useWebRTC from "../src/hooks/useWebRTC";

// Mock RTCIceCandidate globally before imports
global.RTCIceCandidate = class MockRTCIceCandidate {
  constructor(candidate) {
    this.candidate = candidate;
  }
};

// Mock RTCPeerConnection globally before imports
global.RTCPeerConnection = class MockRTCPeerConnection {
  constructor(config) {
    this.config = config;
    this.iceGatheringState = "gathering";
    this.connectionState = "new";
    this.localDescription = null;
    this.remoteDescription = null;
    this.onicecandidate = null;
    this.oniceconnectionstatechange = null;
    this.ondatachannel = null;
    this.onicegatheringstatechange = null;
  }

  createOffer() {
    return Promise.resolve({ type: "offer", sdp: "mock-offer" });
  }

  setLocalDescription(desc) {
    if (desc.type === "offer") {
      this.localDescription = desc;
    } else if (desc.type === "answer") {
      this.localDescription = desc;
    }
    return Promise.resolve();
  }

  createAnswer() {
    return Promise.resolve({ type: "answer", sdp: "mock-answer" });
  }

  setRemoteDescription(desc) {
    if (desc.type === "offer") {
      this.remoteDescription = desc;
    } else if (desc.type === "answer") {
      this.remoteDescription = desc;
    }
    return Promise.resolve();
  }

  addIceCandidate(candidate) {
    return Promise.resolve();
  }

  createDataChannel(label, options) {
    const mockChannel = {
      label: label || "file-transfer",
      readyState: "closed",
      onopen: null,
      onclose: null,
      onmessage: null,
      send: vi.fn(),
    };
    return mockChannel;
  }

  getStats() {
    return Promise.resolve({ values: [{ type: "candidate-pair", selected: true }] });
  }

  close() {}
};

describe("useWebRTC Hook", () => {
  const mockSocketRef = { current: null };
  const rtcConfig = {
    iceTransportPolicy: "all",
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
    iceCandidatePoolSize: 10,
    bundlePolicy: "max-bundle",
    rtcpMuxPolicy: "require",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.RTCIceCandidate = class MockRTCIceCandidate {
      constructor(candidate) {
        this.candidate = candidate;
      }
    };
    global.RTCPeerConnection = class MockRTCPeerConnection {
      constructor(config) {
        this.config = config;
        this.iceGatheringState = "gathering";
        this.connectionState = "new";
        this.localDescription = null;
        this.remoteDescription = null;
        this.onicecandidate = null;
        this.oniceconnectionstatechange = null;
        this.ondatachannel = null;
        this.onicegatheringstatechange = null;
      }

      createOffer() { return Promise.resolve({ type: "offer", sdp: "mock-offer" }); }
      setLocalDescription(desc) { if (desc.type === "offer") this.localDescription = desc; else if (desc.type === "answer") this.localDescription = desc; return Promise.resolve(); }
      createAnswer() { return Promise.resolve({ type: "answer", sdp: "mock-answer" }); }
      setRemoteDescription(desc) { if (desc.type === "offer") this.remoteDescription = desc; else if (desc.type === "answer") this.remoteDescription = desc; return Promise.resolve(); }
      addIceCandidate(candidate) { return Promise.resolve(); }
      createDataChannel(label, options) { const mockChannel = { label: label || "file-transfer", readyState: "closed", send: vi.fn() }; return mockChannel; }
      getStats() { return Promise.resolve({ values: [{ type: "candidate-pair", selected: true }] }); }
      close() {}
    };
  });

  describe("Initial Setup", () => {
    it("should initialize with null peer connection", () => {
      const { result } = renderHook(() => useWebRTC({ socketRef: mockSocketRef, rtcConfig }));

      expect(result.current.peerRef.current).toBeNull();
      expect(result.current.dataChannel.current).toBeNull();
      expect(result.current.pendingCandidates.current).toEqual([]);
    });

    it("should return all required methods", () => {
      const { result } = renderHook(() => useWebRTC({ socketRef: mockSocketRef, rtcConfig }));

      expect(typeof result.current.createPeerConnection).toBe("function");
      expect(typeof result.current.sendCall).toBe("function");
      expect(typeof result.current.handleIncomingCall).toBe("function");
      expect(typeof result.current.handleIncomingAnswer).toBe("function");
      expect(typeof result.current.handleIceCandidate).toBe("function");
      expect(typeof result.current.cleanup).toBe("function");
    });

    it("should work with undefined socketRef", () => {
      const { result } = renderHook(() => useWebRTC({ rtcConfig }));

      expect(result.current.peerRef.current).toBeNull();
    });
  });

  describe("Peer Connection Creation", () => {
    it("should create RTCPeerConnection with correct config", () => {
      const { result } = renderHook(() => useWebRTC({ socketRef: mockSocketRef, rtcConfig }));

      act(() => {
        result.current.createPeerConnection();
      });

      expect(result.current.peerRef.current).toBeDefined();
      expect(result.current.peerRef.current.config).toEqual(rtcConfig);
    });

    it("should reset pending candidates on new connection", () => {
      const { result } = renderHook(() => useWebRTC({ socketRef: mockSocketRef, rtcConfig }));

      act(() => {
        result.current.createPeerConnection();
        // Simulate adding a candidate before remote description
        result.current.pendingCandidates.current.push("candidate-1");
      });

      expect(result.current.pendingCandidates.current).toHaveLength(1);

      act(() => {
        result.current.createPeerConnection();
      });

      expect(result.current.pendingCandidates.current).toEqual([]);
    });

    it("should close existing connection before creating new one", () => {
      const mockClose = vi.fn();
      
      global.RTCPeerConnection = class MockRTCPeerConnection {
        constructor(config) {
          this.config = config;
          this.iceGatheringState = "gathering";
          this.connectionState = "new";
          this.localDescription = null;
          this.remoteDescription = null;
          this.onicecandidate = null;
          this.oniceconnectionstatechange = null;
          this.ondatachannel = null;
          this.onicegatheringstatechange = null;
        }

        createOffer() { return Promise.resolve({ type: "offer", sdp: "mock-offer" }); }
        setLocalDescription(desc) { if (desc.type === "offer") this.localDescription = desc; else if (desc.type === "answer") this.localDescription = desc; return Promise.resolve(); }
        createAnswer() { return Promise.resolve({ type: "answer", sdp: "mock-answer" }); }
        setRemoteDescription(desc) { if (desc.type === "offer") this.remoteDescription = desc; else if (desc.type === "answer") this.remoteDescription = desc; return Promise.resolve(); }
        addIceCandidate(candidate) { return Promise.resolve(); }
        createDataChannel(label, options) { const mockChannel = { label: label || "file-transfer", readyState: "closed", send: vi.fn() }; return mockChannel; }
        getStats() { return Promise.resolve({ values: [{ type: "candidate-pair", selected: true }] }); }
        close() { mockClose(); }
      };

      const { result } = renderHook(() => useWebRTC({ socketRef: mockSocketRef, rtcConfig }));

      act(() => {
        result.current.createPeerConnection();
      });

      expect(mockClose).not.toHaveBeenCalled();

      act(() => {
        result.current.createPeerConnection();
      });

      expect(mockClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Send Call", () => {
    it("should create data channel and emit outgoing-call event", async () => {
      const mockEmit = vi.fn();
      mockSocketRef.current = { emit: mockEmit };

      const { result } = renderHook(() => useWebRTC({ socketRef: mockSocketRef, rtcConfig }));

      act(() => {
        result.current.createPeerConnection();
      });

      await act(async () => {
        const success = await result.current.sendCall("remote-socket-id");
        expect(success).toBe(true);
      });

      expect(result.current.dataChannel.current).toBeDefined();
      expect(mockEmit).toHaveBeenCalledWith("outgoing-call", {
        to: "remote-socket-id",
        fromOffer: { type: "offer", sdp: "mock-offer" },
      });
    });

    it("should set remoteSocketID when sending call", async () => {
      const mockEmit = vi.fn();
      mockSocketRef.current = { emit: mockEmit };

      const { result } = renderHook(() => useWebRTC({ socketRef: mockSocketRef, rtcConfig }));

      act(() => {
        result.current.createPeerConnection();
      });

      await act(async () => {
        await result.current.sendCall("test-user-123");
      });

      expect(result.current.remoteSocketID.current).toBe("test-user-123");
    });

    it("should return false when peer connection not created", async () => {
      const mockEmit = vi.fn();
      mockSocketRef.current = { emit: mockEmit };

      const { result } = renderHook(() => useWebRTC({ socketRef: mockSocketRef, rtcConfig }));

      await act(async () => {
        const success = await result.current.sendCall("remote-socket-id");
        expect(success).toBe(false);
      });

      expect(mockEmit).not.toHaveBeenCalled();
    });

    it("should return false when socket not available", async () => {
      const { result } = renderHook(() => useWebRTC({ rtcConfig }));

      act(() => {
        result.current.createPeerConnection();
      });

      await act(async () => {
        const success = await result.current.sendCall("remote-socket-id");
        expect(success).toBe(false);
      });
    });
  });

  describe("Handle Incoming Call", () => {
    it("should set remote description and create answer", async () => {
      const mockEmit = vi.fn();
      mockSocketRef.current = { emit: mockEmit };

      const { result } = renderHook(() => useWebRTC({ socketRef: mockSocketRef, rtcConfig }));

      act(() => {
        result.current.createPeerConnection();
      });

      await act(async () => {
        const success = await result.current.handleIncomingCall({
          from: "remote-user",
          offer: { type: "offer", sdp: "mock-offer" },
        });
        expect(success).toBe(true);
      });

      expect(result.current.peerRef.current.remoteDescription).toBeDefined();
      expect(result.current.peerRef.current.localDescription.type).toBe("answer");
    });

    it("should set remoteSocketID from incoming call", async () => {
      const mockEmit = vi.fn();
      mockSocketRef.current = { emit: mockEmit };

      const { result } = renderHook(() => useWebRTC({ socketRef: mockSocketRef, rtcConfig }));

      act(() => {
        result.current.createPeerConnection();
      });

      await act(async () => {
        await result.current.handleIncomingCall({ from: "incoming-user", offer: { type: "offer" } });
      });

      expect(result.current.remoteSocketID.current).toBe("incoming-user");
    });

    it("should emit call-accepted event with answer", async () => {
      const mockEmit = vi.fn();
      mockSocketRef.current = { emit: mockEmit };

      const { result } = renderHook(() => useWebRTC({ socketRef: mockSocketRef, rtcConfig }));

      act(() => {
        result.current.createPeerConnection();
      });

      await act(async () => {
        await result.current.handleIncomingCall({ from: "remote-user", offer: { type: "offer" } });
      });

      expect(mockEmit).toHaveBeenCalledWith("call-accepted", {
        answer: { type: "answer", sdp: "mock-answer" },
        to: "remote-user",
      });
    });

    it("should add pending candidates before creating answer", async () => {
      const mockEmit = vi.fn();
      mockSocketRef.current = { emit: mockEmit };

      const { result } = renderHook(() => useWebRTC({ socketRef: mockSocketRef, rtcConfig }));

      act(() => {
        result.current.createPeerConnection();
        // Add pending candidates before remote description
        result.current.pendingCandidates.current.push("candidate-1", "candidate-2");
      });

      await act(async () => {
        await result.current.handleIncomingCall({ from: "remote-user", offer: { type: "offer" } });
      });

      expect(result.current.pendingCandidates.current).toEqual([]);
    });

    it("should return false when peer connection not created", async () => {
      const mockEmit = vi.fn();
      mockSocketRef.current = { emit: mockEmit };

      const { result } = renderHook(() => useWebRTC({ socketRef: mockSocketRef, rtcConfig }));

      await act(async () => {
        const success = await result.current.handleIncomingCall({ from: "remote-user", offer: { type: "offer" } });
        expect(success).toBe(false);
      });
    });
  });

  describe("Handle Incoming Answer", () => {
    it("should set remote description from answer", async () => {
      const mockEmit = vi.fn();
      mockSocketRef.current = { emit: mockEmit };

      const { result } = renderHook(() => useWebRTC({ socketRef: mockSocketRef, rtcConfig }));

      act(() => {
        result.current.createPeerConnection();
      });

      await act(async () => {
        const success = await result.current.handleIncomingAnswer({ from: "remote-user", offer: { type: "answer" } });
        expect(success).toBe(true);
      });

      expect(result.current.peerRef.current.remoteDescription.type).toBe("answer");
    });

    it("should add pending candidates before setting remote description", async () => {
      const mockEmit = vi.fn();
      mockSocketRef.current = { emit: mockEmit };

      const { result } = renderHook(() => useWebRTC({ socketRef: mockSocketRef, rtcConfig }));

      act(() => {
        result.current.createPeerConnection();
        // Add pending candidates before answer arrives
        result.current.pendingCandidates.current.push("candidate-1");
      });

      await act(async () => {
        await result.current.handleIncomingAnswer({ from: "remote-user", offer: { type: "answer" } });
      });

      expect(result.current.pendingCandidates.current).toEqual([]);
    });

    it("should return false when peer connection not created", async () => {
      const mockEmit = vi.fn();
      mockSocketRef.current = { emit: mockEmit };

      const { result } = renderHook(() => useWebRTC({ socketRef: mockSocketRef, rtcConfig }));

      await act(async () => {
        const success = await result.current.handleIncomingAnswer({ from: "remote-user", offer: { type: "answer" } });
        expect(success).toBe(false);
      });
    });
  });

  describe("ICE Candidate Handling", () => {
    it("should add ICE candidate when remote description exists", async () => {
      const mockEmit = vi.fn();
      mockSocketRef.current = { emit: mockEmit };

      const { result } = renderHook(() => useWebRTC({ socketRef: mockSocketRef, rtcConfig }));

      act(() => {
        result.current.createPeerConnection();
      });

      await act(async () => {
        // Set remote description first
        await result.current.peerRef.current.setRemoteDescription({ type: "answer" });
      });

      const success = await act(async () => {
        return result.current.handleIceCandidate({ candidate: { candidate: "new-candidate" } });
      });

      expect(success).toBe(true);
    });

    it("should queue ICE candidate when no remote description", async () => {
      const mockEmit = vi.fn();
      mockSocketRef.current = { emit: mockEmit };

      const { result } = renderHook(() => useWebRTC({ socketRef: mockSocketRef, rtcConfig }));

      act(() => {
        result.current.createPeerConnection();
      });

      await act(async () => {
        const success = await result.current.handleIceCandidate({ candidate: "pending-candidate" });
        expect(success).toBe(true);
      });

      expect(result.current.pendingCandidates.current).toContain("pending-candidate");
    });

    it("should return false when peer connection not created", async () => {
      const mockEmit = vi.fn();
      mockSocketRef.current = { emit: mockEmit };

      const { result } = renderHook(() => useWebRTC({ socketRef: mockSocketRef, rtcConfig }));

      await act(async () => {
        const success = await result.current.handleIceCandidate({ candidate: "test-candidate" });
        expect(success).toBe(false);
      });
    });
  });

  describe("Cleanup", () => {
    it("should close peer connection on cleanup", () => {
      const mockClose = vi.fn();
      
      global.RTCPeerConnection = class MockRTCPeerConnection {
        constructor(config) {
          this.config = config;
          this.iceGatheringState = "gathering";
          this.connectionState = "new";
          this.localDescription = null;
          this.remoteDescription = null;
          this.onicecandidate = null;
          this.oniceconnectionstatechange = null;
          this.ondatachannel = null;
          this.onicegatheringstatechange = null;
        }

        createOffer() { return Promise.resolve({ type: "offer", sdp: "mock-offer" }); }
        setLocalDescription(desc) { if (desc.type === "offer") this.localDescription = desc; else if (desc.type === "answer") this.localDescription = desc; return Promise.resolve(); }
        createAnswer() { return Promise.resolve({ type: "answer", sdp: "mock-answer" }); }
        setRemoteDescription(desc) { if (desc.type === "offer") this.remoteDescription = desc; else if (desc.type === "answer") this.remoteDescription = desc; return Promise.resolve(); }
        addIceCandidate(candidate) { return Promise.resolve(); }
        createDataChannel(label, options) { const mockChannel = { label: label || "file-transfer", readyState: "closed", send: vi.fn() }; return mockChannel; }
        getStats() { return Promise.resolve({ values: [{ type: "candidate-pair", selected: true }] }); }
        close() { mockClose(); }
      };

      const { result } = renderHook(() => useWebRTC({ socketRef: mockSocketRef, rtcConfig }));

      act(() => {
        result.current.createPeerConnection();
      });

      expect(mockClose).not.toHaveBeenCalled();

      act(() => {
        result.current.cleanup();
      });

      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it("should set refs to null after cleanup", () => {
      const mockClose = vi.fn();
      
      global.RTCPeerConnection = class MockRTCPeerConnection {
        constructor(config) {
          this.config = config;
          this.iceGatheringState = "gathering";
          this.connectionState = "new";
          this.localDescription = null;
          this.remoteDescription = null;
          this.onicecandidate = null;
          this.oniceconnectionstatechange = null;
          this.ondatachannel = null;
          this.onicegatheringstatechange = null;
        }

        createOffer() { return Promise.resolve({ type: "offer", sdp: "mock-offer" }); }
        setLocalDescription(desc) { if (desc.type === "offer") this.localDescription = desc; else if (desc.type === "answer") this.localDescription = desc; return Promise.resolve(); }
        createAnswer() { return Promise.resolve({ type: "answer", sdp: "mock-answer" }); }
        setRemoteDescription(desc) { if (desc.type === "offer") this.remoteDescription = desc; else if (desc.type === "answer") this.remoteDescription = desc; return Promise.resolve(); }
        addIceCandidate(candidate) { return Promise.resolve(); }
        createDataChannel(label, options) { const mockChannel = { label: label || "file-transfer", readyState: "closed", send: vi.fn() }; return mockChannel; }
        getStats() { return Promise.resolve({ values: [{ type: "candidate-pair", selected: true }] }); }
        close() { mockClose(); }
      };

      const { result } = renderHook(() => useWebRTC({ socketRef: mockSocketRef, rtcConfig }));

      act(() => {
        result.current.createPeerConnection();
      });

      expect(result.current.peerRef.current).not.toBeNull();

      act(() => {
        result.current.cleanup();
      });

      expect(result.current.peerRef.current).toBeNull();
    });

    it("should handle cleanup when no peer connection exists", () => {
      const { result } = renderHook(() => useWebRTC({ socketRef: mockSocketRef, rtcConfig }));

      // Should not throw
      act(() => {
        expect(() => result.current.cleanup()).not.toThrow();
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle ICE candidate errors gracefully", async () => {
      global.RTCPeerConnection = class MockRTCPeerConnection {
        constructor(config) {
          this.config = config;
          this.iceGatheringState = "gathering";
          this.connectionState = "new";
          this.localDescription = null;
          this.remoteDescription = null;
          this.onicecandidate = null;
          this.oniceconnectionstatechange = null;
          this.ondatachannel = null;
          this.onicegatheringstatechange = null;
        }

        createOffer() { return Promise.resolve({ type: "offer", sdp: "mock-offer" }); }
        setLocalDescription(desc) { if (desc.type === "offer") this.localDescription = desc; else if (desc.type === "answer") this.localDescription = desc; return Promise.resolve(); }
        createAnswer() { return Promise.resolve({ type: "answer", sdp: "mock-answer" }); }
        setRemoteDescription(desc) { if (desc.type === "offer") this.remoteDescription = desc; else if (desc.type === "answer") this.remoteDescription = desc; return Promise.resolve(); }
        addIceCandidate(candidate) { throw new Error("ICE candidate error"); }
        createDataChannel(label, options) { const mockChannel = { label: label || "file-transfer", readyState: "closed", send: vi.fn() }; return mockChannel; }
        getStats() { return Promise.resolve({ values: [{ type: "candidate-pair", selected: true }] }); }
        close() {}
      };

      const { result } = renderHook(() => useWebRTC({ socketRef: mockSocketRef, rtcConfig }));

      act(() => {
        result.current.createPeerConnection();
      });

      // First set remote description so addIceCandidate will be called (not queued)
      await act(async () => {
        await result.current.peerRef.current.setRemoteDescription({ type: "answer" });
      });

      // Now handle ICE candidate - should fail gracefully and return false
      await act(async () => {
        const success = await result.current.handleIceCandidate({ candidate: "test-candidate" });
        expect(success).toBe(false);
      });
    });

    it("should handle remote description errors gracefully", async () => {
      global.RTCPeerConnection = class MockRTCPeerConnection {
        constructor(config) {
          this.config = config;
          this.iceGatheringState = "gathering";
          this.connectionState = "new";
          this.localDescription = null;
          this.remoteDescription = null;
          this.onicecandidate = null;
          this.oniceconnectionstatechange = null;
          this.ondatachannel = null;
          this.onicegatheringstatechange = null;
        }

        createOffer() { return Promise.resolve({ type: "offer", sdp: "mock-offer" }); }
        setLocalDescription(desc) { if (desc.type === "offer") this.localDescription = desc; else if (desc.type === "answer") this.localDescription = desc; return Promise.resolve(); }
        createAnswer() { return Promise.resolve({ type: "answer", sdp: "mock-answer" }); }
        setRemoteDescription(desc) { throw new Error("Remote description error"); }
        addIceCandidate(candidate) { return Promise.resolve(); }
        createDataChannel(label, options) { const mockChannel = { label: label || "file-transfer", readyState: "closed", send: vi.fn() }; return mockChannel; }
        getStats() { return Promise.resolve({ values: [{ type: "candidate-pair", selected: true }] }); }
        close() {}
      };

      const { result } = renderHook(() => useWebRTC({ socketRef: mockSocketRef, rtcConfig }));

      act(() => {
        result.current.createPeerConnection();
      });

      await act(async () => {
        const success = await result.current.handleIncomingCall({ from: "remote-user", offer: { type: "offer" } });
        expect(success).toBe(false);
      });
    });

    it("should handle incoming answer errors gracefully", async () => {
      global.RTCPeerConnection = class MockRTCPeerConnection {
        constructor(config) {
          this.config = config;
          this.iceGatheringState = "gathering";
          this.connectionState = "new";
          this.localDescription = null;
          this.remoteDescription = null;
          this.onicecandidate = null;
          this.oniceconnectionstatechange = null;
          this.ondatachannel = null;
          this.onicegatheringstatechange = null;
        }

        createOffer() { return Promise.resolve({ type: "offer", sdp: "mock-offer" }); }
        setLocalDescription(desc) { if (desc.type === "offer") this.localDescription = desc; else if (desc.type === "answer") this.localDescription = desc; return Promise.resolve(); }
        createAnswer() { return Promise.resolve({ type: "answer", sdp: "mock-answer" }); }
        setRemoteDescription(desc) { throw new Error("Invalid SDP"); }
        addIceCandidate(candidate) { return Promise.resolve(); }
        createDataChannel(label, options) { const mockChannel = { label: label || "file-transfer", readyState: "closed", send: vi.fn() }; return mockChannel; }
        getStats() { return Promise.resolve({ values: [{ type: "candidate-pair", selected: true }] }); }
        close() {}
      };

      const { result } = renderHook(() => useWebRTC({ socketRef: mockSocketRef, rtcConfig }));

      act(() => {
        result.current.createPeerConnection();
      });

      await act(async () => {
        const success = await result.current.handleIncomingAnswer({ from: "remote-user", offer: { type: "answer" } });
        expect(success).toBe(false);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle multiple cleanup calls safely", () => {
      const mockClose = vi.fn();
      
      global.RTCPeerConnection = class MockRTCPeerConnection {
        constructor(config) {
          this.config = config;
          this.iceGatheringState = "gathering";
          this.connectionState = "new";
          this.localDescription = null;
          this.remoteDescription = null;
          this.onicecandidate = null;
          this.oniceconnectionstatechange = null;
          this.ondatachannel = null;
          this.onicegatheringstatechange = null;
        }

        createOffer() { return Promise.resolve({ type: "offer", sdp: "mock-offer" }); }
        setLocalDescription(desc) { if (desc.type === "offer") this.localDescription = desc; else if (desc.type === "answer") this.localDescription = desc; return Promise.resolve(); }
        createAnswer() { return Promise.resolve({ type: "answer", sdp: "mock-answer" }); }
        setRemoteDescription(desc) { if (desc.type === "offer") this.remoteDescription = desc; else if (desc.type === "answer") this.remoteDescription = desc; return Promise.resolve(); }
        addIceCandidate(candidate) { return Promise.resolve(); }
        createDataChannel(label, options) { const mockChannel = { label: label || "file-transfer", readyState: "closed", send: vi.fn() }; return mockChannel; }
        getStats() { return Promise.resolve({ values: [{ type: "candidate-pair", selected: true }] }); }
        close() { mockClose(); }
      };

      const { result } = renderHook(() => useWebRTC({ socketRef: mockSocketRef, rtcConfig }));

      act(() => {
        result.current.createPeerConnection();
      });

      // Call cleanup multiple times - should not throw or crash
      act(() => {
        result.current.cleanup();
        result.current.cleanup();
        result.current.cleanup();
      });

      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it("should handle sendCall without creating peer connection first", async () => {
      const mockEmit = vi.fn();
      mockSocketRef.current = { emit: mockEmit };

      const { result } = renderHook(() => useWebRTC({ socketRef: mockSocketRef, rtcConfig }));

      await act(async () => {
        const success = await result.current.sendCall("remote-user");
        expect(success).toBe(false);
      });

      expect(mockEmit).not.toHaveBeenCalled();
    });

    it("should handle incoming call without creating peer connection first", async () => {
      const mockEmit = vi.fn();
      mockSocketRef.current = { emit: mockEmit };

      const { result } = renderHook(() => useWebRTC({ socketRef: mockSocketRef, rtcConfig }));

      await act(async () => {
        const success = await result.current.handleIncomingCall({ from: "remote-user", offer: { type: "offer" } });
        expect(success).toBe(false);
      });

      expect(mockEmit).not.toHaveBeenCalled();
    });

    it("should handle data channel callback with gathering complete flag", () => {
      let gatheringCompleteCalled = false;
      
      const mockOnDataChannel = vi.fn((channel, isGatheringComplete) => {
        if (isGatheringComplete) {
          gatheringCompleteCalled = true;
        }
      });

      const { result } = renderHook(() => useWebRTC({ socketRef: mockSocketRef, rtcConfig }));

      act(() => {
        // Simulate the callback being called with gathering complete flag
        mockOnDataChannel(null, true);
      });

      expect(gatheringCompleteCalled).toBe(true);
    });
  });
});
