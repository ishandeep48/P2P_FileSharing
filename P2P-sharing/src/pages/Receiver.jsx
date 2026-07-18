
import React , {useEffect,useState,useRef} from 'react';
import NavBar from './NavBar';
import ReceiverForm from './ReceiverForm';

export default function Receiver({connectTO,downloadURL,dataChOpen,showApprove,setIsReadyToDownload,transferCompletion,speed,setWantsClose}){
    return(
        <div className="min-h-screen">
            <NavBar />
            <div className="pt-24">
                <ReceiverForm
                connectTO={connectTO}
                downloadURL={downloadURL}
                dataChOpen={dataChOpen}
                showApprove={showApprove}
                setIsReadyToDownload={setIsReadyToDownload}
                transferCompletion={transferCompletion}
                speed={speed}
                setWantsClose={setWantsClose}
                />
            </div>
        </div>
    )
}