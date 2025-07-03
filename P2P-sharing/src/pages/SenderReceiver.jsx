import { useNavigate } from "react-router-dom";
import './SenderReceiver.css';
export default function SenderReceiver(){
    const navigate = useNavigate();
    const senderButton=()=>{
        navigate('/sender');
    }
    const receiverButton=()=>{
        navigate('/receiver');
    }


    return(
        <div className="inline-block">
                <button onClick={senderButton} className="m-1 buttonColor">Sender</button>
                <button onClick={receiverButton} className="m-1 buttonColor">Receiver</button>
        </div>
    )
}