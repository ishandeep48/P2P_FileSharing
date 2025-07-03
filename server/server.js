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
    
    
    socket.on('join-room',data=>{
        if(socket.rooms>1){
            let count=0;
            for(let room in socket.rooms){
                if(room!==socket.id){
                    socket.leave(room);
                    count++;
                }
            }
            console.log(`lef ta total of ${count} rooms`);
        }
        const {roomID} = data;
        socket.join(roomID);
        console.log(`socket with ID ${socket.id} has joined the room ID ${roomID}`);
    })
    
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