// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Login = () => {
    const navigate = useNavigate();
    
    // State cơ bản
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // --- STATE NÂNG CẤP ---
    const [showPassword, setShowPassword] = useState(false); // Ẩn/Hiện mật khẩu
    const [rememberMe, setRememberMe] = useState(true);      // Mặc định là Ghi nhớ

    // Kiểm tra nếu đã đăng nhập rồi thì chuyển vào Dashboard luôn
    useEffect(() => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) navigate('/dashboard');
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/login', {
                username: username,
                password: password,
            });

            const token = response.data.access_token;

            // --- LOGIC GHI NHỚ ĐĂNG NHẬP ---
            if (rememberMe) {
                localStorage.setItem('token', token); // Lưu lâu dài
            } else {
                sessionStorage.setItem('token', token); // Mất khi đóng tab
            }
            
            navigate('/dashboard');

        } catch (err) {
            console.error(err);
            if (err.response && (err.response.status === 401 || err.response.status === 400)) {
                setError('Sai tên đăng nhập hoặc mật khẩu!');
            } else {
                setError('Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-2xl transform transition-all hover:scale-[1.01]">
                {/* Header Logo/Title */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-3xl shadow-lg">
                        🏥
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-800">Cổng Thông Tin</h2>
                    <p className="text-gray-500 text-sm mt-1">Hệ thống Quản lý Bệnh viện</p>
                </div>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded animate-pulse">
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    {/* Input Username */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Tài khoản</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                👤
                            </span>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                placeholder="Nhập tên đăng nhập/Email"
                                required
                            />
                        </div>
                    </div>

                    {/* Input Password (Có nút Show/Hide) */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Mật khẩu</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                🔒
                            </span>
                            <input
                                type={showPassword ? "text" : "password"} // --- Thay đổi loại input ---
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                placeholder="Nhập mật khẩu"
                                required
                            />
                            {/* Nút con mắt (Eye Icon) */}
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 focus:outline-none"
                            >
                                {showPassword ? (
                                    // Icon Mắt mở (SVG)
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                ) : (
                                    // Icon Mắt đóng (SVG)
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Checkbox & Forgot Password */}
                    <div className="flex items-center justify-between">
                        <label className="flex items-center text-sm text-gray-600 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                            />
                            <span className="ml-2">Ghi nhớ tôi</span>
                        </label>
                        <Link to="/forgot-password" class="text-sm font-medium text-blue-600 hover:text-blue-500 hover:underline">
                            Quên mật khẩu?
                        </Link>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 px-4 text-white font-bold rounded-lg shadow-md transition-all duration-200
                            ${loading 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transform hover:-translate-y-0.5'
                            }`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Đang xử lý...
                            </span>
                        ) : 'ĐĂNG NHẬP'}
                    </button>
                </form>

                {/* Footer Links & Support */}
                <div className="mt-8 pt-6 border-t border-gray-100 text-center space-y-4">
                    <div>
                        <p className="text-gray-600 text-sm">Bệnh nhân mới?</p>
                        <Link to="/register" className="text-blue-600 font-bold hover:underline">
                            Đăng ký tài khoản khám bệnh
                        </Link>
                    </div>
                    
                    {/* --- INFO HỖ TRỢ --- */}
                    <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-500">
                        <p className="font-bold text-gray-700 mb-1">🆘 Cần hỗ trợ kỹ thuật?</p>
                        <p>Hotline IT: <span className="font-mono text-blue-600">098.xxx.xxx (Mr. Admin)</span></p>
                        <p>Email: <span className="font-mono text-blue-600">support@hospital.com</span></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;