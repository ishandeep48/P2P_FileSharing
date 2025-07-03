import {io} from 'socket.io-client';
import React,{useEffect,useRef,useState} from 'react';
import NavBar from './NavBar';

const socket = io('http://localhost:5000');

function Home(){
    
    return(
        <div>
            <NavBar/>
            <h1>This is a Home page</h1>
            
        </div>
    );
}

export default Home;