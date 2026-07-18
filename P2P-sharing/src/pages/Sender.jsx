import SenderForm from './SenderForm';
import NavBar from './NavBar';

export default function Sender({connectionId,generateNewId,isSocket,uploadFile,dataChOpen,transferCompletion,speed,setWantsClose,socketConnected,socketError}) {
    
    return(
        <div className="min-h-screen">
            <NavBar/>
            <div className="pt-24">
                <SenderForm
                connectionId={connectionId}
                generateNewId={generateNewId}
                isSocket={isSocket}
                uploadFile={uploadFile}
                dataChOpen={dataChOpen}
                transferCompletion={transferCompletion}
                speed={speed}
                setWantsClose={setWantsClose}
                socketConnected={socketConnected}
                socketError={socketError}
                />
            </div>
        </div>
    )
}