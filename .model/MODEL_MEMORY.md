# P2P File Sharing - Project Memory & Context

## 📁 Repository Structure

```
P2P_FileSharing/
├── server/                    # Backend (Node.js + Express + Socket.IO)
│   └── server.js              # Signaling server on port 5000
├── P2P-sharing/               # Frontend (React 19 + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── App.jsx            # Main app: WebRTC, Socket.io, state management
│   │   ├── main.jsx           # Entry point
│   │   ├── components/        # Reusable UI components
│   │   └── pages/             # Page components (Home, Sender, Receiver)
│   ├── .env                   # Environment variables
│   └── package.json
├── MODEL_MEMORY.md            # This file - project context and history
└── README.md                  # Project documentation
```

## 🛠 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, react-router-dom
- **Backend**: Node.js, Express, Socket.IO (signaling server)
- **P2P Communication**: WebRTC (RTCPeerConnection, raw API)
- **File Transfer**: File System Access API (WritableStream)
- **QR Code**: qrcode.react (generation), @yudiel/react-qr-scanner (scanning)

## 🚀 Setup & Development

### Environment Variables (.env in P2P-sharing/)
```env
VITE_SOCKET_SERVER=http://localhost:5000
# Optional TURN servers for NAT traversal:
# VITE_TURN_SERVER=turn:your-server-url
# VITE_TURN_USERNAME=your-username
# VITE_TURN_PASSWORD=your-password
```

### Starting Servers
1. **Backend**: `cd server && node server.js` (port 5000)
2. **Frontend**: `cd P2P-sharing && npm run dev` (port 3000)

### Common Issues & Fixes
- **Port conflicts**: Use PowerShell `Stop-Process -Id <PID> -Force` to kill processes
- **Malformed RTCIceServer error**: Caused by undefined TURN server env vars
- **WebSocket connection failures**: Fixed by pointing `.env` to correct backend port (5000)

## 🔄 Git History & Operations

### Reverted Commits (chronological order)
1. `7170b4d` → Revert commit `764e555`: "Add transfer error handling and improve data channel configuration"
2. `cdd36ef` → Revert commit `d32b04d`: "Rename project from Server_Aided_P2P to P2P_FileSharing in package-lock.json"
3. `82b6481` → Revert commit `f7992f9`: "feat: Implement P2P file sharing functionality with context and hooks"

### Conflict Resolution Strategy
- Used `git checkout --theirs` during reverts because commit `82b6481` heavily refactored `App.jsx` with React Context, making direct reversions incompatible without taking the newer state.

## 🧠 Frontend Architecture & Workflow

### Component Hierarchy
```
App.jsx (State + WebRTC + Socket.io)
├── Home (/) → Links to /sender or /receiver
├── Sender (/sender)
│   └── SenderForm.jsx
│       ├── ConnectionCard (shows ID + QR code)
│       ├── FileUpload (file picker)
│       ├── Send Button
│       └── ProgressBar (progress + speed)
└── Receiver (/receiver)
    └── ReceiverForm.jsx
        ├── QR Scanner / Manual ID input
        ├── Approve/Reject buttons
        └── ProgressBar
```

### Signaling Flow (Socket.IO)
1. **Connection**: Each peer gets a unique 6-character short ID from server
2. **Initiation**: Receiver enters sender's ID or scans QR code → calls `connectTO(id)`
3. **Offer/Answer Exchange**: 
   - Sender creates offer → emits `outgoing-call` to receiver
   - Receiver receives `incoming-call`, creates answer, emits `call-accepted`
4. **ICE Candidates**: Exchanged via `ice-candidate` events through server
5. **Data Channel**: Opens automatically when WebRTC connection is established

### File Transfer Flow (Data Channel)
**Sender Side:**
1. User selects file → `uploadFile(file)` called
2. Sends metadata JSON: `{ fileName, fileType, fileSize }`
3. Waits for receiver's approval (`canSendData = true`)
4. Reads file in 256KB chunks, sends each chunk via `dataChannel.send(chunk)`
5. After all chunks sent → sends `"__EOF__"`

