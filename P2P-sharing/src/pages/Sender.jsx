import SenderForm from './SenderForm';
import NavBar from './NavBar';

export default function Sender({connectionId,generateNewId,isSocket}) {
    
    return(

        <div>
            <NavBar/>
            <SenderForm
            connectionId={connectionId}
            generateNewId={generateNewId}
            isSocket={isSocket}
            />
            
        </div>
        
    )
}