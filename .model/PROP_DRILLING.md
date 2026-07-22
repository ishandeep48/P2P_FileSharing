# Prop Drilling Analysis

## 📤 Sender Flow
**Hierarchy:** `App.jsx` $\rightarrow$ `Sender.jsx` $\rightarrow$ `SenderForm.jsx` $\rightarrow$ (Various UI Components)

### Stage 1: App.jsx $\rightarrow$ Sender.jsx
The following props are passed from the root to the Sender page wrapper:
- `connectionId`
- `generateNewId`
- `isSocket`
- `uploadFile`
- `dataChOpen`
- `transferCompletion`
- `speed`
- `setWantsClose`
- `socketConnected`
- `socketError`

### Stage 2: Sender.jsx $\rightarrow$ SenderForm.jsx
The same set of props is passed through the Sender page to the main form component:
- `connectionId`
- `generateNewId`
- `isSocket`
- `uploadFile`
- `dataChOpen`
- `transferCompletion`
- `speed`
- `setWantsClose`
- `socketConnected`
- `socketError`

### Stage 3: SenderForm.jsx $\rightarrow$ Child Components
The form component further drills or passes down props to its specialized UI components:

#### **1. ServerWarning**
*   `socketError` (from `SenderForm`)
*   `socketConnected` (from `SenderForm`)

#### **2. ConnectionCard**
*   `connectionId` (from `SenderForm`)
*   `isConnected` (derived from `dataChOpen` in `SenderForm`)
*   `onGenerateNewId` (derived from `generateNewId` in `SenderForm`)
*   `socketConnected` (from `SenderForm`)
*   `socketError` (from `SenderForm`)

#### **3. FileUpload**
*   `onFileSelect` (local state setter in `SenderForm`)
*   `selectedFile` (local state `file` in `SenderForm`)
*   `isConnected` (derived from `dataChOpen` in `SenderForm`)

#### **4. ProgressBar**
*   `progress` (derived from `transferCompletion` in `SenderForm`)
*   `speed` (from `SenderForm`)
*   `fileName` (derived from local state `file.name` in `SenderForm`)
*   `fileSize` (derived from local state `file.size` in `SenderForm`)

#### **5. Notification**
*   `message` (derived from local state `notification.message` in `SenderForm`)
*   `type` (derived from local state `notification.type` in `SenderForm`)
*   `onClose` (local setter in `SenderForm`)

---

## 📥 Receiver Flow
**Hierarchy:** `App.jsx` $\rightarrow$ `Receiver.jsx` $\rightarrow$ `ReceiverForm.jsx`

### Stage 1: App.jsx $\rightarrow$ Receiver.jsx
The following props are passed from the root to the Receiver page wrapper:
- `connectTO`
- `downloadURL`
- `dataChOpen`
- `showApprove`
- `setIsReadyToDownload`
- `transferCompletion`
- `speed`
- `setWantsClose`
- `transferError`

### Stage 2: Receiver.jsx $\rightarrow$ ReceiverForm.jsx
The following props are passed through the Receiver page to the main form component:
- `connectTO`
- `downloadURL`
- `dataChOpen`
- `showApprove`
- `setIsReadyToDownload`
- `transferCompletion`
- `speed`
- `setWantsClose`

### Stage 3: ReceiverForm.jsx $\rightarrow$ Child Components
*(Note: Detailed analysis of ReceiverForm.jsx children would be required for full completeness, but the primary drilling is identified above.)*
