# App.jsx Modularization Plan

## 📊 Dependency Map — What Each Piece Does & Where It's Consumed

### State Variables (all exposed via `p2pValue` → `useP2P()`)
| Variable | Type | Used By | Purpose |
|----------|------|---------|---------|
| `connectionId` | state | `ConnectionCard.jsx` | Display sender ID |
| `dataChOpen` | state | `ConnectionCard`, `FileUpload`, `ReceiverForm` | Show connection status |
| `transferCompletion` | state | `ProgressBar` | Progress bar percentage |
| `speed` | state | `ProgressBar` | Sender transfer speed (Mbps) |
| `receiverSpeed` | state | `ProgressBar` | Receiver download speed (Mbps) |
| `socketConnected` | state | `ConnectionCard`, `ServerWarning` | Socket connection indicator |
| `socketError` | state | `ServerWarning` | Show error banner |
| `file` / `setFile` | state/setter | `FileUpload` (setter), `SenderForm` (getter) | Selected file for upload |
| `notification` / `setNotification` | state/setter | `Notification.jsx` | Toast messages |
| `showApprove` | state | `ReceiverForm` | Show/hide approval UI |
| `isReadyToDownload` | state | **App.jsx internal only** (useEffect → `askForLocation`) | Triggers file picker dialog |
| `wantsClose` | state | **App.jsx internal only** (useEffect → closes dataChannel) | Disconnect trigger from ReceiverForm |
| `connectTO` / `uploadFile` / `generateNewId` | callbacks | `ReceiverForm`, `SenderForm` | Core actions |

### Unused State (Dead Code) ✅ REMOVED 2025-07-23
- ~~`isSocket`~~ → **REMOVED** — duplicate of `socketConnected`; no component consumed it
- ~~`downloadURL`~~ → **REMOVED** — never held real data; file receive uses File System Access API directly
- ~~`signalState`~~ → **REMOVED** — set in handlers but zero consumers anywhere

### Refs (Internal Only, Not Exposed to Components)
| Ref | Purpose |
|-----|---------|
| `socketRef` | Socket.io instance |
| `peerRef` | RTCPeerConnection instance |
| `dataChannel` | WebRTC DataChannel |
| `remoteSocketID` | Connected peer's socket ID |
| `pendingCandidates` | ICE candidates queued before remote description |
| `canSendData` | Flow control flag (receiver approved) |

### File Metadata Refs (Internal Only)
- `fileNameRef`, `fileTypeRef`, `fileSizeRef` — metadata for incoming files
- `metadataRef` — parsed JSON metadata from sender
- `receivedData` — array (unused, appears to be leftover)

### Transfer Tracking Refs (Internal Only)
- `byteSentRef` — bytes sent/received counter
- `lastChunkTimeRef`, `lastBytesReceivedRef` — receiver speed calculation
- `lastSenderChunkTimeRef`, `lastSenderBytesSentRef` — sender speed calculation
- `lastUpdateTimeRef`, `lastUpdateTransferRef` — throttle timers for UI updates

### Functions (Internal to App.jsx)
| Function | Lines | What It Does | Coupling Issue |
|----------|-------|--------------|----------------|
| `logConnectionType()` | 56–94 | WebRTC stats → logs connection type (P2P/TURN/STUN) | Depends on `peerRef` only — **clean, extractable** |
| `dataChannelEvents()` | 95–107 | Sets up receiver-side data channel handlers (onopen, onerror, onbufferedamountlow) | Depends on `dataChannel`, `setDataChOpen` — **extractable with refs passed in** |
| `senderDataChannelEvents()` | 108–129 | Sets up sender-side message handler for status messages | Depends on `dataChannel`, `canSendData` — **extractable** |
| `askForLocation()` (inside useEffect) | 130–165 | File System Access API dialog → sends approval to sender | Depends on refs + setters — **tightly coupled, but internal** |
| `registerSocketHandlers()` | 167–328 | **THE BIG ONE** — wires ALL socket.io events: ICE candidates, offers, answers, data channel creation | **Closes over ~40 variables (refs + setters). Cannot be extracted without passing everything.** |
| `connectTO(remotePeer)` | 359–371 | Emits "connect-to-sender" to remote peer | Depends on `socketRef`, `peerRef` — **extractable** |
| `uploadFile(file)` | 374–468 | **THE OTHER BIG ONE** — chunks file, sends with backpressure control, calculates speed | Depends on `dataChannel`, refs, setters — **tightly coupled but self-contained logic** |
| `generateNewId()` | 490–592 | Tears down everything → recreates socket + peer → re-registers handlers | **100% duplicates the initial useEffect setup. This is copy-paste duplication.** |

