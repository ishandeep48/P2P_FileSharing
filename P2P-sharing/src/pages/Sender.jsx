import SenderForm from './SenderForm';
import NavBar from './NavBar';

export default function Sender({connectionId,generateNewId,isSocket,uploadFile,dataChOpen}) {
    
    return(

        <div>
            <NavBar/>
            <SenderForm
            connectionId={connectionId}
            generateNewId={generateNewId}
            isSocket={isSocket}
            uploadFile={uploadFile}
            dataChOpen={dataChOpen}
            />
            
        </div>
        
    )
}