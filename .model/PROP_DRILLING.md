# Prop Drilling Analysis

## STATUS: COMPLETED (2025-07-23) - FINAL
**Solution:** Implemented `P2PContext` with React Context API to eliminate ALL prop drilling.

### Changes Made:
1. Created `src/context/P2PContext.jsx` - Context provider holding all P2P state + functions
2. Updated `App.jsx` - Wrapped routes in `P2PProvider`, removed props from route elements, manages all state (P2P + local UI)
3. Updated `Sender.jsx` - Removed prop drilling, now a pure layout wrapper
4. Updated `Receiver.jsx` - Removed prop drilling, now a pure layout wrapper  
5. Updated `SenderForm.jsx` - Uses `useP2P()` hook instead of props (file, setFile, notification, setNotification)
6. Updated `ReceiverForm.jsx` - Uses `useP2P()` hook instead of props (receiverSpeed for correct speed display)
7. Updated `ConnectionCard.jsx` - Now uses `useP2P()` for all props (connectionId, generateNewId, socketConnected, dataChOpen)
8. Updated `ServerWarning.jsx` - Now uses `useP2P()` for socketError, socketConnected
9. Updated `ProgressBar.jsx` - Now uses `useP2P()` for progress (transferCompletion), speed, receiverSpeed, file
10. Updated `FileUpload.jsx` - Now uses `useP2P()` for dataChOpen, setFile, selectedFile
11. Updated `Notification.jsx` - Now uses `useP2P()` for message, type, onClose

---

## Sender Flow (Before Refactor)
**Old Hierarchy:** `App.jsx` -> `Sender.jsx` -> `SenderForm.jsx` -> (Various UI Components)

### Props Drilled (Now via Context):
- `connectionId`, `generateNewId`, `isSocket`, `uploadFile`
- `dataChOpen`, `transferCompletion`, `speed`, `setWantsClose`
- `socketConnected`, `socketError`
- `file`, `setFile`, `notification`, `setNotification`

### Child Components - Current State:
#### 1. ServerWarning [FIXED]
* ~~`socketError`, `socketConnected`~~ -> Now uses `useP2P()` directly (0 props)

#### 2. ConnectionCard [FIXED]
* ~~`connectionId`, `isConnected`, `onGenerateNewId`, `socketConnected`, `socketError`~~ -> Now uses `useP2P()` directly (0 props)

#### 3. FileUpload [FIXED]
* ~~`onFileSelect`, `selectedFile`, `isConnected`~~ -> Now uses `useP2P()` for dataChOpen, setFile, selectedFile (0 props)

#### 4. ProgressBar [FIXED]
* ~~`progress`, `speed`, `fileName`, `fileSize`~~ -> Now uses `useP2P()` directly with effectiveSpeed logic (0 props)

#### 5. Notification [FIXED]
* ~~`message`, `type`, `onClose`~~ -> Now uses `useP2P()` for notification object, setNotification (0 props)

---

## Receiver Flow (Before Refactor)
**Old Hierarchy:** `App.jsx` -> `Receiver.jsx` -> `ReceiverForm.jsx`

### Props Drilled (Now via Context):
- `connectTO`, `downloadURL`, `dataChOpen`, `showApprove`
- `setIsReadyToDownload`, `transferCompletion`, `receiverSpeed`, `setWantsClose`

### Child Components - Current State:
#### 1. ProgressBar [FIXED]
* ~~`progress`, `speed`~~ -> Now uses `useP2P()` directly with effectiveSpeed logic (0 props)

---

## Final Status: ZERO PROP DRILLING REMAINING

All components now consume state directly via `useP2P()` hook. No props are passed between parent and child components for P2P or UI state.

### Architecture:
- **App.jsx** manages all state (P2P + local UI) and passes it to `<P2PProvider>`
- **Context Provider** distributes state globally via `useP2P()` hook
- **All Components** (`ConnectionCard`, `ServerWarning`, `FileUpload`, `ProgressBar`, `Notification`) consume only what they need via `useP2P()`
- **Zero props** passed between parent and child components for data/state

### Remaining Props (Acceptable - Local UI State):
| Component | Props | Reason |
|-----------|-------|--------|
| `LoadingSpinner` | `size`, `text` | Purely local presentation state, renders once inline in SenderForm. Moving to context would pollute global store for a single-use component. |

### Key Bug Fixes Applied:
1. **ReceiverSpeed Issue:** ReceiverForm.jsx was reading `speed` (sender speed) instead of `receiverSpeed`. Fixed by destructuring correct variable and using it in ProgressBar condition.
2. **ProgressBar Speed Logic:** Added `effectiveSpeed = receiverSpeed > 0 ? receiverSpeed : speed` to handle both sender and receiver contexts correctly.
