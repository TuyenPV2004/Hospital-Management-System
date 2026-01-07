// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import { hasRole } from '../utils/roleGuard';

const Dashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
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
        sessionStorage.removeItem('token');
        navigate('/');
    };

    // ===== ĐỊNH NGHĨA DANH SÁCH MENU DỰA TRÊN ROLE =====
    const getMenuItems = (role) => {
        const allMenus = {
            // MENU CHUNG (Tất cả người dùng đã đăng nhập)
            common: [
                { path: "/dashboard", label: "Tổng quan", icon: "📊", roles: ["ADMIN", "DOCTOR", "NURSE", "PATIENT", "TECHNICIAN"] },
                { path: "/booking", label: "Đặt lịch khám", icon: "📅", roles: ["ADMIN", "DOCTOR", "NURSE", "PATIENT"] },
            ],
            
            // CHỨC NĂNG CHÍNH
            functions: [
                { path: "/reception", label: "Tiếp đón (Y Tá)", icon: "🏥", roles: ["ADMIN", "NURSE"] },
                { path: "/doctor", label: "Phòng khám (BS)", icon: "🩺", roles: ["ADMIN", "DOCTOR"] },
                { path: "/payment", label: "Thu ngân", icon: "💸", roles: ["ADMIN"] },
                { path: "/inpatient", label: "Nội trú", icon: "🛏️", roles: ["ADMIN", "NURSE"] },
            ],
            
            // KHO & VẬT TƯ (CHỈ ADMIN)
            inventory: [
                { path: "/inventory/import", label: "Nhập Kho", icon: "📥", roles: ["ADMIN"] },
                { path: "/inventory/alerts", label: "Cảnh báo Hạn/Tồn", icon: "⚠️", roles: ["ADMIN"] },
            ],
            
            // QUẢN LÝ HỆ THỐNG (CHỈ ADMIN)
            admin: [
                { path: "/admin/users", label: "Quản lý Nhân Viên", icon: "👥", roles: ["ADMIN"] },
                { path: "/admin", label: "Báo Cáo & Thống Kê", icon: "📈", roles: ["ADMIN"] },
            ]
        };

        return {
            common: allMenus.common.filter(item => item.roles.includes(role)),
            functions: allMenus.functions.filter(item => item.roles.includes(role)),
            inventory: allMenus.inventory.filter(item => item.roles.includes(role)),
            admin: allMenus.admin.filter(item => item.roles.includes(role))
        };
    };

    const menus = user ? getMenuItems(user.role) : { common: [], functions: [], inventory: [], admin: [] };

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
                        {/* ===== MENU CHUNG ===== */}
                        {menus.common.map(item => (
                            <li key={item.path}>
                                <Link to={item.path} className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${location.pathname === item.path ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-50'}`}>
                                    <span className="text-xl">{item.icon}</span>
                                    <span className="font-bold">{item.label}</span>
                                </Link>
                            </li>
                        ))}

                        {/* ===== CHỨC NĂNG CHÍNH ===== */}
                        {menus.functions.length > 0 && (
                            <>
                                <li><div className="p-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Chức năng</div></li>
                                {menus.functions.map(item => (
                                    <li key={item.path}>
                                        <Link to={item.path} className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${location.pathname === item.path ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-50'}`}>
                                            <span className="text-xl">{item.icon}</span>
                                            <span className="font-bold">{item.label}</span>
                                        </Link>
                                    </li>
                                ))}
                            </>
                        )}

                        {/* ===== KHO & VẬT TƯ ===== */}
                        {menus.inventory.length > 0 && (
                            <>
                                <li>
                                    <div className="p-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        Quản lý Kho Dược
                                    </div>
                                </li>
                                {menus.inventory.map(item => (
                                    <li key={item.path}>
                                        <Link to={item.path} className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${location.pathname === item.path ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-50'}`}>
                                            <span className="text-xl">{item.icon}</span>
                                            <span className="font-bold">{item.label}</span>
                                        </Link>
                                    </li>
                                ))}
                            </>
                        )}

                        {/* ===== QUẢN LÝ HỆ THỐNG ===== */}
                        {menus.admin.length > 0 && (
                            <>
                                <li>
                                    <div className="p-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        Quản lý Hệ Thống
                                    </div>
                                </li>
                                {menus.admin.map(item => (
                                    <li key={item.path}>
                                        <Link to={item.path} className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${location.pathname === item.path ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-50'}`}>
                                            <span className="text-xl">{item.icon}</span>
                                            <span className="font-bold">{item.label}</span>
                                        </Link>
                                    </li>
                                ))}
                            </>
                        )}

                        {/* ===== ĐĂNG XUẤT ===== */}
                        <li className="pt-4 border-t mt-4">
                            <button onClick={handleLogout} className="flex items-center space-x-3 p-3 rounded-lg text-red-600 hover:bg-red-50 w-full text-left transition">
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
}

export default Dashboard;