
import NavBar from './NavBar';
import ReceiverForm from './ReceiverForm';

export default function Receiver() {
    return(
        <div className="min-h-screen">
            <NavBar />
            <div className="pt-24">
                <ReceiverForm />
            </div>
        </div>
    )
}