### Side Effects (useEffect)
| # | Lines | Trigger | What It Does |
|---|-------|---------|--------------|
| 1 | 130–165 | `isReadyToDownload` changes | Opens file picker, sends approval status |
| 2 | 330–487 | Mount (empty deps) | **Initializes socket.io + RTCPeerConnection + registers ALL handlers** |
| 3 | 490–495 | `wantsClose` changes | Closes data channel |

---

## 🚨 God Component Diagnosis

### Yes, App.jsx is a God Component (~769 lines after Phase 6 cleanup)
It violates the Single Responsibility Principle by handling **6 distinct responsibilities**:

| Responsibility | Lines (approx) | % of File |
|---------------|----------------|-----------|
| Routing & Provider setup | ~30 | 4% |
| Socket.io initialization + event wiring | ~160 | 20% |
| WebRTC peer/connection management | ~170 | 21% |
| File transfer logic (sender chunking) | ~95 | 12% |
| File receive logic (receiver streaming) | ~80 | 10% |
| UI state + helpers (speed, progress, notifications) | ~60 | 7% |
| **`generateNewId()` — duplicate of initial setup** | ~100 | ~13% |
| `logConnectionType()`, `dataChannelEvents()`, etc. | ~80 | 10% |

### Key Problems Identified
#### Problem A: Massive Duplication (`useEffect` #2 vs `generateNewId`)
Lines 330–487 and lines 490–592 are **nearly identical**. Both create a new socket.io connection, create a new RTCPeerConnection with the same config, and register all the same event handlers via `registerSocketHandlers()`. Any change to initialization must be made in two places.

#### Problem B: `registerSocketHandlers()` Closes Over Everything
The function captures ~40 variables from App's scope (refs, setters, state). It cannot be extracted as a standalone hook because it needs access to all of them. This is the single biggest blocker to modularization.

#### Problem C: Mixed Concerns in One useEffect
Effect #2 does three things at once: initializes socket.io connection, creates RTCPeerConnection, and registers ALL socket event handlers. These are separate concerns that should be separated.

#### Problem D: Unused State (`isSocket`, `downloadURL`, `signalState`) ✅ RESOLVED
**Resolved 2025-07-23:** All three removed from App.jsx, Sender.jsx, Receiver.jsx, SenderForm.jsx, and ReceiverForm.jsx. Zero references remain in codebase.

#### Problem E: No Abstraction for WebRTC Lifecycle
Creating, connecting, disconnecting, and reconnecting the peer connection is all inline logic with no reusable abstraction.

---

## 🛠️ Proposed Modularization Plan

### Phase 1: Extract `useSocketIO` Hook (Start Here)
**Why:** Socket.io initialization, connection management, and event registration are ~160 lines of self-contained logic that's independent of WebRTC. Smallest & safest win.
**What it returns:**
```javascript
{
  socketRef,           // Socket.io instance
  connected,           // boolean — is socket connected?
  error,               // boolean — was there a connection error?
  emit(event, data),   // shorthand for socket.emit()
  on(event, cb)        // shorthand for socket.on()
}
```
**Files to create:** `P2P-sharing/src/hooks/useSocketIO.js`
**Files to change:** `App.jsx`

