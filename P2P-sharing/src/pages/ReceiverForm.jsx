import React,{useState,useRef,useEffect} from 'react';

export default function ReceiverForm({connectTO}){
    const[conId,setConId]=useState('');
    const updateConId = (evt) =>{
        setConId(evt.target.value)
    }
    const connectToSender = () => {
        connectTO(conId)
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
        </div>
    )
}