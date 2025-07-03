
import React , {useEffect,useState,useRef} from 'react';
import NavBar from './NavBar';
import ReceiverForm from './ReceiverForm';
export default function Receiver({joinRoom}){
return(
    <div>
        <NavBar />
        <ReceiverForm
        joinRoom={joinRoom}
        />
    </div>
)
}