### Phase 2: Extract `useWebRTC` Hook
**Why:** WebRTC logic (peer creation, ICE handling, data channel setup, offer/answer exchange) is ~250 lines of tightly coupled code that's completely independent of UI concerns. Consumes `useSocketIO`.
**What it returns:**
```javascript
{
  peerRef,           // RTCPeerConnection instance
  dataChannel,       // DataChannel instance
  remoteSocketID,    // Connected peer's socket ID
  connectToPeer(remoteId),     // Initiates connection as sender
  acceptConnection(socketId),  // Accepts incoming connection as receiver
  closeConnection(),           // Tears down peer + channel
  onICECandidate: (cb) => {}, // Register ICE candidate callback
  onDataChannelMessage: (cb) => {} // Register data channel message handler
}
```
**Files to create:** `P2P-sharing/src/hooks/useWebRTC.js`
**Files to change:** `App.jsx`, `useSocketIO.js`

### Phase 3: Extract `useFileTransfer` Hook
**Why:** The sender-side chunking logic (`uploadFile`) is ~95 lines of pure transfer logic with backpressure control, speed calculation, and progress tracking. Self-contained.
**What it returns:**
```javascript
{
  upload(file),                    // Send file over data channel
  progress,                        // Number (0–100)
  senderSpeed,                     // Mbps
  receiverSpeed,                   // Mbps (set by receiver-side handler)
  onProgress: (cb) => {},          // Callback for progress updates
  onSpeedUpdate: (cb) => {}        // Callback for speed updates
}
```
**Files to create:** `P2P-sharing/src/hooks/useFileTransfer.js`
**Files to change:** `App.jsx`, `useWebRTC.js`

### Phase 4: Extract `useFileReceive` Hook
**Why:** Receiver-side file streaming logic (metadata parsing, File System Access API dialog, chunk writing) is ~80 lines of self-contained receive logic.
**What it returns:**
```javascript
{
  showApprove,                     // boolean — should UI show approval?
  approveDownload(),               // Opens file picker + sends approval
  cancelDownload(),                // Sends rejection to sender
  fileName,                        // String — name of incoming file
  fileSize,                        // Number — size in bytes
}
```
**Files to create:** `P2P-sharing/src/hooks/useFileReceive.js`
**Files to change:** `App.jsx`, `useWebRTC.js`

### Phase 5: Extract `useUIState` Hook
**Why:** Notification management and other UI-level state are trivially extractable.
**What it returns:**
```javascript
{
  notification,                    // { message, type } | null
  setNotification(fn),             // Setter (accepts value or updater function)
}
```
**Files to create:** `P2P-sharing/src/hooks/useUIState.js`
**Files to change:** `App.jsx`

### Phase 6: Cleanup Dead Code & Simplify App.jsx ✅ COMPLETED 2025-07-23 (Partial)
**What was done:**
- ✅ Removed unused state (`isSocket`, `downloadURL`, `signalState`) from App.jsx
- ✅ Removed all setter calls (`setIsSocket`, `setDownloadURL`, `setSignalState`) from socket handlers in both initial useEffect and generateNewId()
- ✅ Removed `setSignalState(true)` calls from `incoming-call` and `incoming-answer` handlers (these were causing runtime errors after state removal)
- ✅ Cleaned up prop drilling: removed unused props (`isSocket`, `downloadURL`) from Sender.jsx, Receiver.jsx, SenderForm.jsx, ReceiverForm.jsx
- ✅ App.jsx reduced from ~800 lines to ~769 lines

**What remains for Phase 6:**
- Replace `generateNewId()` with a single `resetConnection()` call that reuses the hooks' internal reset logic (eliminating ~100 lines of duplication)
- Consolidate all useEffects into one per hook

**Files changed:** App.jsx, Sender.jsx, Receiver.jsx, SenderForm.jsx, ReceiverForm.jsx

---

