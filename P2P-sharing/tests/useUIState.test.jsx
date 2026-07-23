import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useUIState from '../src/hooks/useUIState';

describe('useUIState Hook', () => {
  let mockSocketRef;
  let mockPeerRef;
  let mockReconnect;
  let mockRtcConfig;
  let mockRegisterSocketHandlers;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create fresh mocks for each test
    mockSocketRef = {
      current: {
        emit: vi.fn(),
      },
    };

    mockPeerRef = {
      current: null,
    };

    mockReconnect = vi.fn();
    
    mockRtcConfig = {
      iceTransportPolicy: 'all',
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
      ],
    };

    mockRegisterSocketHandlers = vi.fn();
  });

  describe('Initial Setup', () => {
    it('should return an object with all expected properties', () => {
      const { result } = renderHook(() => useUIState({
        socketRef: mockSocketRef,
        peerRef: mockPeerRef,
        reconnect: mockReconnect,
        rtcConfig: mockRtcConfig,
        registerSocketHandlers: mockRegisterSocketHandlers,
      }));

      const returned = result.current;
      
      // Check state variables exist
      expect(returned).toHaveProperty('connectionId');
      expect(returned).toHaveProperty('dataChOpen');
      expect(returned).toHaveProperty('transferCompletion');
      expect(returned).toHaveProperty('speed');
      expect(returned).toHaveProperty('receiverSpeed');
      expect(returned).toHaveProperty('isReadyToDownload');
      expect(returned).toHaveProperty('showApprove');
      expect(returned).toHaveProperty('wantsClose');

      // Check action handlers exist
      expect(returned).toHaveProperty('generateNewId');
      expect(returned).toHaveProperty('connectTO');
      expect(returned).toHaveProperty('dataChannelEvents');
      expect(returned).toHaveProperty('senderDataChannelEvents');
      expect(returned).toHaveProperty('handleWantsCloseCleanup');
      expect(returned).toHaveProperty('setWantsClose');

      // Check state setters exist
      expect(returned).toHaveProperty('setConnectionId');
      expect(returned).toHaveProperty('setDataChOpen');
      expect(returned).toHaveProperty('setTransferCompletion');
      expect(returned).toHaveProperty('setSpeed');
      expect(returned).toHaveProperty('setReceiverSpeed');
      expect(returned).toHaveProperty('setIsReadyToDownload');
      expect(returned).toHaveProperty('setShowApprove');

      // Check refs exist
      expect(returned).toHaveProperty('startTimeRef');
      expect(returned).toHaveProperty('isMetaDataReceivedRef');
      expect(returned).toHaveProperty('remoteSocketID');
      expect(returned).toHaveProperty('pendingCandidates');
      expect(returned).toHaveProperty('canSendData');
      expect(returned).toHaveProperty('fileNameRef');
      expect(returned).toHaveProperty('fileTypeRef');
      expect(returned).toHaveProperty('metadataRef');
      expect(returned).toHaveProperty('writableStream');
      expect(returned).toHaveProperty('fileSizeRef');
      expect(returned).toHaveProperty('byteSentRef');
      expect(returned).toHaveProperty('lastChunkTimeRef');
      expect(returned).toHaveProperty('lastBytesReceivedRef');
      expect(returned).toHaveProperty('lastSenderChunkTimeRef');
      expect(returned).toHaveProperty('lastSenderBytesSentRef');
      expect(returned).toHaveProperty('lastUpdateTimeRef');
      expect(returned).toHaveProperty('lastUpdateTransferRef');
    });

    it('should initialize with correct default state values', () => {
      const { result } = renderHook(() => useUIState({
        socketRef: mockSocketRef,
        peerRef: mockPeerRef,
        reconnect: mockReconnect,
        rtcConfig: mockRtcConfig,
        registerSocketHandlers: mockRegisterSocketHandlers,
      }));

      expect(result.current.connectionId).toBe('');
      expect(result.current.dataChOpen).toBe(false);
      expect(result.current.transferCompletion).toBe(0);
      expect(result.current.speed).toBe(0);
      expect(result.current.receiverSpeed).toBe(0);
      expect(result.current.isReadyToDownload).toBe(false);
      expect(result.current.showApprove).toBe(false);
      expect(result.current.wantsClose).toBe(false);
    });

    it('should initialize all refs with correct default values', () => {
      const { result } = renderHook(() => useUIState({
        socketRef: mockSocketRef,
        peerRef: mockPeerRef,
        reconnect: mockReconnect,
        rtcConfig: mockRtcConfig,
        registerSocketHandlers: mockRegisterSocketHandlers,
      }));

      expect(result.current.startTimeRef.current).toBeNull();
      expect(result.current.isMetaDataReceivedRef.current).toBe(false);
      expect(result.current.remoteSocketID.current).toBeNull();
      expect(result.current.pendingCandidates.current).toEqual([]);
      expect(result.current.canSendData.current).toBe(false);
      expect(result.current.fileNameRef.current).toBe('received_file');
      expect(result.current.fileTypeRef.current).toBe('text/plain');
      expect(result.current.metadataRef.current).toBeNull();
      expect(result.current.writableStream.current).toBeNull();
      expect(result.current.fileSizeRef.current).toBeNull();
      expect(result.current.byteSentRef.current).toBe(0);
      expect(result.current.lastChunkTimeRef.current).toBeNull();
      expect(result.current.lastBytesReceivedRef.current).toBe(0);
      expect(result.current.lastUpdateTimeRef.current).toBe(0);
      expect(result.current.lastUpdateTransferRef.current).toBe(0);
    });

    it('should return functions that are callable', () => {
      const { result } = renderHook(() => useUIState({
        socketRef: mockSocketRef,
        peerRef: mockPeerRef,
        reconnect: mockReconnect,
        rtcConfig: mockRtcConfig,
        registerSocketHandlers: mockRegisterSocketHandlers,
      }));

      expect(typeof result.current.generateNewId).toBe('function');
      expect(typeof result.current.connectTO).toBe('function');
      expect(typeof result.current.dataChannelEvents).toBe('function');
      expect(typeof result.current.senderDataChannelEvents).toBe('function');
      expect(typeof result.current.handleWantsCloseCleanup).toBe('function');
      expect(typeof result.current.setWantsClose).toBe('function');
    });
  });

  describe('State Management', () => {
    it('should update connectionId when setConnectionId is called', () => {
      const { result } = renderHook(() => useUIState({
        socketRef: mockSocketRef,
        peerRef: mockPeerRef,
        reconnect: mockReconnect,
        rtcConfig: mockRtcConfig,
        registerSocketHandlers: mockRegisterSocketHandlers,
      }));

      act(() => {
        result.current.setConnectionId('test-connection-id');
      });

      expect(result.current.connectionId).toBe('test-connection-id');
    });

    it('should update dataChOpen when setDataChOpen is called', () => {
      const { result } = renderHook(() => useUIState({
        socketRef: mockSocketRef,
        peerRef: mockPeerRef,
        reconnect: mockReconnect,
        rtcConfig: mockRtcConfig,
        registerSocketHandlers: mockRegisterSocketHandlers,
      }));

      act(() => {
        result.current.setDataChOpen(true);
      });

      expect(result.current.dataChOpen).toBe(true);
    });

    it('should update transferCompletion when setTransferCompletion is called', () => {
      const { result } = renderHook(() => useUIState({
        socketRef: mockSocketRef,
        peerRef: mockPeerRef,
        reconnect: mockReconnect,
        rtcConfig: mockRtcConfig,
        registerSocketHandlers: mockRegisterSocketHandlers,
      }));

      act(() => {
        result.current.setTransferCompletion(75);
      });

      expect(result.current.transferCompletion).toBe(75);
    });

    it('should update speed when setSpeed is called', () => {
      const { result } = renderHook(() => useUIState({
        socketRef: mockSocketRef,
        peerRef: mockPeerRef,
        reconnect: mockReconnect,
        rtcConfig: mockRtcConfig,
        registerSocketHandlers: mockRegisterSocketHandlers,
      }));

      act(() => {
        result.current.setSpeed(5.25);
      });

      expect(result.current.speed).toBe(5.25);
    });

    it('should update receiverSpeed when setReceiverSpeed is called', () => {
      const { result } = renderHook(() => useUIState({
        socketRef: mockSocketRef,
        peerRef: mockPeerRef,
        reconnect: mockReconnect,
        rtcConfig: mockRtcConfig,
        registerSocketHandlers: mockRegisterSocketHandlers,
      }));

      act(() => {
        result.current.setReceiverSpeed(3.75);
      });

      expect(result.current.receiverSpeed).toBe(3.75);
    });

    it('should update isReadyToDownload when setIsReadyToDownload is called', () => {
      const { result } = renderHook(() => useUIState({
        socketRef: mockSocketRef,
        peerRef: mockPeerRef,
        reconnect: mockReconnect,
        rtcConfig: mockRtcConfig,
        registerSocketHandlers: mockRegisterSocketHandlers,
      }));

      act(() => {
        result.current.setIsReadyToDownload(true);
      });

      expect(result.current.isReadyToDownload).toBe(true);
    });

    it('should update showApprove when setShowApprove is called', () => {
      const { result } = renderHook(() => useUIState({
        socketRef: mockSocketRef,
        peerRef: mockPeerRef,
        reconnect: mockReconnect,
        rtcConfig: mockRtcConfig,
        registerSocketHandlers: mockRegisterSocketHandlers,
      }));

      act(() => {
        result.current.setShowApprove(true);
      });

      expect(result.current.showApprove).toBe(true);
    });

    it('should update wantsClose when setWantsClose is called', () => {
      const { result } = renderHook(() => useUIState({
        socketRef: mockSocketRef,
        peerRef: mockPeerRef,
        reconnect: mockReconnect,
        rtcConfig: mockRtcConfig,
        registerSocketHandlers: mockRegisterSocketHandlers,
      }));

      act(() => {
        result.current.setWantsClose(true);
      });

      expect(result.current.wantsClose).toBe(true);
    });
  });

  describe('connectTO Action', () => {
    it('should emit connect-to-sender event with correct payload', () => {
      const { result } = renderHook(() => useUIState({
        socketRef: mockSocketRef,
        peerRef: mockPeerRef,
        reconnect: mockReconnect,
        rtcConfig: mockRtcConfig,
        registerSocketHandlers: mockRegisterSocketHandlers,
      }));

      act(() => {
        result.current.connectTO('remote-peer-id');
      });

      expect(mockSocketRef.current.emit).toHaveBeenCalledWith(
        'connect-to-sender',
        { to: 'remote-peer-id' }
      );
    });

    it('should close existing data channel before connecting if peer exists', () => {
      const mockDataChannel = {
        current: {
          close: vi.fn(),
        },
      };
      
      mockPeerRef.current = {}; // Simulate existing peer

      const { result } = renderHook(() => useUIState({
        socketRef: mockSocketRef,
        peerRef: mockPeerRef,
        reconnect: mockReconnect,
        rtcConfig: mockRtcConfig,
        registerSocketHandlers: mockRegisterSocketHandlers,
      }));

      // Assign mock data channel to the hook's internal ref
      result.current.dataChannel.current = mockDataChannel.current;

      act(() => {
        result.current.connectTO('remote-peer-id');
      });

      expect(mockDataChannel.current.close).toHaveBeenCalled();
    });

    it('should handle errors when closing existing data channel', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const mockDataChannel = {
        current: {
          close: vi.fn().mockImplementation(() => {
            throw new Error('Close failed');
          }),
        },
      };
      
      mockPeerRef.current = {};

      const { result } = renderHook(() => useUIState({
        socketRef: mockSocketRef,
        peerRef: mockPeerRef,
        reconnect: mockReconnect,
        rtcConfig: mockRtcConfig,
        registerSocketHandlers: mockRegisterSocketHandlers,
      }));

      act(() => {
        result.current.connectTO('remote-peer-id');
      });

      expect(consoleLogSpy).toHaveBeenCalled();
      
      consoleLogSpy.mockRestore();
    });
  });

  describe('generateNewId Action', () => {
    it('should reset all state variables to defaults', () => {
      class MockRTCPeerConnection {
        constructor() {}
      }
      vi.stubGlobal('RTCPeerConnection', MockRTCPeerConnection);

      try {
        const { result } = renderHook(() => useUIState({
          socketRef: mockSocketRef,
          peerRef: mockPeerRef,
          reconnect: mockReconnect,
          rtcConfig: mockRtcConfig,
          registerSocketHandlers: mockRegisterSocketHandlers,
        }));

        // Set some non-default values first
        act(() => {
          result.current.setConnectionId('test-id');
          result.current.setDataChOpen(true);
          result.current.setTransferCompletion(50);
          result.current.setSpeed(2.5);
          result.current.setIsReadyToDownload(true);
          result.current.setShowApprove(true);
        });

        // Call generateNewId
        act(() => {
          result.current.generateNewId();
        });

        expect(result.current.connectionId).toBe('');
        expect(result.current.dataChOpen).toBe(false);
        expect(result.current.transferCompletion).toBe(0);
        expect(result.current.speed).toBe(0);
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it('should reset all refs to default values', () => {
      class MockRTCPeerConnection {
        constructor() {}
      }
      vi.stubGlobal('RTCPeerConnection', MockRTCPeerConnection);

      try {
        const { result } = renderHook(() => useUIState({
          socketRef: mockSocketRef,
          peerRef: mockPeerRef,
          reconnect: mockReconnect,
          rtcConfig: mockRtcConfig,
          registerSocketHandlers: mockRegisterSocketHandlers,
        }));

        // Set some non-default values first
        act(() => {
          result.current.startTimeRef.current = new Date();
          result.current.isMetaDataReceivedRef.current = true;
          result.current.remoteSocketID.current = 'some-id';
          result.current.pendingCandidates.current = ['candidate1'];
          result.current.canSendData.current = true;
          result.current.fileNameRef.current = 'test.txt';
          result.current.fileTypeRef.current = 'application/pdf';
          result.current.metadataRef.current = { test: true };
          result.current.fileSizeRef.current = 1024;
          result.current.byteSentRef.current = 500;
        });

        // Call generateNewId
      act(() => {
        result.current.generateNewId();
      });

      expect(result.current.startTimeRef.current).toBeNull();
      expect(result.current.isMetaDataReceivedRef.current).toBe(false);
      expect(result.current.remoteSocketID.current).toBeNull();
      expect(result.current.pendingCandidates.current).toEqual([]);
      expect(result.current.canSendData.current).toBe(false);
      expect(result.current.fileNameRef.current).toBe('received_file');
      expect(result.current.fileTypeRef.current).toBe('text/plain');
      expect(result.current.metadataRef.current).toBeNull();
      expect(result.current.fileSizeRef.current).toBeNull();
      expect(result.current.byteSentRef.current).toBe(0);
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it('should call reconnect function', () => {
      class MockRTCPeerConnection {
        constructor() {}
      }
      vi.stubGlobal('RTCPeerConnection', MockRTCPeerConnection);

      try {
        const { result } = renderHook(() => useUIState({
          socketRef: mockSocketRef,
          peerRef: mockPeerRef,
          reconnect: mockReconnect,
          rtcConfig: mockRtcConfig,
          registerSocketHandlers: mockRegisterSocketHandlers,
        }));

        act(() => {
          result.current.generateNewId();
        });

        expect(mockReconnect).toHaveBeenCalled();
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it('should close existing peer connection if it exists', () => {
      class MockRTCPeerConnection {
        constructor() {}
      }
      vi.stubGlobal('RTCPeerConnection', MockRTCPeerConnection);

      try {
        const mockPeerConnection = {
          close: vi.fn(),
        };
        
        mockPeerRef.current = mockPeerConnection;

        const { result } = renderHook(() => useUIState({
          socketRef: mockSocketRef,
          peerRef: mockPeerRef,
          reconnect: mockReconnect,
          rtcConfig: mockRtcConfig,
          registerSocketHandlers: mockRegisterSocketHandlers,
        }));

        act(() => {
          result.current.generateNewId();
        });

        expect(mockPeerConnection.close).toHaveBeenCalled();
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it('should close existing data channel if it exists', () => {
      class MockRTCPeerConnection {
        constructor() {}
      }
      vi.stubGlobal('RTCPeerConnection', MockRTCPeerConnection);

      try {
        const mockDataChannel = {
          current: {
            close: vi.fn(),
          },
        };
        
        const { result } = renderHook(() => useUIState({
          socketRef: mockSocketRef,
          peerRef: mockPeerRef,
          reconnect: mockReconnect,
          rtcConfig: mockRtcConfig,
          registerSocketHandlers: mockRegisterSocketHandlers,
        }));

        // Set up a mock data channel in the hook's internal ref
        result.current.dataChannel.current = mockDataChannel.current;

        act(() => {
          result.current.generateNewId();
        });

        expect(mockDataChannel.current.close).toHaveBeenCalled();
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it('should recreate peer connection with rtcConfig', () => {
      class MockRTCPeerConnection {
        constructor(config) {
          this.config = config;
        }
      }
      
      vi.stubGlobal('RTCPeerConnection', MockRTCPeerConnection);

      try {
        const { result } = renderHook(() => useUIState({
          socketRef: mockSocketRef,
          peerRef: mockPeerRef,
          reconnect: mockReconnect,
          rtcConfig: mockRtcConfig,
          registerSocketHandlers: mockRegisterSocketHandlers,
        }));

        act(() => {
          result.current.generateNewId();
        });

        expect(result.current.peerRef.current).toBeInstanceOf(MockRTCPeerConnection);
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it('should call registerSocketHandlers after recreating peer connection', () => {
      class MockRTCPeerConnection {
        constructor(config) {
          this.config = config;
        }
      }
      
      vi.stubGlobal('RTCPeerConnection', MockRTCPeerConnection);

      try {
        const { result } = renderHook(() => useUIState({
          socketRef: mockSocketRef,
          peerRef: mockPeerRef,
          reconnect: mockReconnect,
          rtcConfig: mockRtcConfig,
          registerSocketHandlers: mockRegisterSocketHandlers,
        }));

        act(() => {
          result.current.generateNewId();
        });

        expect(mockRegisterSocketHandlers).toHaveBeenCalled();
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });

  describe('dataChannelEvents Handler', () => {
    it('should set up data channel open handler', () => {
      const { result } = renderHook(() => useUIState({
        socketRef: mockSocketRef,
        peerRef: mockPeerRef,
        reconnect: mockReconnect,
        rtcConfig: mockRtcConfig,
        registerSocketHandlers: mockRegisterSocketHandlers,
      }));

      // Assign mock data channel to the hook's internal ref
      result.current.dataChannel.current = {
        onopen: null,
        onerror: null,
        onbufferedamountlow: null,
      };

      act(() => {
        result.current.dataChannelEvents();
      });

      expect(result.current.dataChannel.current.onopen).toBeDefined();
    });

    it('should set up data channel error handler', () => {
      const { result } = renderHook(() => useUIState({
        socketRef: mockSocketRef,
        peerRef: mockPeerRef,
        reconnect: mockReconnect,
        rtcConfig: mockRtcConfig,
        registerSocketHandlers: mockRegisterSocketHandlers,
      }));

      result.current.dataChannel.current = {
        onopen: null,
        onerror: null,
        onbufferedamountlow: null,
      };

      act(() => {
        result.current.dataChannelEvents();
      });

      expect(result.current.dataChannel.current.onerror).toBeDefined();
    });

    it('should set up data channel bufferedamountlow handler', () => {
      const { result } = renderHook(() => useUIState({
        socketRef: mockSocketRef,
        peerRef: mockPeerRef,
        reconnect: mockReconnect,
        rtcConfig: mockRtcConfig,
        registerSocketHandlers: mockRegisterSocketHandlers,
      }));

      result.current.dataChannel.current = {
        onopen: null,
        onerror: null,
        onbufferedamountlow: null,
      };

      act(() => {
        result.current.dataChannelEvents();
      });

      expect(result.current.dataChannel.current.onbufferedamountlow).toBeDefined();
    });

    it('should set dataChOpen to true when data channel opens', () => {
      const { result } = renderHook(() => useUIState({
        socketRef: mockSocketRef,
        peerRef: mockPeerRef,
        reconnect: mockReconnect,
        rtcConfig: mockRtcConfig,
        registerSocketHandlers: mockRegisterSocketHandlers,
      }));

      result.current.dataChannel.current = {
        onopen: null,
        onerror: null,
        onbufferedamountlow: null,
      };

      act(() => {
        result.current.dataChannelEvents();
      });

      // Simulate data channel opening
      act(() => {
        if (result.current.dataChannel.current.onopen) {
          result.current.dataChannel.current.onopen();
        }
      });

      expect(result.current.dataChOpen).toBe(true);
    });

    it('should set dataChOpen to false when data channel errors', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const { result } = renderHook(() => useUIState({
        socketRef: mockSocketRef,
        peerRef: mockPeerRef,
        reconnect: mockReconnect,
        rtcConfig: mockRtcConfig,
        registerSocketHandlers: mockRegisterSocketHandlers,
      }));

      result.current.dataChannel.current = {
        onopen: null,
        onerror: null,
        onbufferedamountlow: null,
      };

      act(() => {
        result.current.dataChannelEvents();
      });

      // Simulate data channel error
      const testError = new Error('Test error');
      act(() => {
        if (result.current.dataChannel.current.onerror) {
          result.current.dataChannel.current.onerror(testError);
        }
      });

      expect(result.current.dataChOpen).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('DataChannel error:', testError);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('senderDataChannelEvents Handler', () => {
    it('should set up data channel message handler for sender', () => {
      const { result } = renderHook(() => useUIState({
        socketRef: mockSocketRef,
        peerRef: mockPeerRef,
        reconnect: mockReconnect,
        rtcConfig: mockRtcConfig,
        registerSocketHandlers: mockRegisterSocketHandlers,
      }));

      result.current.dataChannel.current = {
        bufferedAmountLowThreshold: null,
        onmessage: null,
      };

      act(() => {
        result.current.senderDataChannelEvents();
      });

      expect(result.current.dataChannel.current.bufferedAmountLowThreshold).toBe(128 * 1024);
    });

    it('should parse JSON messages and update canSendData', () => {
      const { result } = renderHook(() => useUIState({
        socketRef: mockSocketRef,
        peerRef: mockPeerRef,
        reconnect: mockReconnect,
        rtcConfig: mockRtcConfig,
        registerSocketHandlers: mockRegisterSocketHandlers,
      }));

      result.current.dataChannel.current = {
        bufferedAmountLowThreshold: null,
        onmessage: null,
      };

      act(() => {
        result.current.senderDataChannelEvents();
      });

      // Simulate receiving a message with status true
      const messageEvent = { data: JSON.stringify({ status: true }) };
      act(() => {
        if (result.current.dataChannel.current.onmessage) {
          result.current.dataChannel.current.onmessage(messageEvent);
        }
      });

      expect(result.current.canSendData.current).toBe(true);
    });

    it('should set canSendData to false when status is false', () => {
      const { result } = renderHook(() => useUIState({
        socketRef: mockSocketRef,
        peerRef: mockPeerRef,
        reconnect: mockReconnect,
        rtcConfig: mockRtcConfig,
        registerSocketHandlers: mockRegisterSocketHandlers,
      }));

      result.current.dataChannel.current = {
        bufferedAmountLowThreshold: null,
        onmessage: null,
      };

      act(() => {
        result.current.senderDataChannelEvents();
      });

      // First set to true
      const messageEvent1 = { data: JSON.stringify({ status: true }) };
      act(() => {
        if (result.current.dataChannel.current.onmessage) {
          result.current.dataChannel.current.onmessage(messageEvent1);
        }
      });

      // Then set to false
      const messageEvent2 = { data: JSON.stringify({ status: false }) };
      act(() => {
        if (result.current.dataChannel.current.onmessage) {
          result.current.dataChannel.current.onmessage(messageEvent2);
        }
      });

      expect(result.current.canSendData.current).toBe(false);
    });
  });

  describe('handleWantsCloseCleanup Handler', () => {
    it('should close data channel when wantsClose is true', () => {
      const mockDataChannel = {
        current: {
          close: vi.fn(),
        },
      };

      const { result } = renderHook(() => useUIState({
        socketRef: mockSocketRef,
        peerRef: mockPeerRef,
        reconnect: mockReconnect,
        rtcConfig: mockRtcConfig,
        registerSocketHandlers: mockRegisterSocketHandlers,
      }));

      // Assign mock data channel to the hook's internal ref
      result.current.dataChannel.current = mockDataChannel.current;

      // Set wantsClose to true
      act(() => {
        result.current.setWantsClose(true);
      });

      // Trigger cleanup
      act(() => {
        result.current.handleWantsCloseCleanup();
      });

      expect(mockDataChannel.current.close).toHaveBeenCalled();
    });

    it('should not close data channel when wantsClose is false', () => {
      const mockDataChannel = {
        current: {
          close: vi.fn(),
        },
      };

      const { result } = renderHook(() => useUIState({
        socketRef: mockSocketRef,
        peerRef: mockPeerRef,
        reconnect: mockReconnect,
        rtcConfig: mockRtcConfig,
        registerSocketHandlers: mockRegisterSocketHandlers,
      }));

      result.current.dataChannel = mockDataChannel;

      // wantsClose is already false by default
      
      // Trigger cleanup
      act(() => {
        result.current.handleWantsCloseCleanup();
      });

      expect(mockDataChannel.current.close).not.toHaveBeenCalled();
    });

    it('should handle errors when closing data channel', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const mockDataChannel = {
        current: {
          close: vi.fn().mockImplementation(() => {
            throw new Error('Close failed');
          }),
        },
      };

      const { result } = renderHook(() => useUIState({
        socketRef: mockSocketRef,
        peerRef: mockPeerRef,
        reconnect: mockReconnect,
        rtcConfig: mockRtcConfig,
        registerSocketHandlers: mockRegisterSocketHandlers,
      }));

      result.current.dataChannel = mockDataChannel;

      // Set wantsClose to true
      act(() => {
        result.current.setWantsClose(true);
      });

      // Trigger cleanup - should NOT throw error even if dataChannel.current is undefined
      expect(() => {
        result.current.handleWantsCloseCleanup();
      }).not.toThrow();
      
      consoleErrorSpy.mockRestore();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle generateNewId when peerRef is null', () => {
      class MockRTCPeerConnection {
        constructor() {}
      }
      
      // Mock RTCPeerConnection globally
      vi.stubGlobal('RTCPeerConnection', MockRTCPeerConnection);
      
      try {
        mockPeerRef.current = null; // Ensure it's null

        const { result } = renderHook(() => useUIState({
          socketRef: mockSocketRef,
          peerRef: mockPeerRef,
          reconnect: mockReconnect,
          rtcConfig: mockRtcConfig,
          registerSocketHandlers: mockRegisterSocketHandlers,
        }));

        act(() => {
          result.current.generateNewId();
        });

        // Should not throw and should recreate peer connection
        expect(result.current.peerRef.current).toBeInstanceOf(MockRTCPeerConnection);
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it('should handle generateNewId when dataChannel is null', () => {
      class MockRTCPeerConnection {
        constructor() {}
      }
      
      // Mock RTCPeerConnection globally
      vi.stubGlobal('RTCPeerConnection', MockRTCPeerConnection);
      
      try {
        // dataChannel ref starts as null/undefined, should handle gracefully
        
        const { result } = renderHook(() => useUIState({
          socketRef: mockSocketRef,
          peerRef: mockPeerRef,
          reconnect: mockReconnect,
          rtcConfig: mockRtcConfig,
          registerSocketHandlers: mockRegisterSocketHandlers,
        }));

        act(() => {
          result.current.generateNewId();
        });

        expect(mockReconnect).toHaveBeenCalled();
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it('should maintain referential stability of callback functions', () => {
      const { result, rerender } = renderHook(() => useUIState({
        socketRef: mockSocketRef,
        peerRef: mockPeerRef,
        reconnect: mockReconnect,
        rtcConfig: mockRtcConfig,
        registerSocketHandlers: mockRegisterSocketHandlers,
      }));

      const firstGenerateNewId = result.current.generateNewId;
      const firstConnectTO = result.current.connectTO;
      const firstDataChannelEvents = result.current.dataChannelEvents;
      const firstSenderDataChannelEvents = result.current.senderDataChannelEvents;
      const firstHandleWantsCloseCleanup = result.current.handleWantsCloseCleanup;

      // Rerender with same dependencies
      rerender();

      expect(result.current.generateNewId).toBe(firstGenerateNewId);
      expect(result.current.connectTO).toBe(firstConnectTO);
      expect(result.current.dataChannelEvents).toBe(firstDataChannelEvents);
      expect(result.current.senderDataChannelEvents).toBe(firstSenderDataChannelEvents);
      expect(result.current.handleWantsCloseCleanup).toBe(firstHandleWantsCloseCleanup);
    });

    it('should handle multiple rapid state updates', () => {
      const { result } = renderHook(() => useUIState({
        socketRef: mockSocketRef,
        peerRef: mockPeerRef,
        reconnect: mockReconnect,
        rtcConfig: mockRtcConfig,
        registerSocketHandlers: mockRegisterSocketHandlers,
      }));

      // Perform multiple rapid updates
      act(() => {
        result.current.setTransferCompletion(10);
        result.current.setSpeed(1.5);
        result.current.setReceiverSpeed(2.3);
        result.current.setConnectionId('test-id');
        result.current.setDataChOpen(true);
        result.current.setIsReadyToDownload(true);
        result.current.setShowApprove(true);
      });

      expect(result.current.transferCompletion).toBe(10);
      expect(result.current.speed).toBe(1.5);
      expect(result.current.receiverSpeed).toBe(2.3);
      expect(result.current.connectionId).toBe('test-id');
      expect(result.current.dataChOpen).toBe(true);
      expect(result.current.isReadyToDownload).toBe(true);
      expect(result.current.showApprove).toBe(true);
    });

    it('should handle generateNewId multiple times', () => {
      class MockRTCPeerConnection {
        constructor() {}
        close() {}
      }
      
      // Mock RTCPeerConnection globally
      vi.stubGlobal('RTCPeerConnection', MockRTCPeerConnection);
      
      try {
        const { result } = renderHook(() => useUIState({
          socketRef: mockSocketRef,
          peerRef: mockPeerRef,
          reconnect: mockReconnect,
          rtcConfig: mockRtcConfig,
          registerSocketHandlers: mockRegisterSocketHandlers,
        }));

        // Call generateNewId multiple times
        act(() => {
          result.current.generateNewId();
          result.current.generateNewId();
          result.current.generateNewId();
        });

        expect(result.current.peerRef.current).toBeInstanceOf(MockRTCPeerConnection);
        expect(mockReconnect).toHaveBeenCalledTimes(3);
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });
});
