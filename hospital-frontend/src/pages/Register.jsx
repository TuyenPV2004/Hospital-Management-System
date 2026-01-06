// src/pages/Register.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '', password: '', full_name: '', email: '', phone: ''
    });

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await api.post('/register', formData);
            alert("Đăng ký thành công! Vui lòng đăng nhập.");
            navigate('/'); // Quay về trang Login
        } catch (err) {
            alert("Lỗi: " + (err.response?.data?.detail || "Đăng ký thất bại"));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-blue-50">
            <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">Đăng Ký Bệnh Nhân</h2>
                <form onSubmit={handleRegister} className="space-y-4">
                    <input type="text" placeholder="Tên đăng nhập (*)" required className="w-full border p-2 rounded"
                        onChange={e => setFormData({...formData, username: e.target.value})} />
                    <input type="password" placeholder="Mật khẩu (*)" required className="w-full border p-2 rounded"
                        onChange={e => setFormData({...formData, password: e.target.value})} />
                    <input type="text" placeholder="Họ và tên (*)" required className="w-full border p-2 rounded"
                        onChange={e => setFormData({...formData, full_name: e.target.value})} />
                    <input type="text" placeholder="Số điện thoại" className="w-full border p-2 rounded"
                        onChange={e => setFormData({...formData, phone: e.target.value})} />
                    <input type="email" placeholder="Email" className="w-full border p-2 rounded"
                        onChange={e => setFormData({...formData, email: e.target.value})} />
                    
                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">
                        Đăng Ký Ngay
                    </button>
                </form>
                <div className="text-center mt-4">
                    <Link to="/" className="text-sm text-gray-600 hover:text-blue-500">Đã có tài khoản? Đăng nhập</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;