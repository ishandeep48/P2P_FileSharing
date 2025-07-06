import {BrowserRouter as Router, Route, Routes, Navigate} from 'react-router-dom';
import { io } from 'socket.io-client';
import React,{useEffect,useState,useRef} from 'react';
import Home from './pages/Home';
import Sender from './pages/Sender';
import Receiver from './pages/Receiver';
import './App.css'
import { useCallback } from 'react';
// import { generateNewId } from './helper/utils';
function App() {
  const socketServerIP = 'http://192.168.29.134:5000'
  const [connectionId,setConnectionId] = useState('');
  const [isSocket,setIsSocket] = useState(false);
  const [downloadURL,setDownloadURL] = useState(null);
  const [signalState,setSignalState] = useState(false);
  const [dataChOpen,setDataChOpen] = useState(false);
  const isMetaDataReceivedRef = useRef(false);
  const socketRef=useRef();
  const peerRef=useRef();
  const dataChannel = useRef();
  const receivedData = useRef([]);
  const remoteSocketID=useRef(null);
  const pendingCandidates=useRef([]);
  const fileNameRef = useRef('received_file');
  const fileTypeRef = useRef('text/plain');
  
  const dataChannelEvents = () =>{
    dataChannel.current.onopen = () => console.log('opened data channel');
    peerRef.current.onicecandidate = event => {
      if (event.candidate) {
        if (remoteSocketID.current && signalState) {
            socketRef.current.emit('ice-candidate', {
              to: remoteSocketID.current,
              candidate: event.candidate
            });
        } else {
          pendingCandidates.current.push(event.candidate);
        }
      }
    };
  }
  // let downloadURL;
  const registerSocketHandlers=()=>{
    // dataChannel.current = peerRef.current.createDataChannel('file-transfer');
    
    peerRef.current.ondatachannel = event => {
      dataChannel.current = event.channel;
      receivedData.current = [];
      dataChannel.current.onopen = () =>{
        setDataChOpen(true);
        console.log('data channel opened for transfer');
        console.log(dataChannel.current.readyState)
      };
      dataChannel.current.onmessage = event => {
       
        if(!isMetaDataReceivedRef.current){
          if(typeof event.data == 'string'){
            try{
              const metadata = JSON.parse(event.data);
              fileNameRef.current = metadata.fileName || 'received_file';
              fileTypeRef.current = metadata.fileType || 'text/plain';
              isMetaDataReceivedRef.current=true;
              console.log('metadata aaya');
            }catch(e){
              console.error(e);
            }
          }
        }else if(event.data){
          console.log('actual data aaya hua ')
          receivedData.current.push(event.data);
        }else{
          console.warn('idk wtf has been received. ')
        }
      };
      dataChannel.current.onclose = () => {
        // console.log(receivedData.current);
        console.log(`Total chunks received: ${receivedData.current.length}`);
        let totalBytes = receivedData.current.reduce((sum, chunk) => sum + chunk.byteLength, 0);
        console.log(`Total received bytes: ${totalBytes}`);
        const receivedBlob = new Blob(receivedData.current,{type:fileTypeRef.current});
        console.log(`Blob size: ${receivedBlob.size}`);
        const url = URL.createObjectURL(receivedBlob);
        setDownloadURL({url,fileName:fileNameRef.current});
        console.log('file received and ready to download');
      };

    };
    socketRef.current.on('connection-id', (id) => {
      setConnectionId(id);
      // setIsSocket(true);
    });

    socketRef.current.on('wants-to-connect',async (data)=>{
    const {who} = data;
    remoteSocketID.current = who;
    console.log(`receiver is ${who}`);
    dataChannel.current = peerRef.current.createDataChannel('file-transfer');
    dataChannelEvents();
    peerRef.current.onicecandidate = event =>{
      if(event.candidate){
        socketRef.current.emit('ice-candidate',{candidate:event.candidate,to:who});
      }
    }
    const fromOffer = await peerRef.current.createOffer();
    await peerRef.current.setLocalDescription(fromOffer);
    socketRef.current.emit('outgoing-call',{to:who,fromOffer});
    });

    socketRef.current.on('incoming-call',async data => {
      const {from,offer}=data;
      remoteSocketID.current=from;
      await peerRef.current.setRemoteDescription(offer);
      // Add pending ICE candidates after remote description is set
      // TODO
      pendingCandidates.current.forEach(async candidate => {
        try {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding pending candidate (receiver):', err);
        }
      });

      
        
      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);
      setSignalState(true);
      socketRef.current.emit('call-accepted',{answer,to:from});
    });

    socketRef.current.on('incoming-answer',async data=>{
      const {from,offer} = data;
      console.log(` socket id ${from} se answer receive hua`)
      await peerRef.current.setRemoteDescription(offer);   
      setSignalState(true);
      // Add pending ICE candidates after remote description is set
      //TODO
      pendingCandidates.current.forEach(async candidate => {
        try {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding pending candidate (sender):', err);
        }
      });
      // pendingCandidates.current = [];
    });

    socketRef.current.on('ice-candidate',async(data)=>{
      console.log(`received ice candidate from server and the candidate is ${data.candidate}`);
      const{candidate}=data;
      if (!peerRef.current.remoteDescription) {
        // Queue candidate if remote description not set yet
        pendingCandidates.current.push(candidate);
        return;
      }
      try{
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }catch(err){
        console.error('error addind candidate  ', err);
      }
    });
  };

  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }
    ]
  };
  useEffect(() => {
    
    socketRef.current = io(socketServerIP, {
      transports: ['websocket'],
      upgrade: false
    });
    peerRef.current = new RTCPeerConnection(rtcConfig);
   
    registerSocketHandlers();
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (peerRef.current) peerRef.current.close();
    };
  }, []);

    const connectTO = useCallback((remotePeer) =>{
      socketRef.current.emit('connect-to-sender',{to:remotePeer});
    },[]);

    const uploadFile =useCallback(async(file)=>{
      console.log('test 2');
      if(!dataChannel.current){
        console.error("Data Channel has not been initialised!!");
        return;
      }
      console.log('test 3');
      console.log(dataChannel.current.readyState);
      if(dataChannel.current.readyState=='open'){
        const metadata = JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        });
        dataChannel.current.send(metadata);
        console.log('sent metadata');
        setTimeout(() => {
          console.log('hehe wait')
        }, 500);
        const fileBuffer = await file.arrayBuffer();
        const chunkSize = 3*1024*1024;
        const maxBufferAmount = 15*1024*1024;
        let offset = 0;
        while(offset<fileBuffer.byteLength){
          const chunk=fileBuffer.slice(offset,offset+chunkSize);
          console.log(`sending chunk with offset ${offset} `);
          while(dataChannel.current.bufferedAmount>maxBufferAmount){
            await new Promise((resolve)=>setTimeout(resolve,15));
          }
          dataChannel.current.send(chunk);
          offset+=chunkSize;
        }
        console.log('file sent succesfully');
        setTimeout(()=>{
          console.log('closing data channel')
          dataChannel.current?.close();
        },1000);
      }else{
        console.log('data channel is closed atp (before sharing anything) ');
      }
    },[]);

    const generateNewId =useCallback(()=>{
      if(socketRef.current){
        socketRef.current.disconnect();
        if(dataChannel.current){
          dataChannel.current.close();
        }
        if(peerRef.current){
          peerRef.current.close();
        }
        peerRef.current=null;
        dataChannel.current=null;
      }
      peerRef.current = new RTCPeerConnection(rtcConfig);
      // dataChannel.current = peerRef.current.createDataChannel('file-transfer');
      socketRef.current = io(socketServerIP);
      setIsSocket(true);
      registerSocketHandlers();
      // dataChannelEvents();
    },[]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sender" element={<Sender
        connectionId={connectionId}
        generateNewId={generateNewId}
        isSocket={isSocket}
        uploadFile={uploadFile}
        dataChOpen={dataChOpen}
        />}/>
        <Route path="/receiver" element={<Receiver
        connectTO={connectTO}
        downloadURL={downloadURL}
        dataChOpen={dataChOpen}
        />}/>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
export default App;
