// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Kiểm tra xem token có dùng được không bằng cách gọi API lấy thông tin user
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
        <div className="p-10">
            <h1 className="text-3xl font-bold text-green-600">Dashboard</h1>
            {user ? (
                <div className="mt-4">
                    <p>Xin chào, <strong>{user.full_name}</strong>!</p>
                    <p>Vai trò: <span className="px-2 py-1 text-sm text-white bg-blue-500 rounded">{user.role}</span></p>
                    
                    {/* --- BỔ SUNG NÚT ADMIN TẠI ĐÂY --- */}
                    {user.role === 'ADMIN' && (
                        <div className="mt-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 rounded">
                            <h3 className="font-bold text-yellow-700">Khu vực Quản Trị Viên</h3>
                            <button 
                                onClick={() => navigate('/admin/users')}
                                className="mt-2 px-4 py-2 bg-yellow-600 text-white font-bold rounded hover:bg-yellow-700"
                            >
                                🛠 Quản Lý Nhân Sự (Admin)
                            </button>
                        </div>
                    )}
                    {/* ---------------------------------- */}

                    <button 
                        onClick={handleLogout}
                        className="mt-6 px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600"
                    >
                        Đăng xuất
                    </button>
                </div>
            ) : (
                <p>Đang tải thông tin...</p>
            )}
              <div className="mt-6 space-x-4">
            <button 
                onClick={() => navigate('/reception')}
                className="px-6 py-3 bg-blue-600 text-white font-bold rounded shadow hover:bg-blue-700"
            >
                Khu Vực Tiếp Đón (Y Tá)
            </button>
            
            <button 
                onClick={() => navigate('/doctor')} // Thêm sự kiện navigate
                className="px-6 py-3 bg-green-600 text-white font-bold rounded shadow hover:bg-green-700"
            >
                Phòng Khám (Bác Sĩ)
            </button>

            <button 
                onClick={() => navigate('/payment')}
                className="px-6 py-3 bg-purple-600 text-white font-bold rounded shadow hover:bg-purple-700"
            >
                Thu Ngân (Thanh Toán)
            </button>

            <button 
                onClick={() => navigate('/pharmacy')} className="px-6 py-3 bg-teal-600 text-white font-bold rounded shadow">
                Quản Lý Kho Dược
            </button>
        </div>
        </div>      
    );
};

export default Dashboard;


      