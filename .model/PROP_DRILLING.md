# Prop Drilling Analysis

## STATUS: COMPLETED (2025-07-23)
**Solution:** Implemented `P2PContext` with React Context API to eliminate prop drilling.

### Changes Made:
1. Created `src/context/P2PContext.jsx` - Context provider holding all P2P state + functions
2. Updated `App.jsx` - Wrapped routes in `P2PProvider`, removed props from route elements
3. Updated `Sender.jsx` - Removed prop drilling, now a pure layout wrapper
4. Updated `Receiver.jsx` - Removed prop drilling, now a pure layout wrapper  
5. Updated `SenderForm.jsx` - Uses `useP2P()` hook instead of props
6. Updated `ReceiverForm.jsx` - Uses `useP2P()` hook instead of props
7. Updated `ConnectionCard.jsx` - Now uses `useP2P()` for all props (connectionId, generateNewId, socketConnected, dataChOpen)
8. Updated `ServerWarning.jsx` - Now uses `useP2P()` for socketError, socketConnected
9. Updated `ProgressBar.jsx` - Now uses `useP2P()` for progress (transferCompletion), speed
10. Updated `FileUpload.jsx` - Now uses `useP2P()` for isConnected (dataChOpen)

---

## Sender Flow (Before Refactor)
**Old Hierarchy:** `App.jsx` -> `Sender.jsx` -> `SenderForm.jsx` -> (Various UI Components)

### Props Drilled (Now via Context):
- `connectionId`, `generateNewId`, `isSocket`, `uploadFile`
- `dataChOpen`, `transferCompletion`, `speed`, `setWantsClose`
- `socketConnected`, `socketError`

### Child Components - Current State:
#### 1. ServerWarning [FIXED]
* ~~`socketError`, `socketConnected`~~ -> Now uses `useP2P()` directly (0 props)

#### 2. ConnectionCard [FIXED]
* ~~`connectionId`, `isConnected`, `onGenerateNewId`, `socketConnected`, `socketError`~~ -> Now uses `useP2P()` directly (0 props)

#### 3. FileUpload [PARTIAL]
* ~~`isConnected`~~ -> Now uses `useP2P()` for dataChOpen
* `onFileSelect`, `selectedFile` -> Local state in SenderForm, cannot move to global context (temporary UI data)

#### 4. ProgressBar [FIXED]
* ~~`progress`, `speed`~~ -> Now uses `useP2P()` directly
* `fileName`, `fileSize` -> Derived from local `file` object in SenderForm, acceptable as props

#### 5. Notification [ACCEPTABLE AS-IS]
* `message`, `type`, `onClose` -> Purely ephemeral toast state, should never be in global context

---

## Receiver Flow (Before Refactor)
**Old Hierarchy:** `App.jsx` -> `Receiver.jsx` -> `ReceiverForm.jsx`

### Props Drilled (Now via Context):
- `connectTO`, `downloadURL`, `dataChOpen`, `showApprove`
- `setIsReadyToDownload`, `transferCompletion`, `speed`, `setWantsClose`

### Child Components - Current State:
#### 1. ProgressBar [FIXED]
* ~~`progress`, `speed`~~ -> Now uses `useP2P()` directly (0 props)

---

## Remaining Props - Cannot Be Moved to Context

These props are **intentionally kept** as they represent local/ephemeral UI state that would pollute global context if moved.

### Local State (SenderForm only):
| Prop | Component | Reason |
|------|-----------|--------|
| `selectedFile` | FileUpload | Temporary file selection, resets on navigation |
| `onFileSelect` | FileUpload | Callback to update local state |
| `fileName`, `fileSize` | ProgressBar | Derived from local `file` object |

### Ephemeral Toast State:
| Prop | Component | Reason |
|------|-----------|--------|
| `message`, `type`, `onClose` | Notification | Auto-dismissing, component-specific lifecycle |
