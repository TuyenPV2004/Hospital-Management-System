// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api'; // Import file cấu hình API vừa tạo

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
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

            // Nếu thành công:
            // 1. Lưu token vào localStorage
            localStorage.setItem('token', response.data.access_token);
            
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
                    Hệ thống Bệnh Viện
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
                            placeholder="Nhập admin"
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">
                            Mật khẩu
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                            placeholder="Nhập mật khẩu"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded hover:bg-blue-700"
                    >
                        Đăng Nhập
                    </button>
                    <div className="mt-4 text-center border-t pt-4">
                        <p className="text-gray-600 text-sm">Bạn chưa có tài khoản?</p>
                        <Link to="/register" className="text-blue-600 font-bold hover:underline">
                        Đăng ký khám bệnh ngay
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;