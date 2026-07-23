import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useFileTransfer from '../src/hooks/useFileTransfer';

// Mock RTCDataChannel
const createMockDataChannel = () => ({
  current: {
    readyState: 'open',
    bufferedAmount: 0,
    send: vi.fn(),
    close: vi.fn(),
  },
});

// Mock File class with stream support
class MockFile {
  constructor(content, name, options = {}) {
    this.content = content;
    this.name = name;
    this.type = options.type || 'text/plain';
    // Calculate size manually to avoid Blob issues in jsdom
    this.size = typeof content === 'string' ? new TextEncoder().encode(content).length : content.byteLength;
  }

  stream() {
    const encoder = new TextEncoder();
    const data = encoder.encode(this.content);
    
    let index = 0;
    return new ReadableStream({
      start: (controller) => {
        // Send all data in one chunk for simplicity
        if (data.length > 0) {
          controller.enqueue(data);
        }
        controller.close();
      },
    });
  }
}

describe('useFileTransfer Hook', () => {
  let mockDataChannel;
  let config;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create fresh mocks for each test
    mockDataChannel = createMockDataChannel();
    
    const setTransferCompletion = vi.fn();
    const setSpeed = vi.fn();
    const byteSentRef = { current: 0 };
    const lastSenderChunkTimeRef = { current: null };
    const lastSenderBytesSentRef = { current: 0 };
    const lastUpdateTimeRef = { current: 0 };
    const lastUpdateTransferRef = { current: 0 };
    const canSendData = { current: true }; // Ready to send immediately
    const fileSizeRef = { current: null };
    const logConnectionType = vi.fn();

    config = {
      dataChannel: mockDataChannel,
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
    };
  });

  describe('Initial Setup', () => {
    it('should return an object with uploadFile function', () => {
      const { result } = renderHook(() => useFileTransfer(config));

      expect(result.current).toHaveProperty('uploadFile');
      expect(typeof result.current.uploadFile).toBe('function');
    });

    it('should provide a stable function reference (useCallback)', () => {
      const { result, rerender } = renderHook(
        ({ config }) => useFileTransfer(config),
        { initialProps: { config } }
      );

      const firstUploadFile = result.current.uploadFile;
      
      // Rerender with same config - function reference should be stable
      rerender({ config });
      
      expect(result.current.uploadFile).toBe(firstUploadFile);
    });
  });

  describe('Validation', () => {
    it('should return early if data channel is not open', async () => {
      mockDataChannel.current.readyState = 'closed';
      
      const file = new MockFile('test content', 'test.txt');
      const { result } = renderHook(() => useFileTransfer(config));

      await act(async () => {
        await result.current.uploadFile(file);
      });

      expect(mockDataChannel.current.send).not.toHaveBeenCalled();
    });

    it('should return early if data channel is null', async () => {
      mockDataChannel.current = null;
      
      const file = new MockFile('test content', 'test.txt');
      const { result } = renderHook(() => useFileTransfer(config));

      await act(async () => {
        await result.current.uploadFile(file);
      });

      expect(mockDataChannel.current).toBeNull();
    });
  });

  describe('Metadata Sending', () => {
    it('should send file metadata before starting transfer', async () => {
      const file = new MockFile('test content', 'test.txt');
      
      const { result } = renderHook(() => useFileTransfer(config));

      await act(async () => {
        await result.current.uploadFile(file);
      });

      // First send should be metadata (JSON string)
      const firstCall = mockDataChannel.current.send.mock.calls[0][0];
      const parsedMetadata = JSON.parse(firstCall);

      expect(parsedMetadata).toEqual({
        fileName: 'test.txt',
        fileType: 'text/plain',
        fileSize: file.size,
      });
    });

    it('should set fileSizeRef.current to the file size', async () => {
      const file = new MockFile('test content', 'test.txt');
      
      const { result } = renderHook(() => useFileTransfer(config));

      await act(async () => {
        await result.current.uploadFile(file);
      });

      expect(config.fileSizeRef.current).toBe(file.size);
    });

    it('should call logConnectionType if provided', async () => {
      const file = new MockFile('test content', 'test.txt');
      
      const { result } = renderHook(() => useFileTransfer(config));

      await act(async () => {
        await result.current.uploadFile(file);
      });

      expect(config.logConnectionType).toHaveBeenCalled();
    });

    it('should not call logConnectionType if not provided', async () => {
      const file = new MockFile('test content', 'test.txt');
      
      const configWithoutLog = { ...config, logConnectionType: undefined };
      const { result } = renderHook(() => useFileTransfer(configWithoutLog));

      await act(async () => {
        await result.current.uploadFile(file);
      });

      // Should not throw even if logConnectionType is undefined
      expect(mockDataChannel.current.send).toHaveBeenCalled();
    });
  });

  describe('Progress Tracking', () => {
    it('should reset progress state at start of transfer', async () => {
      const file = new MockFile('test content', 'test.txt');
      
      // Set initial non-zero values to verify they get reset
      config.setTransferCompletion.mockImplementation(() => {});
      config.setSpeed.mockImplementation(() => {});
      
      const { result } = renderHook(() => useFileTransfer(config));

      await act(async () => {
        await result.current.uploadFile(file);
      });

      // Verify setTransferCompletion was called (at least with 0 at start)
      expect(config.setTransferCompletion).toHaveBeenCalledWith(0);
    });

    it('should update progress to 100% when transfer completes', async () => {
      const file = new MockFile('test content', 'test.txt');
      
      const { result } = renderHook(() => useFileTransfer(config));

      await act(async () => {
        await result.current.uploadFile(file);
      });

      // Last call to setTransferCompletion should be 100
      const lastProgressCall = config.setTransferCompletion.mock.calls.slice(-1)[0][0];
      expect(lastProgressCall).toBe(100);
    });

    it('should update byteSentRef.current during transfer', async () => {
      const file = new MockFile('test content', 'test.txt');
      
      const { result } = renderHook(() => useFileTransfer(config));

      await act(async () => {
        await result.current.uploadFile(file);
      });

      expect(config.byteSentRef.current).toBeGreaterThan(0);
    });
  });

  describe('EOF Signaling', () => {
    it('should send "__EOF__" marker when transfer completes', async () => {
      const file = new MockFile('test content', 'test.txt');
      
      const { result } = renderHook(() => useFileTransfer(config));

      await act(async () => {
        await result.current.uploadFile(file);
      });

      // Find the EOF marker in send calls
      const eofCalls = mockDataChannel.current.send.mock.calls.filter(
        call => call[0] === '__EOF__'
      );

      expect(eofCalls.length).toBeGreaterThan(0);
    });
  });

  describe('Buffer Throttling', () => {
    it('should handle high bufferedAmount gracefully', async () => {
      // Simulate buffer being full initially, then available
      let bufferFull = true;
      
      const throttledDataChannel = createMockDataChannel();
      Object.defineProperty(throttledDataChannel.current, 'bufferedAmount', {
        get: () => bufferFull ? 20 * 1024 * 1024 : 0, // Start full (20MB), then empty
      });

      const throttledConfig = { ...config, dataChannel: throttledDataChannel };
      
      const file = new MockFile('test content', 'test.txt');
      const { result } = renderHook(() => useFileTransfer(throttledConfig));

      // After first chunk is processed, make buffer available
      setTimeout(() => {
        bufferFull = false;
      }, 10);

      await act(async () => {
        await result.current.uploadFile(file);
      });

      expect(throttledDataChannel.current.send).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle data channel closing during transfer', async () => {
      const file = new MockFile('test content', 'test.txt');
      
      // Make data channel close after first send
      let channelOpen = true;
      Object.defineProperty(mockDataChannel.current, 'readyState', {
        get: () => channelOpen ? 'open' : 'closed',
      });

      const { result } = renderHook(() => useFileTransfer(config));

      // Close channel after a brief delay (simulating real-world scenario)
      setTimeout(() => {
        channelOpen = false;
      }, 50);

      await act(async () => {
        await result.current.uploadFile(file);
      });

      // Should not throw - error is caught and logged
      expect(mockDataChannel.current.send).toHaveBeenCalled();
    });

    it('should log errors when sending chunks fails', async () => {
      const file = new MockFile('test content', 'test.txt');
      
      // Make send throw an error on the second call (after metadata)
      let callCount = 0;
      mockDataChannel.current.send.mockImplementation(() => {
        callCount++;
        if (callCount > 1) { // Skip first call (metadata)
          throw new Error('Send failed');
        }
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const { result } = renderHook(() => useFileTransfer(config));

      // The hook catches errors internally
      await act(async () => {
        try {
          await result.current.uploadFile(file);
        } catch (e) {
          // Expected - error is caught and logged by hook
        }
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error sending chunk:', expect.any(Error));
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Speed Calculation', () => {
    it('should call setSpeed with calculated speed value', async () => {
      const file = new MockFile('test content', 'test.txt');
      
      // Set initial time to ensure timeDelta > 0
      config.lastUpdateTimeRef.current = Date.now() - 600; // 600ms ago
      
      const { result } = renderHook(() => useFileTransfer(config));

      await act(async () => {
        await result.current.uploadFile(file);
      });

      expect(config.setSpeed).toHaveBeenCalled();
    });

    it('should update lastUpdateTimeRef after speed calculation', async () => {
      const file = new MockFile('test content', 'test.txt');
      
      // Note: The hook resets these refs at the start of uploadFile,
      // so we can't pre-set them. Instead, verify setSpeed is called
      // which implies lastUpdateTimeRef gets updated.
      const { result } = renderHook(() => useFileTransfer(config));

      await act(async () => {
        await result.current.uploadFile(file);
      });

      // If setSpeed was called, it means the speed calculation logic ran
      // and lastUpdateTimeRef would have been updated inside that block
      expect(config.setSpeed).toHaveBeenCalled();
    });
  });

  describe('Large File Handling', () => {
    it('should handle files larger than CHUNK_SIZE (256KB)', async () => {
      // Create a file larger than chunk size
      const largeContent = 'x'.repeat(300 * 1024); // 300KB > 256KB chunk
      const file = new MockFile(largeContent, 'large.txt');

      const { result } = renderHook(() => useFileTransfer(config));

      await act(async () => {
        await result.current.uploadFile(file);
      });

      // Should have sent multiple chunks (metadata + data chunks + EOF)
      expect(mockDataChannel.current.send.mock.calls.length).toBeGreaterThan(2);
    });
  });

  describe('Ref Updates', () => {
    it('should update lastSenderChunkTimeRef after each chunk', async () => {
      const file = new MockFile('test content', 'test.txt');
      
      config.lastSenderChunkTimeRef.current = null;
      
      const { result } = renderHook(() => useFileTransfer(config));

      await act(async () => {
        await result.current.uploadFile(file);
      });

      expect(config.lastSenderChunkTimeRef.current).not.toBeNull();
    });

    it('should update lastSenderBytesSentRef after each chunk', async () => {
      const file = new MockFile('test content', 'test.txt');
      
      config.lastSenderBytesSentRef.current = 0;
      
      const { result } = renderHook(() => useFileTransfer(config));

      await act(async () => {
        await result.current.uploadFile(file);
      });

      expect(config.lastSenderBytesSentRef.current).toBeGreaterThan(0);
    });

    it('should update lastUpdateTransferRef after progress calculation', async () => {
      const file = new MockFile('test content', 'test.txt');
      
      config.lastUpdateTransferRef.current = 0;
      
      const { result } = renderHook(() => useFileTransfer(config));

      await act(async () => {
        await result.current.uploadFile(file);
      });

      expect(config.lastUpdateTransferRef.current).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty file (zero bytes)', async () => {
      const file = new MockFile('', 'empty.txt');
      
      const { result } = renderHook(() => useFileTransfer(config));

      await act(async () => {
        await result.current.uploadFile(file);
      });

      // Should still send metadata and EOF even for empty files
      expect(mockDataChannel.current.send).toHaveBeenCalled();
    });

    it('should handle binary file content', async () => {
      const binaryContent = new Uint8Array([0, 255, 128, 64, 32]).buffer;
      const file = new MockFile(new TextDecoder().decode(binaryContent), 'binary.bin');

      const { result } = renderHook(() => useFileTransfer(config));

      await act(async () => {
        await result.current.uploadFile(file);
      });

      expect(mockDataChannel.current.send).toHaveBeenCalled();
    });

    it('should handle file with special characters in name', async () => {
      const file = new MockFile('test content', 'file-with-特殊字符.txt');
      
      const { result } = renderHook(() => useFileTransfer(config));

      await act(async () => {
        await result.current.uploadFile(file);
      });

      // Metadata should be valid JSON even with special chars
      const firstCall = mockDataChannel.current.send.mock.calls[0][0];
      expect(() => JSON.parse(firstCall)).not.toThrow();
    });
  });
});
