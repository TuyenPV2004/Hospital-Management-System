// src/components/Navbar.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState({ username: '', role: '' });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Hàm giải mã JWT đơn giản để lấy thông tin user từ token
  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    // Lấy token từ localStorage hoặc sessionStorage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      const decoded = parseJwt(token);
      if (decoded) {
        setUser({ username: decoded.sub, role: decoded.role });
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    navigate('/');
  };

  // Định nghĩa các menu item và quyền truy cập
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', roles: ['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT', 'TECHNICIAN'] },
    { name: 'Đặt lịch', path: '/booking', roles: ['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT'] },
    { name: 'Tiếp đón', path: '/reception', roles: ['ADMIN', 'NURSE'] },
    { name: 'Phòng khám', path: '/doctor', roles: ['ADMIN', 'DOCTOR'] },
    { name: 'Kho thuốc', path: '/pharmacy', roles: ['ADMIN', 'NURSE'] },
    { name: 'Nội trú', path: '/inpatient', roles: ['ADMIN', 'NURSE'] },
    { name: 'Thanh toán', path: '/payment', roles: ['ADMIN'] },
    { name: 'Nhân sự', path: '/admin/users', roles: ['ADMIN'] },
    { name: 'Báo cáo', path: '/admin', roles: ['ADMIN'] },
    { name: 'Nhập kho', path: '/inventory/import', roles: ['ADMIN'] },
  ];

  // Lọc menu dựa trên role của user hiện tại
  const filteredMenu = menuItems.filter(item => item.roles.includes(user.role));

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm fixed w-full z-30 top-0 left-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Logo & Desktop Menu */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/dashboard" className="text-2xl font-bold text-blue-600">
                Hospital<span className="text-gray-700">Manager</span>
              </Link>
            </div>
            <div className="hidden md:ml-6 md:flex md:space-x-4 items-center">
              {filteredMenu.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* User Menu (Right Side) */}
          <div className="hidden md:flex items-center ml-6">
            <div className="ml-3 relative">
              <div>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold uppercase">
                    {user.username.charAt(0)}
                  </div>
                  <span className="ml-2 text-gray-700 font-medium">{user.username}</span>
                  <svg className="ml-1 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm text-gray-500">Vai trò</p>
                    <p className="text-sm font-bold text-gray-900">{user.role}</p>
                  </div>
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    Thông tin cá nhân
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="-mr-2 flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
              <svg className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {filteredMenu.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive(item.path)
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-4 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg uppercase">
                  {user.username.charAt(0)}
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{user.username}</div>
                <div className="text-sm font-medium text-gray-500">{user.role}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Link
                to="/profile"
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Thông tin cá nhân
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;