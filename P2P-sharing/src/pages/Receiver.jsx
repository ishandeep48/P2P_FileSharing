
import React , {useEffect,useState,useRef} from 'react';
import NavBar from './NavBar';
import ReceiverForm from './ReceiverForm';
export default function Receiver({connectTO}){
return(
    <div>
        <NavBar />
        <ReceiverForm
        connectTO={connectTO}
        />
    </div>
)
}