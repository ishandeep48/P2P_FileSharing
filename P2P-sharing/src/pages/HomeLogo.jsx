import Logo from '../assets/Logo.png';
import { useNavigate } from 'react-router-dom';

export default function HomeLogo(){
    const navigate = useNavigate();
    return(
        <div 
            className="flex items-center space-x-3 hover:cursor-pointer group transition-all duration-300 transform hover:scale-105"
            onClick={() => { navigate('/') }}
        >
            <img 
                src={Logo} 
                alt="P2P Sharing Logo" 
                className="w-12 h-12 rounded-lg shadow-lg group-hover:shadow-xl transition-all duration-300" 
            />
            <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                    P2P Share
                </h1>
                <p className="text-xs text-white/60">Secure File Transfer</p>
            </div>
        </div>
    )
}