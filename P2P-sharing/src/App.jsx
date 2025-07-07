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
  const socketServerIP = 'wss://192.168.29.60:5000'
  const [connectionId,setConnectionId] = useState('');
  const [isSocket,setIsSocket] = useState(false);
  const [downloadURL,setDownloadURL] = useState(null);
  const [signalState,setSignalState] = useState(false);
  const [dataChOpen,setDataChOpen] = useState(false);
  const [ isReadyToDownload,setIsReadyToDownload] = useState(false);
  const [showApprove,setShowApprove]=useState(false);
  const [transferCompletion,setTransferCompletion]=useState(0);
  const [speed,setSpeed] = useState(0);
  const startTimeRef = useRef(null);
  const isMetaDataReceivedRef = useRef(false);
  const socketRef=useRef();
  const peerRef=useRef();
  const dataChannel = useRef();
  const receivedData = useRef([]);
  const remoteSocketID=useRef(null);
  const pendingCandidates=useRef([]);
  const canSendData = useRef(false);
  const fileNameRef = useRef('received_file');
  const fileTypeRef = useRef('text/plain');
  const metadataRef = useRef(null);
  let fileHandle;
  const writableStream=useRef(null);
  const fileSizeRef = useRef(null);
  const byteSentRef = useRef(0);
  const dataChannelEvents = () =>{
    dataChannel.current.onopen = () => {
      console.log('opened data channel');
      setDataChOpen(true);
    }
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
    
    dataChannel.current.onerror = (error) => {
      setDataChOpen(false);
      console.error('DataChannel error:', error);
      
    };

    dataChannel.current.onbufferedamountlow = () => {
      console.log('Buffer available - ready for more data');
    };
  }
  const senderDataChannelEvents = () =>{
    dataChannel.current.bufferedAmountLowThreshold = 64*1024;
    dataChannel.current.onmessage = async event =>{
      if(typeof event.data == 'string' && event.data=='__EOF_ACK__'){
        console.log('EOF ACK Received closing DataChannel');
        dataChannel.current.close();
      }
      else if(typeof event.data == 'string'){
        const parsedData = JSON.parse(event.data);
        const {status} = parsedData;
        console.log(`status is ${status}`);
        console.log(parsedData);
        if(status){
          canSendData.current = true
        } 
      }
    }
  }
  useEffect(()=>{
    if(!isReadyToDownload) return;

    const askForLocation = async () =>{
      console.log('ask for location')
      let ext = fileNameRef.current.split('.').pop();
      fileHandle = await window.showSaveFilePicker({
        suggestedName : fileNameRef.current,
        types: [
          {
            description : ' Received File',
            accept : {[fileTypeRef.current]:['.'+ext]}
          }
        ]
      })
      writableStream.current = await fileHandle.createWritable();
      console.log('gonna send report from receiver to sender');
      const reportMessage = {
                status : true
      }
      const sentData =  JSON.stringify(reportMessage);
      dataChannel.current.send(sentData);
      console.log('sent report to sender ',sentData);
    }
    askForLocation();
  },[isReadyToDownload]);
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
      dataChannel.current.onmessage = async event => {
       
        if(!isMetaDataReceivedRef.current){
          if(typeof event.data == 'string'){
            try{
              metadataRef.current = JSON.parse(event.data);
              fileNameRef.current = metadataRef.current.fileName || 'received_file';
              fileTypeRef.current = metadataRef.current.fileType || 'text/plain';
              fileSizeRef.current = metadataRef.current.fileSize ;
              isMetaDataReceivedRef.current=true;
              console.log('metadata aaya');
              setShowApprove(true);
              
              console.log('receiveing and sacving to ',fileNameRef.current);
            }catch(e){
              console.warn(e);
            }
          }
        }else if(typeof event.data=='string' && event.data=='__EOF__'){
          console.log('EOF Received,closing stream');
          await writableStream.current.close();
          dataChannel.current.send('__EOF_ACK__');
          return;
        }else if(event.data){
          console.log('actual data aaya hua ')
          
          await writableStream.current.write(event.data);
          byteSentRef.current += event.data.size || event.data.byteLength || 0;
          setTransferCompletion(parseFloat((byteSentRef.current/fileSizeRef.current)*100).toFixed(2));
        }else{
          console.warn('idk wtf has been received. ')
        }
      };
      dataChannel.current.onclose = async () => {
        console.log('Data Channel is closed')
      };

    };
    socketRef.current.on('connection-id', (id) => {
      setConnectionId(id);
    });

    socketRef.current.on('wants-to-connect',async (data)=>{
    const {who} = data;
    remoteSocketID.current = who;
    console.log(`receiver is ${who}`);
    dataChannel.current = peerRef.current.createDataChannel('file-transfer',{
      ordered : true
    });
    dataChannelEvents();
    dataChannel.current.bufferedAmountLowThreshold = 128*1024;
    senderDataChannelEvents();
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
      upgrade: false,
      // rejectUnauthorized: false,
      // secure : true
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

    const uploadFile = useCallback(async (file) => {
      console.log('test 2');
      if (!dataChannel.current || dataChannel.current.readyState !== 'open') {
        console.error('Data Channel has not been initialised!!');
        return;
      }
      console.log('test 3');
      console.log(dataChannel.current.readyState);
      const MAX_BUFFERED_AMOUNT = 13*1024*1024;
      const CHUNK_SIZE = 256*1024;
      const THROTTLE_DELAY = 10;
      console.log(`Buffer metadata status: ${dataChannel.current.bufferedAmount} bytes`);
      if (dataChannel.current.readyState == 'open') {
        const metadata = JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        });
        // console.log(metadata);
        fileSizeRef.current = file.size;
        dataChannel.current.send(metadata);
        startTimeRef.current = Date.now();
        console.log('sent metadata');
        await new Promise(res=>{
          const check = () =>{
            if(canSendData.current){ 
              res();
            }else if(dataChannel.current.readyState){
              setTimeout(check,100);
            }
            else{
              throw new Error('Data closed while Waiting');
            }
          };
          check();
        });
        const stream = file.stream();
        const reader = stream.getReader();
        while (true) {
          const { done, value } = await reader.read();
          console.log('up1');
          if (done) {
            // setTransferCompletion(100);
            console.log('sending EOF. the real success');
            dataChannel.current.send('__EOF__');
            // setTransferCompletion(parseFloat(100).toFixed(2));
            
            break;
          }
          for(let i=0;i<value.length;i+=CHUNK_SIZE){
            const chunk = value.slice(i,i+CHUNK_SIZE);
            while(dataChannel.current.readyState==='open' && dataChannel.current.bufferedAmount>MAX_BUFFERED_AMOUNT){
              await new Promise(res=> setTimeout(res,THROTTLE_DELAY));
            }
            if(dataChannel.current.readyState!=='open'){
              throw new Error('Data channel closed during transfer');
            }
            try{
              
              dataChannel.current.send(chunk);
              const now = Date.now();
              const timeToSend = (now-startTimeRef.current)/1000;
              let transferSpeed = (byteSentRef.current * 8)/ timeToSend;
              transferSpeed /=(1024*1024);
              transferSpeed=parseFloat(transferSpeed).toFixed(2);
              setSpeed(transferSpeed);
              byteSentRef.current += chunk.byteLength|| CHUNK_SIZE ;
              setTransferCompletion(parseFloat((byteSentRef.current/fileSizeRef.current)*100).toFixed(2));
              // await new Promise(res=>setTimeout(res,1));
            }catch (e) {
              console.error('error sendinfg ',e );
            }
          }
        }
        console.log('file sent successfully');
      } else {
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
      socketRef.current = io(socketServerIP);
      setIsSocket(true);
      registerSocketHandlers();
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
        transferCompletion={transferCompletion}
        speed={speed}
        />}/>
        <Route path="/receiver" element={<Receiver
        connectTO={connectTO}
        downloadURL={downloadURL}
        dataChOpen={dataChOpen}
        showApprove={showApprove}
        setIsReadyToDownload={setIsReadyToDownload}
        transferCompletion={transferCompletion}
        />}/>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
export default App;
