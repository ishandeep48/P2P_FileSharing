import React,{useState,useRef,useEffect} from 'react';
import { data } from 'react-router-dom';

export default function ReceiverForm({connectTO,downloadURL,dataChOpen}){
    const [count,setCount] = useState(0);
    const[conId,setConId]=useState('');
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
    return(
        <div className="flex flex-col items-center justify-center mt-24">
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
        </div>
    )
}