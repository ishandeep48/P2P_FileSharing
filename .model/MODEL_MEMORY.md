# ⚠️ AI MANDATORY: READ THIS FILE TO GET CONTEXT OF WHAT IS DONE AND WHAT IS NOT. UPDATE THIS FILE AFTER EVERY SIGNIFICANT CHANGE WITH THE REASON FOR THE CHANGE. ALWAYS INCLUDE A "LAST UPDATED" DATE AT THE END. MAINTAIN THE FILE STRUCTURE MAP SO IT REMAINS USEFUL. IF THIS FILE BECOMES BLOATED, COMPACT IT BY TRIMMING IRRELEVANT DETAILS. ⚠️

## 📌 Project Overview
**Name:** P2P File Sharing
**Core Function:** Direct peer-to-peer file transfer using WebRTC (Data Channels) and Socket.io for signaling.
**Tech Stack:** React 19, Vite, Tailwind CSS, Node.js, Express, Socket.io, simple-peer.

## 📂 Repository Structure & File Map
### 🖥️ Backend (`/server`)
*   `server.js`: The main signaling server (Socket.io) running on port 5000.

### 🌐 Frontend (`/P2P-sharing`)
#### Core Logic
*   `src/App.jsx`: **Refactored** - Now wraps routes in P2PProvider, holds all WebRTC/Socket state.
*   `src/main.jsx`: React entry point.

#### Pages (Routing Targets)
*   `src/pages/Home.jsx`: Landing page with navigation links.
*   `src/pages/Sender.jsx`: **Refactored** - Pure layout wrapper, no prop drilling.
*   `src/pages/SenderForm.jsx`: **Refactored** - Uses `useP2P()` context hook.
*   `src/pages/Receiver.jsx`: **Refactored** - Pure layout wrapper, no prop drilling.
*   `src/pages/ReceiverForm.jsx`: **Refactored** - Uses `useP2P()` context hook.

#### Components (Reusable UI)
*   `src/components/ConnectionCard.jsx`: Displays connection ID and QR code.
*   `src/components/FileUpload.jsx`: File picker component.
*   `src/components/ProgressBar.jsx`: Visual progress indicator for transfers.
*   `src/components/ParticleBackground.jsx`: Decorative background.
*   `src/components/Notification.jsx`: UI alerts/toasts.

#### Context
*   `src/context/P2PContext.jsx`: **NEW** - React Context API provider for P2P state management.

## 📉 Code Quality Debt (Technical Debt)
| Issue | Status | AI Instruction / Note |
|:---|:---|:---|
| **Prop Drilling** | `[COMPLETED]` | **DONE 2025-07-23 FINAL:** All prop drilling eliminated. Zero props passed between parent/child components. Only `LoadingSpinner` retains local UI props (size, text) - acceptable as-is. See `.model/PROP_DRILLING.md`. |
| **God Component (`App.jsx`)** | `[INCOMPLETE]` | `App.jsx` is still overloaded with logic. **REFACTOR TASK:** Extract WebRTC/Socket logic into custom hooks (e.g., `useWebRTC`). |
| **Browser Compatibility** | `[INCOMPLETE]` | File System Access API fails in Firefox/Safari. **REFACTOR TASK:** Add Blob-based download fallback. |

## 🐛 Functional & Network Issues
1.  **TURN Server Crash:** Undefined TURN env vars cause WebRTC initialization to fail.
2.  **NAT Traversal:** Connections may fail behind strict firewalls without valid TURN credentials.
3.  **Port Conflicts:** Local development requires manual process killing if ports 3000/5000 are occupied.
4.  **ICE Candidate Null Error (Fixed):** Pending candidates with null sdpMid/sdpMLineIndex caused `RTCIceCandidate` constructor errors. Silently ignored via try/catch - doesn't break functionality but may cause intermittent connection hangs in edge cases.

## 🐛 Bug Fixes Applied (2025-07-23)
1.  **ReceiverSpeed Display:** ReceiverForm.jsx read `speed` (sender speed) instead of `receiverSpeed`. Fixed by destructuring correct variable and updating ProgressBar condition to use `receiverSpeed > 0`.
2.  **ProgressBar Speed Logic:** Added `effectiveSpeed = receiverSpeed > 0 ? receiverSpeed : speed` in ProgressBar.jsx to handle both sender/receiver contexts correctly.
3.  **Notification Duration Error:** Notification.jsx lost `duration` prop after context migration, causing "duration is not defined" error. Fixed by adding default `const duration = 5000;`.
4.  **App.jsx Data Channel Check:** `check()` function threw immediately when data channel was still connecting. Fixed to poll while channel is 'connecting', only throw if truly closed/closing.
5.  **peerRef.current.readyState Bug:** Line 586 accessed `.readyState` without null check on `dataChannel.current`. Added safety check: `dataChannel.current && dataChannel.current.readyState === 'open'`.

## 🚀 Current Progress
*   [x] Basic Signaling (Socket.io)
*   [x] WebRTC Connection Establishment
*   [x] File Chunking & Transfer Logic
*   [x] Refactor State Management (Context API) ✅ COMPLETED 2025-07-23 FINAL - Zero prop drilling remaining
*   [ ] Modularize `App.jsx` logic

---
*Last Updated: 2025-07-23 FINAL - Prop drilling completely eliminated (zero props remaining). Fixed receiverSpeed display bug, ProgressBar effectiveSpeed logic, Notification duration error, App.jsx data channel safety checks. All components now consume state via useP2P() hook.*
