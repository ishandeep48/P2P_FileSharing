import SenderForm from './SenderForm';
import NavBar from './NavBar';

export default function Sender({connectionId,generateNewId,isSocket,uploadFile,dataChOpen,transferCompletion,speed}) {
    
    return(

        <div>
            <NavBar/>
            <SenderForm
            connectionId={connectionId}
            generateNewId={generateNewId}
            isSocket={isSocket}
            uploadFile={uploadFile}
            dataChOpen={dataChOpen}
            transferCompletion={transferCompletion}
            speed={speed}
            />
            
        </div>
        
    )
}