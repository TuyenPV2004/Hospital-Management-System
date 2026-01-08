// src/components/Navbar.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState({ username: '', role: '' });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Giải mã token
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ username: payload.sub, role: payload.role });
      } catch (e) {
        console.error("Invalid token");
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    navigate('/');
  };

  // Danh sách menu (giữ nguyên logic phân quyền)
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '🏠', roles: ['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT', 'TECHNICIAN'] },
    { name: 'Đặt lịch', path: '/booking', icon: '📅', roles: ['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT'] },
    { name: 'Tiếp đón', path: '/reception', icon: 'desk', roles: ['ADMIN', 'NURSE'] },
    { name: 'Phòng khám', path: '/doctor', icon: 'stethoscope', roles: ['ADMIN', 'DOCTOR'] },
    { name: 'Kho thuốc', path: '/pharmacy', icon: '💊', roles: ['ADMIN', 'NURSE'] },
    { name: 'Nội trú', path: '/inpatient', icon: '🛏️', roles: ['ADMIN', 'NURSE'] },
    { name: 'Thanh toán', path: '/payment', icon: '💳', roles: ['ADMIN'] },
    { name: 'Nhân sự', path: '/admin/users', icon: '👥', roles: ['ADMIN'] },
    { name: 'Báo cáo', path: '/admin', icon: '📊', roles: ['ADMIN'] },
    { name: 'Nhập kho', path: '/inventory/import', icon: '📥', roles: ['ADMIN'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user.role));
  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* --- MOBILE TOGGLE BUTTON (Chỉ hiện trên màn hình nhỏ) --- */}
      <div className="md:hidden fixed top-0 left-0 z-50 p-4 w-full bg-white border-b flex justify-between items-center shadow-sm">
        <span className="font-bold text-blue-600 text-lg">Hospital Manager</span>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md hover:bg-gray-100 focus:outline-none"
        >
          {isMobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          )}
        </button>
      </div>

      {/* --- SIDEBAR (Thanh dọc bên trái) --- */}
      <aside className={`
        fixed top-0 left-0 z-40 w-64 h-screen bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0
      `}>
        <div className="h-full flex flex-col">
          {/* Logo Area */}
          <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-blue-600">
             <Link to="/dashboard" className="text-xl font-bold text-white flex items-center gap-2">
                🏥 <span>Hospital App</span>
             </Link>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {filteredMenu.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)} // Đóng menu khi click trên mobile
                className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="mr-3 text-lg">{item.icon || '•'}</span>
                {item.name}
              </Link>
            ))}
          </div>

          {/* User Profile Area (Footer của Sidebar) */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
             <div className="flex items-center gap-3 mb-3 cursor-pointer" onClick={() => navigate('/profile')}>
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold uppercase shadow-sm">
                  {user.username.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.username}</p>
                  <p className="text-xs text-gray-500 truncate">{user.role}</p>
                </div>
             </div>
             
             <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
             >
                Đăng xuất
             </button>
          </div>
        </div>
      </aside>

      {/* Overlay cho Mobile khi mở menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Navbar;