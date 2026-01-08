// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api'; // Import file cấu hình API vừa tạo

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            // Tạo FormData theo format OAuth2PasswordRequestForm
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            // Gọi API Login từ Backend với Content-Type: application/x-www-form-urlencoded
            const response = await api.post('/login', formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            const token = response.data.access_token;
            if (rememberMe) {
                localStorage.setItem('token', token);
                sessionStorage.removeItem('token');
            } else {
                sessionStorage.setItem('token', token);
                localStorage.removeItem('token');
            }
            
            // 2. Chuyển hướng sang trang Dashboard
            alert("Đăng nhập thành công!");
            navigate('/dashboard');

        } catch (err) {
            // Xử lý lỗi
            console.error(err);
            if (err.response && err.response.status === 401) {
                setError('Sai tên đăng nhập hoặc mật khẩu');
            } else {
                setError('Lỗi kết nối Server');
            }
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
                <h2 className="text-2xl font-bold text-center text-blue-600">
                    Hệ thống quản lý bệnh viện
                </h2>
                
                {error && (
                    <div className="p-3 text-sm text-red-500 bg-red-100 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">
                            Tên đăng nhập
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                            placeholder="Nhập tên đăng nhập"
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">
                            Mật khẩu
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 pr-10"
                                placeholder="Nhập mật khẩu"
                                required
                            />
                            <button
                                type="button"
                                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-blue-600 focus:outline-none"
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.98 8.223C5.83 5.671 8.73 4 12 4c.98 0 1.926.141 2.82.406m3.2 1.83C19.6 7.24 20.62 8.508 21.02 9.777a2.8 2.8 0 010 3.554c-.609 1.757-1.76 3.137-3.31 4.143M9.88 9.88A3 3 0 0114.12 14.12M6.06 6.06l11.88 11.88" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-700">
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                            />
                            <span>Ghi nhớ tôi</span>
                        </label>
                        <Link to="/forgot-password" className="text-sm text-blue-500 hover:underline">
                            Quên mật khẩu ?
                        </Link>
                    </div>
                    <button
                        type="submit"
                        className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded hover:bg-blue-700"
                    >
                        Đăng Nhập
                    </button>
                    <div className="mt-6 text-center border-t pt-4 space-y-3">
                        <div className="text-gray-600 text-sm space-y-1">
                            <p>Bạn chưa có tài khoản ?</p>
                        </div>
                        <Link to="/register" className="text-blue-600 font-bold hover:underline block">
                            Đăng ký tài khoản
                        </Link>
                        <Link
                            to="/booking"
                            className="inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
                        >
                            Đặt lịch khám ngay
                        </Link>
                        <p>Liên hệ quản trị viên - Hotline: 012345678</p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;