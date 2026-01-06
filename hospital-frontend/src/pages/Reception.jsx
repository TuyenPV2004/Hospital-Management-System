// src/pages/Reception.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Reception = () => {
    // State cho danh sách bệnh nhân
    const [patients, setPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // State cho form thêm mới
    const [newPatient, setNewPatient] = useState({
        full_name: '',
        dob: '',
        gender: 'Nam',
        phone: '',
        address: '',
        insurance_card: '',
        // --- CÁC TRƯỜNG MỚI BỔ SUNG ---
        cccd: '', 
        email: '', 
        emergency_contact: '', 
        blood_type: '', 
        height: '', 
        weight: '', 
        allergies: '', 
        medical_history: ''
    });

    // 1. Load danh sách bệnh nhân khi vào trang
    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async (query = '') => {
        try {
            // Gọi API GET /patients (có hoặc không có search)
            const url = query ? `/patients?search=${query}` : '/patients';
            const response = await api.get(url);
            setPatients(response.data);
        } catch (error) {
            console.error("Lỗi tải danh sách:", error);
        }
    };

    // 2. Xử lý tìm kiếm
    const handleSearch = (e) => {
        e.preventDefault();
        fetchPatients(searchTerm);
    };

    // 3. Xử lý thêm bệnh nhân mới
    const handleAddPatient = async (e) => {
        e.preventDefault();
        try {
            await api.post('/patients', newPatient);
            alert("Thêm bệnh nhân thành công!");
            // Reset form và load lại danh sách
            setNewPatient({ full_name: '', dob: '', gender: 'Nam', phone: '', address: '', insurance_card: '' });
            fetchPatients();
        } catch (error) {
            alert("Lỗi: " + (error.response?.data?.detail || "Không thể thêm"));
        }
    };

    // 4. Xử lý nút "Tiếp đón" (Tạo lượt khám)
    const handleCreateVisit = async (patientId) => {
        if (!window.confirm("Xác nhận tiếp đón bệnh nhân này?")) return;
        
        try {
            await api.post('/visits', {
                patient_id: patientId,
                doctor_id: null // Chưa gán bác sĩ cụ thể, để null
            });
            alert("Đã thêm vào hàng đợi khám!");
        } catch (error) {
            alert("Lỗi: " + (error.response?.data?.detail || "Không thể tạo lượt khám"));
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-blue-700 mb-6">Khu Vực Tiếp Đón</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* --- CỘT TRÁI: FORM THÊM BỆNH NHÂN --- */}
                <div className="md:col-span-1 bg-white p-4 rounded shadow">
                    <h2 className="text-xl font-bold mb-4 text-gray-700">Thêm Bệnh Nhân Mới</h2>
                    <form onSubmit={handleAddPatient} className="space-y-3 h-full overflow-y-auto pr-2">
                        <h3 className="font-bold text-blue-600 border-b">1. Hành chính</h3>
                        <input type="text" placeholder="Họ và tên (*)" required className="w-full border p-2 rounded"
                            value={newPatient.full_name} onChange={e => setNewPatient({...newPatient, full_name: e.target.value})} />
                        
                        <div className="grid grid-cols-2 gap-2">
                            <input type="date" className="border p-2 rounded"
                                value={newPatient.dob} onChange={e => setNewPatient({...newPatient, dob: e.target.value})} />
                            <select className="border p-2 rounded" value={newPatient.gender} onChange={e => setNewPatient({...newPatient, gender: e.target.value})}>
                                <option value="Nam">Nam</option>
                                <option value="Nu">Nữ</option>
                            </select>
                        </div>
                         {/* Lưu ý: Bạn nên giữ lại trường SĐT và Địa chỉ nếu cần thiết, 
                             hoặc code của bạn đã thay thế chúng bằng các trường khác */}
                        <div className="grid grid-cols-2 gap-2">
                            <input type="text" placeholder="Số CCCD" className="border p-2 rounded"
                                value={newPatient.cccd} onChange={e => setNewPatient({...newPatient, cccd: e.target.value})} />
                            <input type="text" placeholder="Số BHYT" className="border p-2 rounded"
                                value={newPatient.insurance_card} onChange={e => setNewPatient({...newPatient, insurance_card: e.target.value})} />
                        </div>
                        <input type="text" placeholder="Người thân (Tên - SĐT)" className="w-full border p-2 rounded"
                            value={newPatient.emergency_contact} onChange={e => setNewPatient({...newPatient, emergency_contact: e.target.value})} />

                        <h3 className="font-bold text-red-600 border-b mt-4">2. Y tế & Thể trạng</h3>
                        <div className="grid grid-cols-3 gap-2">
                            <input type="number" placeholder="Cao (cm)" className="border p-2 rounded"
                                value={newPatient.height} onChange={e => setNewPatient({...newPatient, height: e.target.value})} />
                            <input type="number" placeholder="Nặng (kg)" className="border p-2 rounded"
                                value={newPatient.weight} onChange={e => setNewPatient({...newPatient, weight: e.target.value})} />
                            <select className="border p-2 rounded" value={newPatient.blood_type} onChange={e => setNewPatient({...newPatient, blood_type: e.target.value})}>
                                <option value="">Máu?</option>
                                <option value="A">A</option><option value="B">B</option><option value="AB">AB</option><option value="O">O</option>
                            </select>
                        </div>
                        
                        <textarea placeholder="⚠️ TIỀN SỬ DỊ ỨNG (Quan trọng)" className="w-full border p-2 rounded border-red-300 bg-red-50 text-red-700 font-bold placeholder-red-300"
                            value={newPatient.allergies} onChange={e => setNewPatient({...newPatient, allergies: e.target.value})}></textarea>
                        
                        <textarea placeholder="Bệnh nền (Tiểu đường, HA...)" className="w-full border p-2 rounded"
                            value={newPatient.medical_history} onChange={e => setNewPatient({...newPatient, medical_history: e.target.value})}></textarea>

                        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700 mt-2">
                            + Lưu Hồ Sơ Chi Tiết
                        </button>
                    </form>
                </div>

                {/* --- CỘT PHẢI: DANH SÁCH & TÌM KIẾM --- */}
                <div className="md:col-span-2 bg-white p-4 rounded shadow">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-700">Tra Cứu Bệnh Nhân</h2>
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <input 
                                type="text" placeholder="Tên hoặc mã BHYT..."
                                className="border p-2 rounded w-64"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                                Tìm
                            </button>
                        </form>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-100 text-left">
                                    <th className="p-3 border">ID</th>
                                    <th className="p-3 border">Họ Tên</th>
                                    <th className="p-3 border">Năm sinh</th>
                                    <th className="p-3 border">Giới tính</th>
                                    <th className="p-3 border">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {patients.map(p => (
                                    <tr key={p.patient_id} className="hover:bg-gray-50">
                                        <td className="p-3 border text-center font-bold">{p.patient_id}</td>
                                        <td className="p-3 border">{p.full_name}</td>
                                        <td className="p-3 border">{p.dob}</td>
                                        <td className="p-3 border">{p.gender}</td>
                                        <td className="p-3 border text-center">
                                            <button 
                                                onClick={() => handleCreateVisit(p.patient_id)}
                                                className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600"
                                            >
                                                Tiếp đón
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {patients.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="p-4 text-center text-gray-500">
                                            Không tìm thấy dữ liệu
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reception;