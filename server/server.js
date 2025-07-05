const express =  require('express');
const {createServer}=require('http');
const app = express();
const server = createServer(app);
const path = require('path');
const cors = require('cors');
const {Server} =require('socket.io');

app.use(cors());

const io=new Server(server,{
    cors:{
        origin:'*'
    }
});

io.on('connection', socket=>{
    console.log(`connected to client socket ${socket.id}`);
    socket.emit('connection-id',socket.id);  
    
    // --------------------------------------------------------------
    socket.on('connect-to-sender',data=>{
        const{to} = data;
        socket.to(to).emit('wants-to-connect',{who:socket.id});
    })
    socket.on('outgoing-call',data=>{
        const {fromOffer,to}=data;
        console.log(`Generated Offer from ${socket.id} to ${to} and offer is ${fromOffer}`)
        socket.to(to).emit('incoming-call',{from:socket.id,offer:fromOffer});
    })

    socket.on('call-accepted',data=>{
        const {answer,to} = data;
        console.log(`call has been accepted by ${socket.id} with answer ${answer} and sent to ${to}`);
        socket.to(to).emit('incoming-answer',{from:socket.id,offer:answer});
    });

    socket.on('disconnect',()=>{
        console.log(`disconnected from id ${socket.id}`);
    });

});

app.get('/',(req,res)=>{
    res.send("This is a test");
})
server.listen(5000,()=>{
    console.log("The backend server is running at port 5000");
})