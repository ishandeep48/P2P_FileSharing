import SenderForm from './SenderForm';
import NavBar from './NavBar';

export default function Sender() {
    return(
        <div className="min-h-screen">
            <NavBar/>
            <div className="pt-24">
                <SenderForm />
            </div>
        </div>
    )
}