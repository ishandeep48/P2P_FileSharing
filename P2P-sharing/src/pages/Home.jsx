import {io} from 'socket.io-client';
import React,{useEffect,useRef,useState} from 'react';
import NavBar from './NavBar';

const socket = io('http://localhost:5000');

function Home(){
    
    return(
        <div>
            <NavBar/>
            <h1>P2P File Sharing</h1>
            <h3>This is a Server Aided Peer to Peer File Sharing Website. The Transfer Rate of the files 
                depends on your network connection not on the Server . The Server can be bad but your transfer 
                rate will still be amazing if you have good connection. I made this as a fun side kinda project just 
                to share files with my friends in my college hostel .......................      ( also i dont know what else to make ) 
                I WANT INTERNSHIP 😭😭😭😭</h3>
            
        </div>
    );
}

export default Home;