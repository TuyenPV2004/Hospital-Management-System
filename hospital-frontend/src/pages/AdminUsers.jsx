// src/pages/AdminUsers.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({
        username: '', password: '', full_name: '', role: 'DOCTOR', email: '', phone: ''
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (err) { console.error(err); }
    };

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/users', newUser);
            alert("Đã tạo nhân viên mới!");
            setNewUser({ username: '', password: '', full_name: '', role: 'DOCTOR', email: '', phone: '' });
            fetchUsers();
        } catch (err) {
            alert("Lỗi: " + (err.response?.data?.detail || "Không thể tạo"));
        }
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">🛠 Quản Lý Nhân Sự</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* FORM TẠO NHÂN VIÊN */}
                <div className="bg-white p-6 rounded shadow h-fit">
                    <h2 className="text-xl font-bold mb-4 text-blue-700">Cấp Tài Khoản Mới</h2>
                    <form onSubmit={handleCreateStaff} className="space-y-3">
                        <div>
                            <label className="font-bold text-sm">Vai trò:</label>
                            <select className="w-full border p-2 rounded font-bold"
                                value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                                <option value="DOCTOR">Bác sĩ (DOCTOR)</option>
                                <option value="NURSE">Y tá (NURSE)</option>
                                <option value="ADMIN">Quản trị viên (ADMIN)</option>
                            </select>
                        </div>
                        <input type="text" placeholder="Tên đăng nhập" required className="w-full border p-2 rounded"
                            value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                        <input type="text" placeholder="Mật khẩu mặc định" required className="w-full border p-2 rounded"
                            value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                        <input type="text" placeholder="Họ và tên nhân viên" required className="w-full border p-2 rounded"
                            value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} />
                        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">
                            + Thêm Nhân Viên
                        </button>
                    </form>
                </div>

                {/* DANH SÁCH NHÂN VIÊN */}
                <div className="lg:col-span-2 bg-white p-6 rounded shadow">
                    <h2 className="text-xl font-bold mb-4 text-gray-700">Danh Sách Cán Bộ Nhân Viên</h2>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-b">
                                <th className="p-3">ID</th>
                                <th className="p-3">Tên đăng nhập</th>
                                <th className="p-3">Họ tên</th>
                                <th className="p-3">Vai trò</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.user_id} className="border-b hover:bg-gray-50">
                                    <td className="p-3">{u.user_id}</td>
                                    <td className="p-3 font-mono text-blue-600">{u.username}</td>
                                    <td className="p-3 font-bold">{u.full_name}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs text-white font-bold
                                            ${u.role === 'ADMIN' ? 'bg-red-500' : 
                                              u.role === 'DOCTOR' ? 'bg-green-500' : 'bg-purple-500'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminUsers;