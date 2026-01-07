// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Reception from './pages/Reception';
import DoctorRoom from './pages/DoctorRoom';
import Pharmacy from './pages/Pharmacy';
import Payment from './pages/Payment';
import AdminReport from './pages/AdminReport';
import Booking from './pages/Booking';
import AdminUsers from './pages/AdminUsers';

// --- 1. IMPORT CÁC TRANG MỚI ---
import InventoryImport from './pages/InventoryImport';
import InventoryAlerts from './pages/InventoryAlerts';
import InpatientMap from './pages/InpatientMap';
// ------------------------------

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reception" element={<Reception />} />
        <Route path="/doctor" element={<DoctorRoom />} />
        <Route path="/pharmacy" element={<Pharmacy />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/admin" element={<AdminReport />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/booking" element={<Booking />} />

        {/* --- 2. THÊM CÁC ROUTE MỚI VÀO ĐÂY --- */}
        <Route path="/inventory/import" element={<InventoryImport />} />
        <Route path="/inventory/alerts" element={<InventoryAlerts />} />
        <Route path="/inpatient" element={<InpatientMap />} />
        {/* ------------------------------------- */}
        
      </Routes>
    </Router>
  );
}

export default App;