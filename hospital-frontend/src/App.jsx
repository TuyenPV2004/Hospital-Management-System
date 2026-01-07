// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
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
import InventoryImport from './pages/InventoryImport';
import InventoryAlerts from './pages/InventoryAlerts';
import InpatientMap from './pages/InpatientMap';

function App() {
  return (
    <Router>
      <Routes>
        {/* ===== PUBLIC ROUTES (Không cần token) ===== */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* ===== PROTECTED ROUTES (Cần kiểm tra quyền) ===== */}
        {/* Dashboard - Tất cả người dùng đã đăng nhập */}
        <Route 
          path="/dashboard" 
          element={<ProtectedRoute allowedRoles={["ADMIN", "DOCTOR", "NURSE", "PATIENT", "TECHNICIAN"]} Component={Dashboard} />} 
        />
        
        {/* Booking - Tất cả người dùng đã đăng nhập */}
        <Route 
          path="/booking" 
          element={<ProtectedRoute allowedRoles={["ADMIN", "DOCTOR", "NURSE", "PATIENT"]} Component={Booking} />} 
        />
        
        {/* Reception - CHỈ NURSE & ADMIN */}
        <Route 
          path="/reception" 
          element={<ProtectedRoute allowedRoles={["ADMIN", "NURSE"]} Component={Reception} />} 
        />
        
        {/* Doctor Room - CHỈ DOCTOR & ADMIN */}
        <Route 
          path="/doctor" 
          element={<ProtectedRoute allowedRoles={["ADMIN", "DOCTOR"]} Component={DoctorRoom} />} 
        />
        
        {/* Pharmacy - CHỈ ADMIN & NURSE */}
        <Route 
          path="/pharmacy" 
          element={<ProtectedRoute allowedRoles={["ADMIN", "NURSE"]} Component={Pharmacy} />} 
        />
        
        {/* Payment - CHỈ ADMIN */}
        <Route 
          path="/payment" 
          element={<ProtectedRoute allowedRoles={["ADMIN"]} Component={Payment} />} 
        />
        
        {/* Admin Reports - CHỈ ADMIN */}
        <Route 
          path="/admin" 
          element={<ProtectedRoute allowedRoles={["ADMIN"]} Component={AdminReport} />} 
        />
        
        {/* Admin Users - CHỈ ADMIN */}
        <Route 
          path="/admin/users" 
          element={<ProtectedRoute allowedRoles={["ADMIN"]} Component={AdminUsers} />} 
        />
        
        {/* Inventory Import - CHỈ ADMIN */}
        <Route 
          path="/inventory/import" 
          element={<ProtectedRoute allowedRoles={["ADMIN"]} Component={InventoryImport} />} 
        />
        
        {/* Inventory Alerts - CHỈ ADMIN */}
        <Route 
          path="/inventory/alerts" 
          element={<ProtectedRoute allowedRoles={["ADMIN"]} Component={InventoryAlerts} />} 
        />
        
        {/* Inpatient Map - CHỈ ADMIN & NURSE */}
        <Route 
          path="/inpatient" 
          element={<ProtectedRoute allowedRoles={["ADMIN", "NURSE"]} Component={InpatientMap} />} 
        />
      </Routes>
    </Router>
  );
}

export default App;