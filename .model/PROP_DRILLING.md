# Prop Drilling Analysis

## 📤 Sender Flow
**Hierarchy:** App.jsx $\rightarrow$ Sender.jsx $\rightarrow$ SenderForm.jsx

### Props passed from App.jsx to Sender.jsx:
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

### Props passed from Sender.jsx to SenderForm.jsx:
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

### Props passed within SenderForm.jsx to child components:
- **ServerWarning**: `socketError`, `socketConnected`
- **ConnectionCard**: `connectionId`, `isConnected` (from `dataChOpen`), `onGenerateNewId` (from `generateNewId`), `socketConnected`, `socketError`
- **FileUpload**: `onFileSelect`, `selectedFile`, `isConnected` (from `dataChOpen`)
- **ProgressBar**: `progress` (from `transferCompletion`), `speed`, `fileName`, `fileSize`
- **Notification**: `message`, `type`, `onClose`

---

## 📥 Receiver Flow
**Hierarchy:** App.jsx $\rightarrow$ Receiver.jsx $\rightarrow$ ReceiverForm.jsx

### Props passed from App.jsx to Receiver.jsx:
- `connectTO`
- `downloadURL`
- `dataChOpen`
- `showApprove`
- `setIsReadyToDownload`
- `transferCompletion`
- `speed`
- `setWantsClose`
- `transferError`

### Props passed from Receiver.jsx to ReceiverForm.jsx:
- `connectTO`
- `downloadURL`
- `dataChOpen`
- `showApprove`
- `setIsReadyToDownload`
- `transferCompletion`
- `speed`
- `setWantsClose`

### Props passed within ReceiverForm.jsx to child components:
*(Note: Detailed analysis of ReceiverForm.jsx children would be required for full completeness, but the primary drilling is identified above.)*