## 🏗️ Target Architecture After Refactoring
```
App.jsx (~80 lines, down from ~800)
├── useSocketIO()          → manages socket.io lifecycle
├── useWebRTC(socketRef)   → manages WebRTC peer + data channel
├── useFileTransfer(dataChannel) → sender chunking + speed calc
└── useFileReceive(dataChannel)  → receiver streaming + approval UI

P2PContext.jsx (unchanged — still provides the same interface, just with a cleaner value object from composed hooks)

Components (all unchanged — they only consume context via useP2P())
├── ConnectionCard         → connectionId, socketConnected, dataChOpen
├── ServerWarning          → socketError, socketConnected
├── FileUpload             → dataChOpen, setFile, file
├── ProgressBar            → transferCompletion, speed, receiverSpeed, file
├── Notification           → notification, setNotification
└── SenderForm / ReceiverForm → all actions via useP2P()
```

---

## 📈 Implementation Order & Risk Assessment
| Phase | Effort | Risk | Why First? |
|-------|--------|------|------------|
| **Phase 1: `useSocketIO`** | Small | Low | Simple, self-contained; needed by Phase 2 anyway |
| **Phase 2: `useWebRTC`** | Medium | Low | Highest complexity isolation; no external dependencies |
| **Phase 3: `useFileTransfer`** | Medium | Low-Medium | Self-contained sender logic; speed refs are internal |
| **Phase 4: `useFileReceive`** | Medium | Medium | Touches File System Access API + approval flow; needs testing |
| **Phase 5: `useUIState`** | Small | Very Low | Trivial extraction |
| **Phase 6: Cleanup** | Small | Low | ~~Remove dead code~~ ✅ DONE — Eliminate `generateNewId()` duplication via shared hook reset logic |

### Recommended Order: **1 → 2 → 3 → 4 → 5 → 6 (Phase 6 partially complete)**

---

## ✅ Summary of Benefits
| Metric | Before | After (Target) |
|--------|--------|----------------|
| `App.jsx` lines | ~800 | ~80–100 |
| Duplication (`generateNewId`) | ~100 lines duplicated | Eliminated via shared hook reset logic |
| Dead state variables | 3 (`isSocket`, `downloadURL`, `signalState`) | ~~3~~ → **0** ✅ Removed 2025-07-23
| Coupling between concerns | All mixed in one file | Cleanly separated into 4 hooks |
| Testability | Impossible to unit test individual pieces | Each hook is independently testable |

---

## 📝 Phase 6 Completion Log (2025-07-23)

### Changes Applied
| File | Lines Removed | What Was Deleted |
|------|---------------|------------------|
| `App.jsx` | ~31 lines | State declarations + all setter calls for `isSocket`, `downloadURL`, `signalState` in both initial useEffect and generateNewId() |
| `Sender.jsx` | 2 props | Removed `isSocket` from destructured params and passed to SenderForm |
| `Receiver.jsx` | 1 prop | Removed `downloadURL` from destructured params and passed to ReceiverForm |
| `SenderForm.jsx` | 1 prop | Removed `isSocket` from destructured params (never consumed) |
| `ReceiverForm.jsx` | 1 prop | Removed `downloadURL` from destructured params (never consumed) |

### Bug Fix: Runtime Error on Receiver Connection
**Issue:** After removing state declarations, two calls to `setSignalState(true)` remained inside `registerSocketHandlers()`:
- Line ~366 in `incoming-call` handler (receiver side)
- Line ~374 in `incoming-answer` handler (sender side)

These caused `ReferenceError: setSignalState is not defined` when a receiver tried to connect.

**Fix:** Removed both `setSignalState(true)` calls — they served no functional purpose as nothing consumed the state variable.

### Verification
- ✅ Zero references to `isSocket`, `downloadURL`, or `signalState` remain in entire codebase
- ✅ All socket handlers only use `setSocketConnected` and `setSocketError`
- ✅ No functionality changed — these variables were dead branches (set but never observed)

---

*Created: 2025-07-23 | Status: Phase 6 Partially Complete — Dead code removed, generateNewId() duplication remains for next phase*
