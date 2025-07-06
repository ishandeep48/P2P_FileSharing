import { useCallback } from 'react';
const uploadFile = async (file)=>{
      console.log('test 2',dataChannel.current);
      if(!dataChannel.current){
        console.error('data channel not initialised');
        return;
      }
      const waitForOpen = () =>{
        
        return new Promise((resolve,reject)=>{
          if(dataChannel.current.readyState =='open'){
            return resolve();
          }
          const interval =setInterval(()=>{
            if(dataChannel.current.readyState=='open'){ 
              clearInterval(interval);
              resolve();
            }else if(dataChannel.current.readyState == 'closed'){
              clearInterval(interval);
              reject(new Error('data channel closed before opening'));
            }
          },100);
        });
      };
      try{
        console.log('test 3');
        
        await waitForOpen();
        console.log(dataChannel.current);
        console.log('test 4.1');
        const fileBuffer = await file.arrayBuffer();
        const chunkSize = 16*1024;
        let offset = 0 ;
        
        console.log(fileBuffer.byteLength);
        while(offset<fileBuffer.byteLength){
          
          const chunk = fileBuffer.slice(offset,offset+chunkSize);
          dataChannel.current.send(chunk);
          offset+=chunkSize;
        }
        console.log('file sent succesfully');
        setTimeout(() => {
          dataChannel.current?.close();
        }, 500);
      }catch(err){
        console.error('failes to send file  ',err.message );
      }
    };

const generateNewId = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      peerRef.current.close();
      peerRef.current = null;
      dataChannel.current = null;
    }
    peerRef.current = new RTCPeerConnection(rtcConfig);
    peerRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        if (remoteSocketID.current) {
          socketRef.current.emit('ice-candidate', {
            to: remoteSocketID.current,
            candidate: event.candidate,
          });
        } else {
          pendingCandidates.current.push(event.candidate);
        }
      }
    };
    socketRef.current = io(socketServerIP);
    registerSocketHandlers();
  };
export {uploadFile,generateNewId};







// dataChannel.current.onclose = () =>{
        //   const receivedBlob =  new Blob(receivedData.current);
        //   const url = URL.createObjectURL(receivedBlob);
        //   setDownloadURL(url);
        //   console.log('file received and ready to download');
        // };