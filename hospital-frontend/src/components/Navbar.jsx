// src/components/Navbar.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState({ username: '', role: '' });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 1. Logic giải mã Token để lấy thông tin User
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

  // 2. Danh sách Menu (Bạn có thể sửa icon hoặc tên tại đây)
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊', roles: ['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT', 'TECHNICIAN'] },
    { name: 'Đặt lịch', path: '/booking', icon: '📅', roles: ['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT'] },
    { name: 'Quản lý lịch', path: '/appointments', icon: '🗓️', roles: ['ADMIN', 'DOCTOR', 'NURSE'] },
    { name: 'Hồ sơ BN', path: '/patients', icon: '📋', roles: ['ADMIN', 'DOCTOR', 'NURSE', 'TECHNICIAN'] },
    { name: 'Tiếp đón', path: '/reception', icon: '✍️', roles: ['ADMIN', 'NURSE'] },
    { name: 'Phòng khám', path: '/doctor', icon: '🩺', roles: ['ADMIN', 'DOCTOR'] },
    { name: 'Kho thuốc', path: '/pharmacy', icon: '💊', roles: ['ADMIN', 'NURSE'] },
    { name: 'Nội trú', path: '/inpatient', icon: '🛏️', roles: ['ADMIN', 'NURSE'] },
    { name: 'Thanh toán', path: '/payment', icon: '💰', roles: ['ADMIN'] },
    { name: 'Nhân sự', path: '/admin/users', icon: '👥', roles: ['ADMIN'] },
    { name: 'Báo cáo', path: '/admin', icon: '📈', roles: ['ADMIN'] },
    { name: 'Nhập kho', path: '/inventory/import', icon: '📦', roles: ['ADMIN'] },
  ];

  // Lọc menu theo quyền
  const filteredMenu = menuItems.filter(item => item.roles.includes(user.role));
  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* --- MOBILE HEADER (Chỉ hiện trên điện thoại) --- */}
      <div className="md:hidden fixed top-0 left-0 z-50 p-4 w-full bg-blue-600 text-white flex justify-between items-center shadow-md">
        <span className="font-bold text-lg">Hospital Manager</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="focus:outline-none">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </div>

      {/* --- SIDEBAR (Thanh dọc bên trái) --- */}
      <aside className={`
        fixed top-0 left-0 z-40 w-64 h-screen bg-slate-800 text-white transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0
      `}>
        <div className="h-full flex flex-col">
          {/* Logo Area - Đã đổi tên thành Hospital Manager */}
          <div className="h-16 flex items-center justify-center bg-blue-600 shadow-md">
             <Link to="/dashboard" className="text-xl font-bold flex items-center gap-2">
                🏥 <span>Hospital Manager</span>
             </Link>
          </div>

          {/* Menu Items */}
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
                <span className="mr-3 text-xl">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </div>

          {/* User Profile Footer */}
          <div className="border-t border-slate-700 p-4 bg-slate-900">
             <div className="flex items-center gap-3 mb-4 cursor-pointer hover:opacity-80 transition" onClick={() => navigate('/profile')}>
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold uppercase">
                  {user.username.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.username}</p>
                  <p className="text-xs text-slate-400 truncate">{user.role}</p>
                </div>
             </div>
             <button 
                onClick={handleLogout}
                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition"
             >
                Đăng xuất
             </button>
          </div>
        </div>
      </aside>

      {/* Overlay cho Mobile */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}
    </>
  );
};

export default Navbar;