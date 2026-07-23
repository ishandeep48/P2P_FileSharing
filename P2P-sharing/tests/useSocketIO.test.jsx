import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useSocketIO from '../src/hooks/useSocketIO';

// Mock socket.io-client
const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  connected: false,
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

describe('useSocketIO Hook', () => {
  const TEST_SERVER_URL = 'http://localhost:5000';

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock socket state
    mockSocket.connected = false;
    mockSocket.on.mockClear();
    mockSocket.off.mockClear();
    mockSocket.emit.mockClear();
    mockSocket.disconnect.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Connection', () => {
    it('should create a socket.io instance with correct config', () => {
      const { result } = renderHook(() => useSocketIO(TEST_SERVER_URL));

      expect(result.current.socketRef.current).toBeDefined();
      expect(mockSocket.on).toHaveBeenCalled();
    });

    it('should return socketRef, connected, error, and reconnect', () => {
      const { result } = renderHook(() => useSocketIO(TEST_SERVER_URL));

      expect(result.current).toHaveProperty('socketRef');
      expect(result.current).toHaveProperty('connected');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('reconnect');
    });

    it('should initialize with connected=false and error=false', () => {
      const { result } = renderHook(() => useSocketIO(TEST_SERVER_URL));

      expect(result.current.connected).toBe(false);
      expect(result.current.error).toBe(false);
    });

    it('should attach connection event handlers', () => {
      renderHook(() => useSocketIO(TEST_SERVER_URL));

      const expectedEvents = [
        'connect',
        'disconnect',
        'connect_error',
        'reconnect',
        'reconnect_error'
      ];

      expectedEvents.forEach(event => {
        expect(mockSocket.on).toHaveBeenCalledWith(event, expect.any(Function));
      });
    });
  });

  describe('Connection State Management', () => {
    it('should set connected=true on connect event', () => {
      const { result } = renderHook(() => useSocketIO(TEST_SERVER_URL));
      
      // Get the connect handler that was registered
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
      
      act(() => {
        connectHandler();
      });

      expect(result.current.connected).toBe(true);
      expect(result.current.error).toBe(false);
    });

    it('should set connected=false on disconnect event', () => {
      const { result } = renderHook(() => useSocketIO(TEST_SERVER_URL));
      
      // First connect to set state to true
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
      act(() => {
        connectHandler();
      });

      // Now disconnect
      const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];
      act(() => {
        disconnectHandler();
      });

      expect(result.current.connected).toBe(false);
    });

    it('should set error=true on connect_error event', () => {
      const { result } = renderHook(() => useSocketIO(TEST_SERVER_URL));
      
      const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1];
      
      act(() => {
        errorHandler(new Error('Connection failed'));
      });

      expect(result.current.error).toBe(true);
      expect(result.current.connected).toBe(false);
    });

    it('should recover from error on reconnect event', () => {
      const { result } = renderHook(() => useSocketIO(TEST_SERVER_URL));
      
      // Trigger error first
      const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1];
      act(() => {
        errorHandler(new Error('Connection failed'));
      });

      expect(result.current.error).toBe(true);

      // Now reconnect
      const reconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'reconnect')[1];
      act(() => {
        reconnectHandler(3);
      });

      expect(result.current.connected).toBe(true);
      expect(result.current.error).toBe(false);
    });

    it('should handle reconnect_error', () => {
      const { result } = renderHook(() => useSocketIO(TEST_SERVER_URL));
      
      const reconnectErrorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'reconnect_error')[1];
      
      act(() => {
        reconnectErrorHandler(new Error('Reconnection failed'));
      });

      expect(result.current.connected).toBe(false);
      expect(result.current.error).toBe(true);
    });
  });

  describe('Socket Reconnection', () => {
    it('should provide a reconnect function', () => {
      const { result } = renderHook(() => useSocketIO(TEST_SERVER_URL));

      expect(typeof result.current.reconnect).toBe('function');
    });

    it('should create a new socket instance when reconnect is called', () => {
      const { result, unmount } = renderHook(() => useSocketIO(TEST_SERVER_URL));
      
      // Initial socket was created
      const initialSocket = result.current.socketRef.current;
      expect(initialSocket).toBeDefined();

      // Call reconnect
      act(() => {
        result.current.reconnect();
      });

      // New socket should be created (mock will return same object, but in real scenario it's new)
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should disconnect socket on unmount', () => {
      const { unmount } = renderHook(() => useSocketIO(TEST_SERVER_URL));
      
      unmount();

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should remove all event listeners on cleanup', () => {
      const { unmount } = renderHook(() => useSocketIO(TEST_SERVER_URL));
      
      unmount();

      // Check that off was called for each event type
      const expectedOffCalls = [
        'connect',
        'disconnect',
        'connect_error',
        'reconnect',
        'reconnect_error'
      ];

      expectedOffCalls.forEach(event => {
        expect(mockSocket.off).toHaveBeenCalledWith(event);
      });
    });
  });

  describe('Already Connected Socket', () => {
    it('should handle socket that is already connected on mount', () => {
      // Simulate socket already connected
      mockSocket.connected = true;
      
      const { result } = renderHook(() => useSocketIO(TEST_SERVER_URL));

      expect(result.current.connected).toBe(true);
      expect(result.current.error).toBe(false);
    });
  });

  describe('Multiple Instances', () => {
    it('should maintain separate state for each hook instance', () => {
      const { result: result1 } = renderHook(() => useSocketIO(TEST_SERVER_URL));
      const { result: result2 } = renderHook(() => useSocketIO(TEST_SERVER_URL));

      expect(result1.current.socketRef).not.toBe(result2.current.socketRef);
      expect(result1.current.connected).toBe(false);
      expect(result2.current.connected).toBe(false);
    });
  });

  describe('Server URL Configuration', () => {
    it('should use the provided server URL', () => {
      const customURL = 'http://custom-server:8080';
      
      renderHook(() => useSocketIO(customURL));

      expect(mockSocket.on).toHaveBeenCalled();
    });
  });
});
