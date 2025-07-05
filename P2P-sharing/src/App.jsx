import {BrowserRouter as Router, Route, Routes, Navigate} from 'react-router-dom';
import { io } from 'socket.io-client';
import React,{useEffect,useState,useRef} from 'react';
import Home from './pages/Home';
import Sender from './pages/Sender';
import Receiver from './pages/Receiver';
import './App.css'
import { useCallback } from 'react';
function App() {
  const [connectionId,setConnectionId] = useState('');
  const [isSocket,setIsSocket] = useState(false);
  const socketRef=useRef();
  const peerRef=useRef();
  const dataChannel = useRef();
  const registerSocketHandlers=()=>{
    socketRef.current.on('connection-id', (id) => {
      setConnectionId(id);
      setIsSocket(true);
    });

    socketRef.current.on('wants-to-connect',async (data)=>{
    const {who} = data;
    const to = who;
    console.log(`receiver is ${who}`);
    dataChannel.current = peerRef.current.createDataChannel('file-transfer');
    dataChannel.current.onopen = () => console.log('opened data channel');
    peerRef.current.dataChannel = dataChannel.current;
    const fromOffer = await peerRef.current.createOffer();
    await peerRef.current.setLocalDescription(new RTCSessionDescription(fromOffer));
    socketRef.current.emit('outgoing-call',{to,fromOffer});
    });

    socketRef.current.on('incoming-call',async data => {
      const {from,offer}=data;
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));

      peerRef.current.ondatachannel = event => {
        const receiveChannel = event.channel;
        receiveChannel.onopen = () =>{ console.log('data channel opened on receivers end');};
        receiveChannel.onmessage = event => {
          console.log('received file data ', event.data);
        };
        peerRef.current.dataChannel=receiveChannel;
      }

      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);
      socketRef.current.emit('call-accepted',{answer,to:from});
    });

    socketRef.current.on('incoming-answer',async data=>{
      const {from,offer} = data;
      console.log(` socket id ${from} se answer receive hua`)
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));      
    });
  }
  useEffect(() => {
    
    socketRef.current = io('http://localhost:5000');
    peerRef.current = new RTCPeerConnection();
    registerSocketHandlers();
    return () => {
        if (socketRef.current) socketRef.current.disconnect();
    };

    }, []);

    const generateNewId=useCallback(()=>{
        if(socketRef.current){
          socketRef.current.disconnect();
        }
        socketRef.current = io('http://localhost:5000');
        registerSocketHandlers();
    },[]);

    

    const connectTO = useCallback((remotePeer) =>{
      socketRef.current.emit('connect-to-sender',{to:remotePeer});
    },[]);
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
        connectTO={connectTO}
        />}/>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
export default App;
