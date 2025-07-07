const express =  require('express');
const {createServer}=require('https');
const app = express();
const {readFileSync}=require('fs');
const {v4:uuidv4} = require('uuid');

const options ={
    key:readFileSync('../P2P-sharing/key.pem'),
    cert:readFileSync('../P2P-sharing/cert.pem')
}
const server = createServer(options,app);
const cors = require('cors');
const {Server} =require('socket.io');


app.use(cors());

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    }
});

// Helper to generate a 6-character ID
function generateShortId() {
    return uuidv4().replace(/-/g, '').substring(0, 6);
}

// Helper to find socket by shortId
function getSocketByShortId(id) {
    return Array.from(io.sockets.sockets.values()).find(s => s.shortId === id);
}

io.on('connection', socket => {
    // Assign a custom 6-character ID
    const shortId = generateShortId();
    socket.shortId = shortId;

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
    });
});

app.get('/',(req,res)=>{
    res.send("This is a test");
})
server.listen(5000,'0.0.0.0',()=>{
    console.log("The backend server is running at port 5000");
})