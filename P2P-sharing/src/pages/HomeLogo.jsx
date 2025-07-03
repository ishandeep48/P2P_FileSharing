import Logo from '../assets/Logo.png';
import { useNavigate } from 'react-router-dom';
export default function HomeLogo(){
    const navigate=useNavigate();
    return(
        <img src={Logo} alt="P2P Sharing Logo" className="ml-0 mr-auto w-15 h-15 inline-block hover:cursor-pointer" onClick={()=>{navigate('/')}} />
    )
}