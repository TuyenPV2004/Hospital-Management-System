import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout'; // Import Layout vừa tạo

// ... giữ nguyên các import Pages ...
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
import Profile from './pages/Profile';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import AppointmentManager from './pages/AppointmentManager'


function App() {
  return (
    <Router>
      <Routes>
        {/* ===== PUBLIC ROUTES (Không có Navbar) ===== */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* ===== PROTECTED ROUTES (Có Navbar) ===== */}
        {/* Chúng ta bọc MainLayout quanh Component bên trong ProtectedRoute */}
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute 
              allowedRoles={["ADMIN", "DOCTOR", "NURSE", "PATIENT", "TECHNICIAN"]} 
              Component={() => <MainLayout><Dashboard /></MainLayout>} 
            />
          } 
        />
        
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute 
              allowedRoles={["ADMIN", "DOCTOR", "NURSE", "PATIENT", "TECHNICIAN"]} 
              Component={() => <MainLayout><Profile /></MainLayout>} 
            />
          } 
        />
        
        <Route 
          path="/booking" 
          element={
            <ProtectedRoute 
              allowedRoles={["ADMIN", "DOCTOR", "NURSE", "PATIENT"]} 
              Component={() => <MainLayout><Booking /></MainLayout>} 
            />
          } 
        />

        <Route 
          path="/appointments" 
          element={
            <ProtectedRoute 
              allowedRoles={["ADMIN", "DOCTOR", "NURSE"]} 
              Component={() => <MainLayout><AppointmentManager /></MainLayout>} 
            />
          } 
        />

        {/* ... Lặp lại cách bọc MainLayout cho các route còn lại ... */}
        
        <Route 
          path="/reception" 
          element={
            <ProtectedRoute 
              allowedRoles={["ADMIN", "NURSE"]} 
              Component={() => <MainLayout><Reception /></MainLayout>} 
            />
          } 
        />
        
        <Route 
          path="/doctor" 
          element={
            <ProtectedRoute 
              allowedRoles={["ADMIN", "DOCTOR"]} 
              Component={() => <MainLayout><DoctorRoom /></MainLayout>} 
            />
          } 
        />
        
        <Route 
          path="/pharmacy" 
          element={
            <ProtectedRoute 
              allowedRoles={["ADMIN", "NURSE"]} 
              Component={() => <MainLayout><Pharmacy /></MainLayout>} 
            />
          } 
        />

        <Route 
          path="/payment" 
          element={
            <ProtectedRoute 
              allowedRoles={["ADMIN"]} 
              Component={() => <MainLayout><Payment /></MainLayout>} 
            />
          } 
        />
        
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute 
              allowedRoles={["ADMIN"]} 
              Component={() => <MainLayout><AdminReport /></MainLayout>} 
            />
          } 
        />
        
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute 
              allowedRoles={["ADMIN"]} 
              Component={() => <MainLayout><AdminUsers /></MainLayout>} 
            />
          } 
        />

        <Route 
          path="/inventory/import" 
          element={
            <ProtectedRoute 
              allowedRoles={["ADMIN"]} 
              Component={() => <MainLayout><InventoryImport /></MainLayout>} 
            />
          } 
        />

        <Route 
          path="/inventory/alerts" 
          element={
            <ProtectedRoute 
              allowedRoles={["ADMIN"]} 
              Component={() => <MainLayout><InventoryAlerts /></MainLayout>} 
            />
          } 
        />

        <Route 
          path="/inpatient" 
          element={
            <ProtectedRoute 
              allowedRoles={["ADMIN", "NURSE"]} 
              Component={() => <MainLayout><InpatientMap /></MainLayout>} 
            />
          } 
        />
        <Route 
          path="/patients" 
          element={
            <ProtectedRoute 
              allowedRoles={["ADMIN", "DOCTOR", "NURSE", "TECHNICIAN"]} 
              Component={() => <MainLayout><Patients /></MainLayout>} 
            />
          } 
        />
        
        <Route 
          path="/patients/:id" 
          element={
            <ProtectedRoute 
              allowedRoles={["ADMIN", "DOCTOR", "NURSE", "TECHNICIAN"]} 
              Component={() => <MainLayout><PatientDetail /></MainLayout>} 
            />
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;