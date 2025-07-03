

export default function SenderForm({connectionId,generateNewId,isSocket}){
   return(
    <>
    {isSocket && <h1>Your Connection ID: {connectionId}</h1>}
    <button className="mt-2" onClick={generateNewId}>Click here to generate new connection ID</button>
    </>
   )
}