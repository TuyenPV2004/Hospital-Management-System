// src/components/Navbar.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
// 1. Import các icon từ Lucide (phiên bản Feather cho React)
import { 
  LayoutDashboard, 
  Calendar, 
  ClipboardList, 
  UserRound, 
  Stethoscope, 
  Pill, 
  Map, 
  Bed, 
  CreditCard, 
  Users, 
  BarChart3, 
  Package,
  LogOut,
  User,
  Menu,
  X,
  PlusSquare
} from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState({ username: '', role: '' });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ username: payload.sub, role: payload.role });
      } catch (e) {
        console.error("Token không hợp lệ");
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    navigate('/');
  };

  // 2. Cập nhật danh sách Menu với Component Icon
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} />, roles: ['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT', 'TECHNICIAN'] },
    { name: 'Đặt lịch', path: '/booking', icon: <Calendar size={20} />, roles: ['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT'] },
    { name: 'Quản lý lịch', path: '/appointments', icon: <ClipboardList size={20} />, roles: ['ADMIN', 'DOCTOR', 'NURSE'] },
    { name: 'Hồ sơ bệnh án', path: '/patients', icon: <UserRound size={20} />, roles: ['ADMIN', 'DOCTOR', 'NURSE', 'TECHNICIAN'] },
    { name: 'Tiếp đón', path: '/reception', icon: <PlusSquare size={20} />, roles: ['ADMIN', 'NURSE'] },
    { name: 'Phòng khám', path: '/doctor', icon: <Stethoscope size={20} />, roles: ['ADMIN', 'DOCTOR'] },
    { name: 'Kho thuốc', path: '/pharmacy', icon: <Pill size={20} />, roles: ['ADMIN', 'NURSE'] },
    { name: 'Sơ đồ giường', path: '/inpatient', icon: <Map size={20} />, roles: ['ADMIN', 'NURSE'] },
    { name: 'Quản lý nội trú', path: '/inpatients', icon: <Bed size={20} />, roles: ['ADMIN', 'DOCTOR', 'NURSE'] },
    { name: 'Quan lý tài chính', path: '/payment', icon: <CreditCard size={20} />, roles: ['ADMIN'] },
    { name: 'Quản lý nhân sự', path: '/admin/users', icon: <Users size={20} />, roles: ['ADMIN'] },
    { name: 'Quản lý báo cáo', path: '/admin', icon: <BarChart3 size={20} />, roles: ['ADMIN'] },
    { name: 'Quản lý nhập xuất', path: '/inventory/import', icon: <Package size={20} />, roles: ['ADMIN'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user.role));
  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* --- MOBILE HEADER --- */}
      <div className="md:hidden fixed top-0 left-0 z-50 p-4 w-full bg-blue-600 text-white flex justify-between items-center shadow-md">
        <span className="font-bold text-lg">Hospital Manager</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="focus:outline-none">
          {/* Thay đổi icon menu mobile */}
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* --- SIDEBAR --- */}
      <aside className={`
        fixed top-0 left-0 z-40 w-64 h-screen bg-slate-800 text-white transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0
      `}>
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center justify-center bg-blue-600 shadow-md">
             <Link to="/dashboard" className="text-xl font-bold flex items-center gap-2">
                <Stethoscope size={24} /> <span>Hospital Manager</span>
             </Link>
          </div>

          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-2">
            {filteredMenu.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {/* Render Component Icon thay vì Emoji */}
                <span className={`mr-3 ${isActive(item.path) ? 'text-white' : 'text-slate-400'}`}>
                  {item.icon}
                </span>
                {item.name}
              </Link>
            ))}
          </div>

          {/* User Profile Footer */}
          <div className="border-t border-slate-700 p-4 bg-slate-900">
             <div className="flex items-center gap-3 mb-4 cursor-pointer hover:opacity-80 transition" onClick={() => navigate('/profile')}>
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                  <User size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.username}</p>
                  <p className="text-xs text-slate-400 truncate">{user.role}</p>
                </div>
             </div>
             <button 
                onClick={handleLogout}
                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition flex items-center justify-center gap-2"
             >
                <LogOut size={16} /> Đăng xuất
             </button>
          </div>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}
    </>
  );
};

export default Navbar;