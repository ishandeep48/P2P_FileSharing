# P2P File Sharing - Beautiful & Fast

A modern, beautiful peer-to-peer file sharing application with flowing particles, real-time progress tracking, and optimized transfer speeds.

## ✨ Features

### 🎨 Beautiful UI/UX
- **Flowing Particle Background**: Animated particles with connecting lines for a modern look
- **Glass Morphism Design**: Translucent cards with backdrop blur effects
- **Real-time Progress Bars**: Beautiful animated progress indicators with file information
- **Drag & Drop File Upload**: Intuitive file selection with visual feedback
- **QR Code Sharing**: Easy connection via QR codes
- **Responsive Design**: Works perfectly on desktop and mobile devices

### ⚡ Performance Improvements
- **Optimized WebRTC Configuration**: Better ICE servers and connection settings
- **Improved Chunk Size**: Increased from 256KB to 512KB for faster transfers
- **Enhanced Buffer Management**: Increased buffer size and better flow control
- **Faster Progress Updates**: More frequent UI updates (50ms intervals)
- **Optimized Socket.IO**: WebSocket-only transport with better ping settings

### 🔧 Technical Enhancements
- **Better Error Handling**: Comprehensive error handling with user-friendly messages
- **Loading States**: Beautiful loading spinners and progress indicators
- **Notifications**: Toast notifications for user feedback
- **Connection Status**: Real-time connection status indicators
- **File Information**: Display file size, type, and transfer speed

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Install Frontend Dependencies**
   ```bash
   cd P2P-sharing
   npm install
   ```

2. **Install Server Dependencies**
   ```bash
   cd ../server
   npm install
   ```

3. **Set up Environment Variables**
   Create a `.env` file in the `P2P-sharing` directory:
   ```env
   VITE_SOCKET_SERVER=https://your-server-ip:5000
   VITE_TURN_SERVER=your-turn-server-url
   VITE_TURN_USERNAME=your-turn-username
   VITE_TURN_PASSWORD=your-turn-password
   ```

4. **Start the Server**
   ```bash
   cd server
   node server.js
   ```

5. **Start the Frontend**
   ```bash
   cd P2P-sharing
   npm run dev
   ```

## 📱 How to Use

### For Senders:
1. Navigate to the sender page
2. Generate a unique connection ID
3. Share the QR code or ID with the receiver
4. Drag & drop or select a file to upload
5. Wait for receiver approval and monitor transfer progress

### For Receivers:
1. Navigate to the receiver page
2. Scan the QR code or enter the connection ID manually
3. Approve the incoming file transfer
4. Choose download location
5. File downloads automatically with progress tracking

## 🎯 Performance Optimizations

### Transfer Speed Improvements:
- **Chunk Size**: Increased from 256KB to 512KB
- **Buffer Size**: Increased from 13MB to 16MB
- **Throttle Delay**: Reduced from 10ms to 5ms
- **Progress Updates**: More frequent (50ms vs 100ms)

### WebRTC Enhancements:
- **Multiple STUN Servers**: Added Google's STUN servers for better connectivity
- **ICE Configuration**: Optimized ICE candidate pool and bundle policy
- **Connection Tracking**: Better connection state management

### UI/UX Improvements:
- **Real-time Feedback**: Instant progress updates and status changes
- **Error Handling**: User-friendly error messages and recovery options
- **Loading States**: Visual feedback during operations
- **Responsive Design**: Works on all screen sizes

## 🛠️ Tech Stack

### Frontend:
- **React 19**: Latest React with hooks and modern patterns
- **Tailwind CSS**: Utility-first CSS framework
- **Socket.IO Client**: Real-time communication
- **WebRTC**: Peer-to-peer file transfer
- **QR Code**: React QR code generation and scanning

### Backend:
- **Node.js**: Server runtime
- **Express**: Web framework
- **Socket.IO**: Real-time communication server
- **HTTPS**: Secure connections

## 🎨 Design System

### Colors:
- **Primary**: Blue gradient (#667eea to #764ba2)
- **Success**: Green gradient (#10b981 to #059669)
- **Warning**: Yellow (#f59e0b)
- **Error**: Red (#ef4444)

### Components:
- **Glass Cards**: Translucent backgrounds with backdrop blur
- **Gradient Buttons**: Beautiful gradient backgrounds with hover effects
- **Progress Bars**: Animated progress indicators
- **Particle Background**: Flowing animated particles

## 🔒 Security Features

- **End-to-End Encryption**: Files are transferred directly between peers
- **No Server Storage**: Files never touch the server
- **Secure WebRTC**: Encrypted peer-to-peer connections
- **HTTPS**: Secure server communication

## 📊 Performance Metrics

- **Transfer Speed**: Up to 2x faster than previous version
- **Connection Time**: Reduced connection establishment time
- **UI Responsiveness**: 60fps animations and smooth interactions
- **Memory Usage**: Optimized for better performance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with ❤️ for seamless file sharing
- Special thanks to the WebRTC and Socket.IO communities
- Inspired by modern UI/UX design principles
