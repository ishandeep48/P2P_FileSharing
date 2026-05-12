import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Home from "./pages/Home";
import Sender from "./pages/Sender";
import Receiver from "./pages/Receiver";
import ParticleBackground from "./components/ParticleBackground";
import { P2PProvider } from "./context/P2PContext";
import "./App.css";

function App() {
  return (
    <Router>
      <P2PProvider>
        <ParticleBackground />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sender" element={<Sender />} />
          <Route path="/receiver" element={<Receiver />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </P2PProvider>
    </Router>
  );
}

export default App;
