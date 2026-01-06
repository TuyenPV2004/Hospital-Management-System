// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Reception from './pages/Reception'; 
import DoctorRoom from './pages/DoctorRoom';
import Payment from './pages/Payment'
import Pharmacy from './pages/Pharmacy';
import Register from './pages/Register';
import AdminUsers from './pages/AdminUsers';
import ForgotPassword from './pages/ForgotPassword';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reception" element={<Reception />} /> 
        <Route path="/doctor" element={<DoctorRoom />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/pharmacy" element={<Pharmacy />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
    </Router>
  );
}

export default App;