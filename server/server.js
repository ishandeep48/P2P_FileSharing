const express = require('express');
const { createServer } = require('https');
const app = express();
const { readFileSync } = require('fs');
const { v4: uuidv4 } = require('uuid');

const options = {
    key: readFileSync('../P2P-sharing/key.pem'),
    cert: readFileSync('../P2P-sharing/cert.pem')
};
const server = createServer(options, app);
const cors = require('cors');
const { Server } = require('socket.io');

app.use(cors());

// Optimized Socket.IO configuration for better performance
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
    transports: ['websocket'], // Force WebSocket transport for better performance
    pingTimeout: 60000, // Increased ping timeout
    pingInterval: 25000, // Increased ping interval
    maxHttpBufferSize: 1e8, // 100MB buffer size
    allowEIO3: true, // Allow Engine.IO v3 clients
});

// Helper to generate a 6-character ID
function generateShortId() {
    return uuidv4().replace(/-/g, '').substring(0, 6);
}

// Helper to find socket by shortId with improved performance
function getSocketByShortId(id) {
    return Array.from(io.sockets.sockets.values()).find(s => s.shortId === id);
}

// Connection tracking for better performance
const activeConnections = new Map();

io.on('connection', socket => {
    // Assign a custom 6-character ID
    const shortId = generateShortId();
    socket.shortId = shortId;

    // Track active connections
    activeConnections.set(shortId, socket);

    console.log(`connected to client socket ${socket.shortId}`);
    socket.emit('connection-id', socket.shortId);
    
    // --------------------------------------------------------------
    socket.on('connect-to-sender', data => {
        const { to } = data;
        const targetSocket = getSocketByShortId(to);
        if (targetSocket) {
            targetSocket.emit('wants-to-connect', { who: socket.shortId });
        }
    });
    socket.on('outgoing-call', data => {
        const { fromOffer, to } = data;
        const targetSocket = getSocketByShortId(to);
        if (targetSocket) {
            console.log(`Generated Offer from ${socket.shortId} to ${to} and offer is ${fromOffer}`);
            targetSocket.emit('incoming-call', { from: socket.shortId, offer: fromOffer });
        }
    });

    socket.on('call-accepted', data => {
        const { answer, to } = data;
        const targetSocket = getSocketByShortId(to);
        if (targetSocket) {
            console.log(`call has been accepted by ${socket.shortId} with answer ${answer} and sent to ${to}`);
            targetSocket.emit('incoming-answer', { from: socket.shortId, offer: answer });
        }
    });
    socket.on('ice-candidate', data => {
        const { to, candidate } = data;
        const targetSocket = getSocketByShortId(to);
        if (targetSocket) {
            targetSocket.emit('ice-candidate', { candidate });
        }
    });
    socket.on('disconnect', () => {
        console.log(`disconnected from id ${socket.shortId}`);
        // Clean up active connections
        activeConnections.delete(socket.shortId);
    });
});

app.get('/',(req,res)=>{
    res.send("This is a test");
})
server.listen(5000,'0.0.0.0',()=>{
    console.log("The backend server is running at port 5000");
})