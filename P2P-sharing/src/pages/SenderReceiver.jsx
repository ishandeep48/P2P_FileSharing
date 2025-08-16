import { useNavigate } from "react-router-dom";

export default function SenderReceiver(){
    const navigate = useNavigate();
    
    const senderButton = () => {
        navigate('/sender');
    }
    
    const receiverButton = () => {
        navigate('/receiver');
    }

    return(
        <div className="flex items-center space-x-3">
            <button 
                onClick={senderButton} 
                className="bg-gradient-to-r from-red-400 to-red-700 hover:from-red-500 hover:to-red-800 !text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-transparent"
            >
                 Sender
            </button>
            <button 
                onClick={receiverButton} 
                className="bg-gradient-to-r from-yellow-400 to-yellow-700 hover:from-yellow-500 hover:to-orange-700 visited:text-white !text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-transparent"
            >
                 Receiver
            </button>
        </div>
    )
}