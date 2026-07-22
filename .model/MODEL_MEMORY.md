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
| **Prop Drilling** | `[COMPLETED]` | **DONE 2025-07-23:** Implemented `P2PContext` to eliminate prop drilling. All state/functions now accessed via `useP2P()` hook. See `.model/PROP_DRILLING.md` for details. |
| **God Component (`App.jsx`)** | `[INCOMPLETE]` | `App.jsx` is still overloaded with logic. **REFACTOR TASK:** Extract WebRTC/Socket logic into custom hooks (e.g., `useWebRTC`). |
| **Browser Compatibility** | `[INCOMPLETE]` | File System Access API fails in Firefox/Safari. **REFACTOR TASK:** Add Blob-based download fallback. |

## 🐛 Functional & Network Issues
1.  **TURN Server Crash:** Undefined TURN env vars cause WebRTC initialization to fail.
2.  **NAT Traversal:** Connections may fail behind strict firewalls without valid TURN credentials.
3.  **Port Conflicts:** Local development requires manual process killing if ports 3000/5000 are occupied.

## 🚀 Current Progress
*   [x] Basic Signaling (Socket.io)
*   [x] WebRTC Connection Establishment
*   [x] File Chunking & Transfer Logic
*   [x] Refactor State Management (Context API) ✅ COMPLETED 2025-07-23
*   [ ] Modularize `App.jsx` logic

---
*Last Updated: 2025-07-23 - Completed prop drilling refactoring with P2PContext. Removed props from Sender/Receiver page wrappers, updated all form components to use context hook.*
