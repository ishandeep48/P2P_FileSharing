import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useFileReceive from '../src/hooks/useFileReceive';

// Mock File System Access API
const mockShowSaveFilePicker = vi.fn();
const mockCreateWritable = vi.fn();
const mockClose = vi.fn();

global.window.showSaveFilePicker = mockShowSaveFilePicker;

describe('useFileReceive Hook', () => {
  let config;
  let mockDataChannel;
  let mockWritableStream;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create fresh mocks for each test
    mockDataChannel = {
      current: {
        readyState: 'open',
        send: vi.fn(),
      },
    };

    mockWritableStream = {
      write: vi.fn().mockResolvedValue(undefined),
      close: mockClose.mockResolvedValue(undefined),
    };

    const setTransferCompletion = vi.fn();
    const setReceiverSpeed = vi.fn();
    const setShowApprove = vi.fn();
    const setIsReadyToDownload = vi.fn();

    config = {
      dataChannel: mockDataChannel,
      writableStream: { current: null },
      fileNameRef: { current: 'test.txt' },
      fileTypeRef: { current: 'text/plain' },
      fileSizeRef: { current: 1024 },
      metadataRef: { current: null },
      isMetaDataReceivedRef: { current: false },
      setTransferCompletion,
      setReceiverSpeed,
      setShowApprove,
      setIsReadyToDownload,
      byteSentRef: { current: 0 },
      lastChunkTimeRef: { current: Date.now() },
      lastBytesReceivedRef: { current: 0 },
      lastUpdateTimeRef: { current: 0 },
      lastUpdateTransferRef: { current: 0 },
    };
  });

  describe('Initial Setup', () => {
    it('should return an object with handleMessage and askForLocation functions', () => {
      const { result } = renderHook(() => useFileReceive(config));

      expect(result.current).toHaveProperty('handleMessage');
      expect(result.current).toHaveProperty('askForLocation');
      expect(typeof result.current.handleMessage).toBe('function');
      expect(typeof result.current.askForLocation).toBe('function');
    });
  });

  describe('Metadata Handling', () => {
    it('should parse metadata and set file info refs', async () => {
      const metadata = JSON.stringify({
        fileName: 'test.txt',
        fileType: 'text/plain',
        fileSize: 1024,
      });

      const event = { data: metadata };
      const { result } = renderHook(() => useFileReceive(config));

      await act(async () => {
        await result.current.handleMessage(event);
      });

      expect(config.metadataRef.current).toEqual({
        fileName: 'test.txt',
        fileType: 'text/plain',
        fileSize: 1024,
      });
      expect(config.fileNameRef.current).toBe('test.txt');
      expect(config.fileTypeRef.current).toBe('text/plain');
      expect(config.fileSizeRef.current).toBe(1024);
    });

    it('should set isMetaDataReceivedRef to true after parsing', async () => {
      const metadata = JSON.stringify({
        fileName: 'test.txt',
        fileType: 'text/plain',
        fileSize: 1024,
      });

      const event = { data: metadata };
      const { result } = renderHook(() => useFileReceive(config));

      await act(async () => {
        await result.current.handleMessage(event);
      });

      expect(config.isMetaDataReceivedRef.current).toBe(true);
    });

    it('should reset progress tracking state on new metadata', async () => {
      const metadata = JSON.stringify({
        fileName: 'test.txt',
        fileType: 'text/plain',
        fileSize: 1024,
      });

      const event = { data: metadata };
      const { result } = renderHook(() => useFileReceive(config));

      await act(async () => {
        await result.current.handleMessage(event);
      });

      expect(config.setTransferCompletion).toHaveBeenCalledWith(0);
      expect(config.setReceiverSpeed).toHaveBeenCalledWith(0);
    });

    it('should show approval dialog after metadata is received', async () => {
      const metadata = JSON.stringify({
        fileName: 'test.txt',
        fileType: 'text/plain',
        fileSize: 1024,
      });

      const event = { data: metadata };
      const { result } = renderHook(() => useFileReceive(config));

      await act(async () => {
        await result.current.handleMessage(event);
      });

      expect(config.setShowApprove).toHaveBeenCalledWith(true);
    });

    it('should handle invalid JSON metadata gracefully', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const event = { data: '{invalid json' };
      const { result } = renderHook(() => useFileReceive(config));

      await act(async () => {
        await result.current.handleMessage(event);
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith('Error parsing metadata:', expect.any(SyntaxError));
      
      consoleWarnSpy.mockRestore();
    });

    it('should not process non-string data as metadata', async () => {
      const event = { data: new ArrayBuffer(8) };
      const { result } = renderHook(() => useFileReceive(config));

      await act(async () => {
        await result.current.handleMessage(event);
      });

      // Should not have parsed anything
      expect(config.setShowApprove).not.toHaveBeenCalled();
    });
  });

  describe('EOF Handling', () => {
    it('should close writable stream when EOF is received', async () => {
      config.isMetaDataReceivedRef.current = true;
      config.writableStream.current = mockWritableStream;
      mockWritableStream.close.mockClear();
      
      const event = { data: '__EOF__' };
      const { result } = renderHook(() => useFileReceive(config));

      await act(async () => {
        await result.current.handleMessage(event);
      });

      expect(mockClose).toHaveBeenCalled();
    });

    it('should send __EOF_ACK__ when EOF is received', async () => {
      config.isMetaDataReceivedRef.current = true;
      
      const event = { data: '__EOF__' };
      const { result } = renderHook(() => useFileReceive(config));

      await act(async () => {
        await result.current.handleMessage(event);
      });

      expect(mockDataChannel.current.send).toHaveBeenCalledWith('__EOF_ACK__');
    });

    it('should set transfer completion to 100% on EOF', async () => {
      config.isMetaDataReceivedRef.current = true;
      
      const event = { data: '__EOF__' };
      const { result } = renderHook(() => useFileReceive(config));

      await act(async () => {
        await result.current.handleMessage(event);
      });

      expect(config.setTransferCompletion).toHaveBeenCalledWith(100);
    });

    it('should reset state after EOF', async () => {
      config.isMetaDataReceivedRef.current = true;
      
      const event = { data: '__EOF__' };
      const { result } = renderHook(() => useFileReceive(config));

      await act(async () => {
        await result.current.handleMessage(event);
      });

      expect(config.isMetaDataReceivedRef.current).toBe(false);
      expect(config.setIsReadyToDownload).toHaveBeenCalledWith(false);
      expect(config.setShowApprove).toHaveBeenCalledWith(false);
    });

    it('should send status false report after EOF', async () => {
      config.isMetaDataReceivedRef.current = true;
      
      const event = { data: '__EOF__' };
      const { result } = renderHook(() => useFileReceive(config));

      await act(async () => {
        await result.current.handleMessage(event);
      });

      expect(mockDataChannel.current.send).toHaveBeenCalledWith(
        JSON.stringify({ status: false })
      );
    });
  });

  describe('File Data Receiving', () => {
    it('should write data chunks to writable stream', async () => {
      config.isMetaDataReceivedRef.current = true;
      mockWritableStream.write.mockClear();
      config.writableStream.current = mockWritableStream;
      
      const chunk = new ArrayBuffer(8);
      Object.defineProperty(chunk, 'byteLength', { value: 8 });
      
      const event = { data: chunk };
      const { result } = renderHook(() => useFileReceive(config));

      await act(async () => {
        await result.current.handleMessage(event);
      });

      expect(mockWritableStream.write).toHaveBeenCalledWith(chunk);
    });

    it('should update byteSentRef with chunk size', async () => {
      config.isMetaDataReceivedRef.current = true;
      config.writableStream.current = mockWritableStream;
      
      const chunk = new ArrayBuffer(8);
      Object.defineProperty(chunk, 'byteLength', { value: 8 });
      
      const event = { data: chunk };
      const { result } = renderHook(() => useFileReceive(config));

      await act(async () => {
        await result.current.handleMessage(event);
      });

      expect(config.byteSentRef.current).toBe(8);
    });

    it('should update progress based on bytes received', async () => {
      config.isMetaDataReceivedRef.current = true;
      config.writableStream.current = mockWritableStream;
      
      const chunk = new ArrayBuffer(512);
      Object.defineProperty(chunk, 'byteLength', { value: 512 });
      
      const event = { data: chunk };
      const { result } = renderHook(() => useFileReceive(config));

      await act(async () => {
        await result.current.handleMessage(event);
      });

      // Progress should be (512 / 1024) * 100 = 50%
      expect(config.setTransferCompletion).toHaveBeenCalledWith(50);
    });

    it('should calculate and update receiver speed', async () => {
      config.isMetaDataReceivedRef.current = true;
      config.writableStream.current = mockWritableStream;
      // Set initial time to ensure timeDelta > 0
      config.lastChunkTimeRef.current = Date.now() - 1000;
      
      const chunk = new ArrayBuffer(1024);
      Object.defineProperty(chunk, 'byteLength', { value: 1024 });
      
      const event = { data: chunk };
      const { result } = renderHook(() => useFileReceive(config));

      await act(async () => {
        await result.current.handleMessage(event);
      });

      expect(config.setReceiverSpeed).toHaveBeenCalled();
    });

    it('should update lastChunkTimeRef after receiving chunk', async () => {
      config.isMetaDataReceivedRef.current = true;
      config.writableStream.current = mockWritableStream;
      
      const chunk = new ArrayBuffer(8);
      Object.defineProperty(chunk, 'byteLength', { value: 8 });
      
      const event = { data: chunk };
      const { result } = renderHook(() => useFileReceive(config));

      await act(async () => {
        await result.current.handleMessage(event);
      });

      expect(config.lastChunkTimeRef.current).toBeGreaterThan(0);
    });

    it('should handle chunks with size property', async () => {
      config.isMetaDataReceivedRef.current = true;
      config.writableStream.current = mockWritableStream;
      
      const chunk = { data: new ArrayBuffer(8), size: 16 };
      
      const event = { data: chunk };
      const { result } = renderHook(() => useFileReceive(config));

      await act(async () => {
        await result.current.handleMessage(event);
      });

      expect(config.byteSentRef.current).toBe(16);
    });
  });

  describe('Save File Picker', () => {
    it('should trigger save file picker dialog when askForLocation is called', async () => {
      const mockFileHandle = {
        createWritable: mockCreateWritable.mockResolvedValue(mockWritableStream),
      };
      
      mockShowSaveFilePicker.mockResolvedValue(mockFileHandle);

      const { result } = renderHook(() => useFileReceive(config));

      await act(async () => {
        await result.current.askForLocation();
      });

      expect(mockShowSaveFilePicker).toHaveBeenCalledWith({
        suggestedName: 'test.txt',
        types: [
          {
            description: 'Received File',
            accept: { 'text/plain': ['.txt'] },
          },
        ],
      });
    });

    it('should create writable stream after file picker selection', async () => {
      const mockFileHandle = {
        createWritable: mockCreateWritable.mockResolvedValue(mockWritableStream),
      };
      
      mockShowSaveFilePicker.mockResolvedValue(mockFileHandle);

      const { result } = renderHook(() => useFileReceive(config));

      await act(async () => {
        await result.current.askForLocation();
      });

      expect(mockCreateWritable).toHaveBeenCalled();
    });

    it('should send status true report after creating writable stream', async () => {
      const mockFileHandle = {
        createWritable: mockCreateWritable.mockResolvedValue(mockWritableStream),
      };
      
      mockShowSaveFilePicker.mockResolvedValue(mockFileHandle);

      const { result } = renderHook(() => useFileReceive(config));

      await act(async () => {
        await result.current.askForLocation();
      });

      expect(mockDataChannel.current.send).toHaveBeenCalledWith(
        JSON.stringify({ status: true })
      );
    });

    it('should handle user cancellation of save dialog', async () => {
      mockShowSaveFilePicker.mockRejectedValue(new Error('User cancelled'));

      const { result } = renderHook(() => useFileReceive(config));

      await act(async () => {
        await result.current.askForLocation();
      });

      expect(config.setIsReadyToDownload).toHaveBeenCalledWith(false);
    });

    it('should send status false report on save dialog cancellation', async () => {
      mockShowSaveFilePicker.mockRejectedValue(new Error('User cancelled'));

      const { result } = renderHook(() => useFileReceive(config));

      await act(async () => {
        await result.current.askForLocation();
      });

      expect(mockDataChannel.current.send).toHaveBeenCalledWith(
        JSON.stringify({ status: false })
      );
    });

    it('should not send cancellation report if data channel is closed', async () => {
      mockShowSaveFilePicker.mockRejectedValue(new Error('User cancelled'));
      
      // Simulate closed data channel
      mockDataChannel.current.readyState = 'closed';

      const { result } = renderHook(() => useFileReceive(config));

      await act(async () => {
        await result.current.askForLocation();
      });

      expect(mockDataChannel.current.send).not.toHaveBeenCalledWith(
        JSON.stringify({ status: false })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle unknown data gracefully', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Ensure metadata has been received and writableStream is null
      config.isMetaDataReceivedRef.current = true;
      config.writableStream.current = null;
      
      // Data that doesn't match any condition (not string metadata, not EOF)
      const event = { data: new Uint8Array([1, 2, 3]) };
      const { result } = renderHook(() => useFileReceive(config));

      await act(async () => {
        await result.current.handleMessage(event);
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith('Unknown data received or no writable stream available');
      
      consoleWarnSpy.mockRestore();
    });

    it('should handle empty file name in metadata', async () => {
      const metadata = JSON.stringify({
        fileName: '',
        fileType: 'text/plain',
        fileSize: 1024,
      });

      const event = { data: metadata };
      const { result } = renderHook(() => useFileReceive(config));

      await act(async () => {
        await result.current.handleMessage(event);
      });

      // Empty string is falsy, so it uses default 'received_file'
      expect(config.fileNameRef.current).toBe('received_file');
    });

    it('should handle missing file type in metadata', async () => {
      const metadata = JSON.stringify({
        fileName: 'test.txt',
        fileSize: 1024,
      });

      const event = { data: metadata };
      const { result } = renderHook(() => useFileReceive(config));

      await act(async () => {
        await result.current.handleMessage(event);
      });

      expect(config.fileTypeRef.current).toBe('text/plain'); // Default value
    });

    it('should handle missing file size in metadata', async () => {
      const metadata = JSON.stringify({
        fileName: 'test.txt',
        fileType: 'text/plain',
      });

      const event = { data: metadata };
      const { result } = renderHook(() => useFileReceive(config));

      await act(async () => {
        await result.current.handleMessage(event);
      });

      expect(config.fileSizeRef.current).toBeUndefined();
    });

    it('should handle chunk with no size or byteLength property', async () => {
      config.isMetaDataReceivedRef.current = true;
      
      const event = { data: {} }; // No size or byteLength
      
      const { result } = renderHook(() => useFileReceive(config));

      await act(async () => {
        await result.current.handleMessage(event);
      });

      // Should not crash, just add 0 to byteSentRef
      expect(config.byteSentRef.current).toBe(0);
    });

    it('should handle writable stream write errors', async () => {
      config.isMetaDataReceivedRef.current = true;
      config.writableStream.current = mockWritableStream;
      
      mockWritableStream.write.mockRejectedValue(new Error('Write failed'));
      
      const chunk = new ArrayBuffer(8);
      Object.defineProperty(chunk, 'byteLength', { value: 8 });
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const event = { data: chunk };
      const { result } = renderHook(() => useFileReceive(config));

      // The hook catches errors internally, so we need to handle the promise rejection
      await act(async () => {
        try {
          await result.current.handleMessage(event);
        } catch (e) {
          // Expected - error is caught and logged by hook
        }
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error writing chunk to stream:', expect.any(Error));
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Speed Calculation Throttling', () => {
    it('should only update speed every 500ms', async () => {
      config.isMetaDataReceivedRef.current = true;
      config.writableStream.current = mockWritableStream;
      // Set lastUpdateTimeRef to current time so first chunk doesn't trigger update
      config.lastUpdateTimeRef.current = Date.now();
      
      const chunk1 = new ArrayBuffer(1024);
      Object.defineProperty(chunk1, 'byteLength', { value: 1024 });
      
      const event1 = { data: chunk1 };
      const { result } = renderHook(() => useFileReceive(config));

      await act(async () => {
        await result.current.handleMessage(event1);
      });

      // First chunk should not update speed (within 500ms window)
      expect(config.setReceiverSpeed).not.toHaveBeenCalled();

      // Wait for 500ms to pass
      vi.useFakeTimers();
      
      const chunk2 = new ArrayBuffer(1024);
      Object.defineProperty(chunk2, 'byteLength', { value: 1024 });
      
      await act(async () => {
        vi.advanceTimersByTime(600); // Advance 600ms
        await result.current.handleMessage({ data: chunk2 });
      });

      // Second chunk should update speed (after 500ms window)
      expect(config.setReceiverSpeed).toHaveBeenCalled();
      
      vi.useRealTimers();
    });
  });

  describe('Progress Update', () => {
    it('should update progress for each chunk received', async () => {
      config.isMetaDataReceivedRef.current = true;
      config.writableStream.current = mockWritableStream;
      
      const chunk1 = new ArrayBuffer(256);
      Object.defineProperty(chunk1, 'byteLength', { value: 256 });
      
      const event1 = { data: chunk1 };
      const { result } = renderHook(() => useFileReceive(config));

      await act(async () => {
        await result.current.handleMessage(event1);
      });

      // Progress should be (256 / 1024) * 100 = 25%
      expect(config.setTransferCompletion).toHaveBeenCalledWith(25);
    });

    it('should accumulate progress across multiple chunks', async () => {
      config.isMetaDataReceivedRef.current = true;
      config.writableStream.current = mockWritableStream;
      
      const chunk1 = new ArrayBuffer(256);
      Object.defineProperty(chunk1, 'byteLength', { value: 256 });
      
      const event1 = { data: chunk1 };
      const { result } = renderHook(() => useFileReceive(config));

      await act(async () => {
        await result.current.handleMessage(event1);
      });

      // Second chunk - total should be (512 / 1024) * 100 = 50%
      const chunk2 = new ArrayBuffer(256);
      Object.defineProperty(chunk2, 'byteLength', { value: 256 });
      
      await act(async () => {
        await result.current.handleMessage({ data: chunk2 });
      });

      expect(config.setTransferCompletion).toHaveBeenCalledWith(50);
    });
  });
});
