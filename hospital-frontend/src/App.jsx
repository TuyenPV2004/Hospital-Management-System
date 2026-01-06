// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Reception from './pages/Reception'; // <--- Import thêm
import DoctorRoom from './pages/DoctorRoom';
import Payment from './pages/Payment'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reception" element={<Reception />} /> 
        <Route path="/doctor" element={<DoctorRoom />} />
        <Route path="/payment" element={<Payment />} /> 
      </Routes>
    </Router>
  );
}

export default App;