// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Dashboard = () => {
    const navigate = useNavigate();
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

    return (
        <div className="p-6">
            {/* Header với thông tin user */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Tổng quan bệnh viện</h1>
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
    );
}

export default Dashboard;