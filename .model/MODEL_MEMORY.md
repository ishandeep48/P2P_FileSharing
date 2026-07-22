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
*   `src/App.jsx`: **The "God Component"**. Manages routing, WebRTC logic, Socket connections, and global state.
*   `src/main.jsx`: React entry point.

#### Pages (Routing Targets)
*   `src/pages/Home.jsx`: Landing page with navigation links.
*   `src/pages/Sender.jsx`: Wrapper for the Sender flow; passes props to `SenderForm`.
*   `src/pages/SenderForm.jsx`: The actual UI and logic for selecting files and initiating transfers.
*   `src/pages/Receiver.jsx`: Wrapper for the Receiver flow; passes props to `ReceiverForm`.
*   `src/pages/ReceiverForm.jsx`: The actual UI and logic for connecting to a sender and receiving files.

#### Components (Reusable UI)
*   `src/components/ConnectionCard.jsx`: Displays connection ID and QR code.
*   `src/components/FileUpload.jsx`: File picker component.
*   `src/components/ProgressBar.jsx`: Visual progress indicator for transfers.
*   `src/components/ParticleBackground.jsx`: Decorative background.
*   `src/components/Notification.jsx`: UI alerts/toasts.

## 📉 Code Quality Debt (Technical Debt)
| Issue | Status | AI Instruction / Note |
* Created `.model/PROP_DRILLING.md` containing detailed prop drilling analysis.
* Created `.model/PROP_DRILLING.md` containing detailed prop drilling analysis.
| :--- | :--- | :--- |
| **Prop Drilling** | `[INCOMPLETE]` | **CRITICAL:** Passing massive props through `Sender.jsx` and `Receiver.jsx`. **REFACTOR TASK:** Implement React Context API (`P2PContext`). |
| **God Component (`App.jsx`)** | `[INCOMPLETE]` | `App.jsx` is overloaded with logic. **REFACTOR TASK:** Extract WebRTC/Socket logic into custom hooks (e.g., `useWebRTC`). |
| **Browser Compatibility** | `[INCOMPLETE]` | File System Access API fails in Firefox/Safari. **REFACTOR TASK:** Add Blob-based download fallback. |

## 🐛 Functional & Network Issues
1.  **TURN Server Crash:** Undefined TURN env vars cause WebRTC initialization to fail.
2.  **NAT Traversal:** Connections may fail behind strict firewalls without valid TURN credentials.
3.  **Port Conflicts:** Local development requires manual process killing if ports 3000/5000 are occupied.

## 🚀 Current Progress
*   [x] Basic Signaling (Socket.io)
*   [x] WebRTC Connection Establishment
*   [x] File Chunking & Transfer Logic
*   [ ] Refactor State Management (Context API)
*   [ ] Modularize `App.jsx` logic

* Created `.model/PROP_DRILLING.md` containing detailed prop drilling analysis.
* Created `.model/PROP_DRILLING.md` containing detailed prop drilling analysis.
---
*Last Updated: 2024-05-23*
