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
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent"
            >
                📤 Sender
            </button>
            <button 
                onClick={receiverButton} 
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-medium rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-transparent"
            >
                📥 Receiver
            </button>
        </div>
    )
}