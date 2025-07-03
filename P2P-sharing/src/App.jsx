import {BrowserRouter as Router, Route, Routes, Navigate} from 'react-router-dom';
import { io } from 'socket.io-client';
import React,{useEffect,useState,useRef} from 'react';
import Home from './pages/Home';
import Sender from './pages/Sender';
import Receiver from './pages/Receiver';
import './App.css'
function App() {
  const [connectionId,setConnectionId] = useState('');
  const [isSocket,setIsSocket] = useState(false);
    const socketRef=useRef();
    
    useEffect(() => {
      socketRef.current = io('http://localhost:5000');
      socketRef.current.on('connection-id', (id) => {
         setConnectionId(id);
      });
      
      return () => {
        if (socketRef.current) socketRef.current.disconnect();
      };
    }, []);


    const joinRoom =(roomID)=>{
    if(socketRef.current.connected){
      socketRef.current.emit('join-room',{roomID});
    }else{
      socketRef.current.once('connect', () => {
        socketRef.current.emit('join-room', { roomID });
      });
    }
    
    };
    const generateNewId=()=>{
        if(socketRef.current){
           
            socketRef.current.disconnect();
        }
        socketRef.current = io('http://localhost:5000');
        socketRef.current.on('connection-id',(id)=>{
            setConnectionId(id);
        })
        setIsSocket(true);
    }
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sender" element={<Sender
        connectionId={connectionId}
        generateNewId={generateNewId}
        isSocket={isSocket}
        />}/>
        <Route path="/receiver" element={<Receiver
        joinRoom={joinRoom}
        />}/>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
export default App;
