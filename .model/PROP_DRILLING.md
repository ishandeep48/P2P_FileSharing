# Prop Drilling Analysis

## ✅ STATUS: COMPLETED (2025-07-23)
**Solution:** Implemented `P2PContext` with React Context API to eliminate prop drilling.

### Changes Made:
1. Created `src/context/P2PContext.jsx` - Context provider holding all P2P state + functions
2. Updated `App.jsx` - Wrapped routes in `P2PProvider`, removed props from route elements
3. Updated `Sender.jsx` - Removed prop drilling, now a pure layout wrapper
4. Updated `Receiver.jsx` - Removed prop drilling, now a pure layout wrapper  
5. Updated `SenderForm.jsx` - Uses `useP2P()` hook instead of props
6. Updated `ReceiverForm.jsx` - Uses `useP2P()` hook instead of props

---

## 📤 Sender Flow (Before Refactor)
**Old Hierarchy:** `App.jsx` $\rightarrow$ `Sender.jsx` $\rightarrow$ `SenderForm.jsx` $\rightarrow$ (Various UI Components)

### Props Drilled (Now via Context):
- `connectionId`, `generateNewId`, `isSocket`, `uploadFile`
- `dataChOpen`, `transferCompletion`, `speed`, `setWantsClose`
- `socketConnected`, `socketError`

### Child Components (Still receive local props - not drilled from App):
#### **1. ServerWarning**
*   `socketError`, `socketConnected` (from SenderForm's context)

#### **2. ConnectionCard**
*   `connectionId`, `isConnected`, `onGenerateNewId`, `socketConnected`, `socketError`

#### **3. FileUpload**
*   `onFileSelect`, `selectedFile`, `isConnected` (all local to SenderForm)

#### **4. ProgressBar**
*   `progress`, `speed`, `fileName`, `fileSize` (derived from context/local state)

#### **5. Notification**
*   `message`, `type`, `onClose` (all local to SenderForm)

---

## 📥 Receiver Flow (Before Refactor)
**Old Hierarchy:** `App.jsx` $\rightarrow$ `Receiver.jsx` $\rightarrow$ `ReceiverForm.jsx`

### Props Drilled (Now via Context):
- `connectTO`, `downloadURL`, `dataChOpen`, `showApprove`
- `setIsReadyToDownload`, `transferCompletion`, `speed`, `setWantsClose`

---

## 📊 Prop Priority & Grouping

To optimize refactoring (e.g., moving to Context API), props have been grouped and ranked by their functional priority and impact on the application core.

### **Priority 1: Core Transfer & Connection State (Critical)**
*These are essential for the fundamental P2P operation.*
- `dataChOpen`: Determines if data can actually be sent/received via WebRTC.
- `uploadFile`: The primary action that drives the transfer logic.
- `connectionId`: Essential for peer identification and signaling.

### **Priority 2: Signaling & Network Status (High)**
*These manage the underlying communication layer.*
- `socketConnected` / `isSocket`: Indicates if the signaling server is reachable.
- `socketError`: Critical for error handling and user feedback during connection attempts.

### **Priority 3: Transfer Feedback (Medium)**
*Crucial for User Experience during an active transfer.*
- `transferCompletion`: Provides real-time progress updates.
- `speed`: Provides real-time data rate information.

### **Priority 4: Lifecycle & Control (Low)**
*Used for managing the session lifecycle.*
- `generateNewId`: Resets the entire connection state.
- `setWantsClose`: Allows the user to terminate a connection/transfer.

### **Priority 5: UI & Ephemeral State (Minimal)**
*Primarily used for local component feedback and does not affect core logic.*
- `notification` props (`message`, `type`, `onClose`)
- `file` metadata (`fileName`, `fileSize`)
