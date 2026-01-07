// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom'; // Thêm Link, useLocation
import api from '../services/api';

const Dashboard = () => {
    const navigate = useNavigate();
    const location = useLocation(); // Để kiểm tra trang hiện tại
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get('/users/me');
                setUser(response.data);
            } catch (error) {
                alert("Phiên đăng nhập hết hạn");
                localStorage.removeItem('token');
                navigate('/');
            }
        };
        fetchUser();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* --- SIDEBAR (MENU TRÁI) --- */}
            <div className="w-64 bg-white shadow-md flex-shrink-0 overflow-y-auto">
                <div className="p-4 border-b">
                    <h1 className="text-xl font-bold text-blue-600 flex items-center">
                        🏥 Hospital Manager
                    </h1>
                </div>
                
                <nav className="p-4">
                    <ul className="space-y-2">
                        {/* 1. Tổng quan */}
                        <li>
                            <Link to="/dashboard" className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${location.pathname === '/dashboard' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <span className="text-xl">📊</span>
                                <span className="font-bold">Tổng quan</span>
                            </Link>
                        </li>

                        {/* 2. Đặt lịch */}
                        <li>
                            <Link to="/booking" className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${location.pathname === '/booking' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <span className="text-xl">📅</span>
                                <span className="font-bold">Đặt lịch khám</span>
                            </Link>
                        </li>

                        {/* 3. Các chức năng chính (Chuyển từ Button sang Menu) */}
                        <li><div className="p-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Chức năng</div></li>
                        
                        <li>
                            <Link to="/reception" className="flex items-center space-x-3 p-3 rounded-lg text-gray-600 hover:bg-gray-50">
                                <span className="text-xl">desk</span>
                                <span className="font-bold">Tiếp đón (Y Tá)</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/doctor" className="flex items-center space-x-3 p-3 rounded-lg text-gray-600 hover:bg-gray-50">
                                <span className="text-xl">🩺</span>
                                <span className="font-bold">Phòng khám (BS)</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/payment" className="flex items-center space-x-3 p-3 rounded-lg text-gray-600 hover:bg-gray-50">
                                <span className="text-xl">💸</span>
                                <span className="font-bold">Thu ngân</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/inpatient" className="flex items-center space-x-3 p-3 rounded-lg text-gray-600 hover:bg-gray-50">
                                <span className="text-xl">🛏️</span>
                                <span className="font-bold">Nội trú</span>
                            </Link>
                        </li>

                        {/* --- 4. KHO & VẬT TƯ (BẠN YÊU CẦU THÊM) --- */}
                        <li>
                            <div className="p-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                Quản lý Kho Dược
                            </div>
                        </li>

                        <li>
                            <Link to="/inventory/import" className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${location.pathname === '/inventory/import' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <span className="text-xl">📥</span>
                                <span className="font-bold">Nhập Kho</span>
                            </Link>
                        </li>

                        <li>
                            <Link to="/inventory/alerts" className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${location.pathname === '/inventory/alerts' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <span className="text-xl">⚠️</span>
                                <span className="font-bold">Cảnh báo Hạn/Tồn</span>
                            </Link>
                        </li>
                        {/* --------------------------------------------- */}
                        
                        <li className="pt-4 border-t mt-4">
                            <button onClick={handleLogout} className="flex items-center space-x-3 p-3 rounded-lg text-red-600 hover:bg-red-50 w-full text-left">
                                <span className="text-xl">🚪</span>
                                <span className="font-bold">Đăng xuất</span>
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>

            {/* --- MAIN CONTENT (NỘI DUNG CHÍNH) --- */}
            <div className="flex-1 p-10 overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                    {user && (
                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <p className="font-bold text-gray-700">{user.full_name}</p>
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{user.role}</span>
                            </div>
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {user.full_name.charAt(0)}
                            </div>
                        </div>
                    )}
                </div>

                {/* Nội dung Dashboard (Widgets, Thống kê...) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-bold uppercase">Bệnh nhân hôm nay</h3>
                        <p className="text-3xl font-bold text-blue-600 mt-2">124</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-bold uppercase">Doanh thu ngày</h3>
                        <p className="text-3xl font-bold text-green-600 mt-2">15.2M</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-bold uppercase">Lịch hẹn mới</h3>
                        <p className="text-3xl font-bold text-purple-600 mt-2">8</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;