**Receiver Side:**
1. Receives metadata JSON → shows approval UI (`showApprove = true`)
2. User clicks "Approve Download" → calls `window.showSaveFilePicker()`
3. Sends `{ status: true }` back to sender via data channel
4. Writes each incoming chunk to file using File System Access API (WritableStream)
5. Receives `"__EOF__"` → validates byte count matches expected size
6. Closes stream, sends `"__EOF_ACK__"`

### Key State in App.jsx
| State | Purpose |
|-------|---------|
| `connectionId` | Unique 6-char ID for this peer |
| `dataChOpen` | Data channel open? (true = ready to transfer) |
| `showApprove` | Show "approve download" UI on receiver side |
| `transferCompletion` | Progress percentage (0–100) |
| `speed` / `receiverSpeed` | Transfer speed in MB/s |
| `socketConnected` | Socket.IO connected to backend? |

### WebRTC Configuration
```js
const rtcConfig = {
  iceTransportPolicy: "all",
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun.services.mozilla.com" },
    // TURN server (only if env vars are set)
  ],
};
```

### Data Channel Configuration
```js
createDataChannel("file-transfer", {
  ordered: true,      // Guaranteed delivery order
  priority: "high",   // High-priority traffic
});
binaryType = "arraybuffer";  // Binary data for chunks
```

## 🔑 Key Functions in App.jsx

| Function | Role |
|----------|------|
| `registerSocketHandlers()` | Sets up all socket event listeners (calls, ICE candidates) |
| `connectTO(remotePeer)` | Receiver initiates connection to sender's ID |
| `uploadFile(file)` | Sender reads file in chunks and sends via data channel |
| `dataChannelEvents()` | Handles incoming messages on receiver side |
| `senderDataChannelEvents()` | Handles approval status from receiver |
| `generateNewId()` | Resets everything for a new connection session |

## 📝 Important Notes & Learnings

### TURN Server Configuration
- TURN servers are included directly in the iceServers array
- If any of VITE_TURN_SERVER, VITE_TURN_USERNAME, or VITE_TURN_PASSWORD are undefined, WebRTC will crash with "Malformed RTCIceServer" error
- Solution: Either set all three env vars OR filter out undefined values before passing to RTCPeerConnection

### Socket.IO Connection
- Backend runs on port 5000, frontend dev server on port 3000
- `.env` must point VITE_SOCKET_SERVER to http://localhost:5000 (not the frontend port)
- Socket.IO uses WebSocket transport exclusively for better performance

### File Transfer Details
- Uses File System Access API (modern browsers only) for direct file writing
- Chunk size: 256KB with flow control (15MB buffer limit, 5ms throttle delay)
- Progress tracking updates every 100ms on sender side, 500ms on receiver side
- Speed calculation based on chunk timing and byte counts

### Connection Lifecycle
- When user clicks "Generate New ID" or connection closes:
  1. Closes data channel, peer connection, socket
  2. Resets all state (progress, speed, refs)
  3. Creates new Socket.IO connection → gets new short ID
  4. Re-registers all event handlers (`registerSocketHandlers()`)

## 🐛 Known Issues & Edge Cases

1. **TURN Server Crash**: If TURN env vars are undefined, WebRTC initialization fails
2. **Port Conflicts**: Stale node processes may occupy ports 3000 or 5000
3. **Browser Compatibility**: File System Access API not available in all browsers (Firefox, Safari)
4. **NAT Traversal**: Without TURN servers, P2P connections may fail behind strict NATs

## 📚 Dependencies Summary

### Frontend (P2P-sharing/package.json)
- react, react-dom, react-router-dom
- socket.io-client
- qrcode.react (QR generation)
- @yudiel/react-qr-scanner (QR scanning)
- vite, tailwindcss

### Backend (server/package.json)
- express
- socket.io
- uuid
- cors

---

*Last updated: Current session context preserved for future reference*
