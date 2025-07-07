import React,{useState,useRef,useEffect} from 'react';
import { data } from 'react-router-dom';
import {Scanner} from '@yudiel/react-qr-scanner';
// import QRHandler from './QRHandler';

export default function ReceiverForm({connectTO,downloadURL,dataChOpen,showApprove,setIsReadyToDownload,transferCompletion}){
    const [count,setCount] = useState(0);
    const[conId,setConId]=useState('');
    const [sender,setSender]=useState();
    const[wantsQR,setWantsQR]=useState(false);
    
    const handleQRReqButton = () =>{
        setWantsQR(!wantsQR);
    }
    const connectViaQR = (data)=>{
        connectTO(data[0].rawValue);
        setSender(data[0].rawValue);
        console.log('data to via qr is ',data[0].rawValue);
        setWantsQR(false);
    }
    const updateConId = (evt) =>{
        setConId(evt.target.value)
    }
    const connectToSender = () => {
        setCount(count=>{
            return count+1;
        })
        connectTO(conId)
    }
    const downloadFile = () =>{
        if(!downloadURL) return;
        const a = document.createElement('a');
        console.log(downloadURL);
        a.href = downloadURL.url;
        a.download = downloadURL.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    const approveDownload = () =>{
        setIsReadyToDownload(true);
    }
    return(
        <div className="flex flex-col items-center justify-center mt-24">
            <button
            onClick={handleQRReqButton}
            >OPEN QR
            </button>
            <>
            {wantsQR&&(
            <Scanner
            onScan={connectViaQR}
            styles={{width: '30px'}}
            />
            )}
            </>
            {/* <button onClick={requestCamAccess}>
                ACCESS CAMERA
            </button> */}
            {sender &&  <p>The sender is {sender}</p>}
            <input
                type="text"
                value={conId}
                onChange={updateConId}
                className="mb-4 px-6 py-3 w-80 rounded-full border-2 border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg shadow"
                placeholder="Connection ID"
            />
            <button 
            className="w-40 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full text-lg shadow transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={connectToSender}
            >CONNECT</button>
            {showApprove &&(
            <div className='mt-6 '>
            <button
            onClick={approveDownload}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full text-lg shadow transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-400"
            >APPROVE DOWNLOAD
            </button>
            </div>
            )}
            { count>0 && !dataChOpen && <p>The Data Channel is still not connected. Please try to connect again </p>}
            
            {downloadURL?.url &&(
            <div className="mt-6">
                
            <button 
            onClick={downloadFile}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full text-lg shadow transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-400"
            > CLICK HERE TO DOWNLOAD THE RECEIVED FILE
            </button>
            
            </div>
            )}
            <div>
                Received {transferCompletion} %
            </div>
        </div>
    )
}