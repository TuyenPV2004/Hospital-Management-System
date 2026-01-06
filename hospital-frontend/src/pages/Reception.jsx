// src/pages/Reception.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Reception = () => {
    // --- STATE QUẢN LÝ DỮ LIỆU ---
    const [patients, setPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [doctors, setDoctors] = useState([]); // Danh sách bác sĩ
    const [selectedPatientId, setSelectedPatientId] = useState(null); // ID bệnh nhân đang được sàng lọc
    const [showTriageModal, setShowTriageModal] = useState(false); // Ẩn/Hiện Modal

    // State cho form thêm mới bệnh nhân (Giữ nguyên các trường chi tiết)
    const [newPatient, setNewPatient] = useState({
        full_name: '',
        dob: '',
        gender: 'Nam',
        phone: '',
        address: '',
        insurance_card: '',
        cccd: '', 
        email: '', 
        emergency_contact: '', 
        blood_type: '', 
        height: '', 
        weight: '', 
        allergies: '', 
        medical_history: ''
    });

    // State cho Form Sàng lọc (Triage - Mới)
    const [triageForm, setTriageForm] = useState({
        doctor_id: '',
        chief_complaint: '',
        pulse: '',
        temperature: '',
        blood_pressure: '',
        respiratory_rate: '',
        priority: 'NORMAL'
    });

    // --- EFFECTS ---
    useEffect(() => {
        fetchPatients();
        fetchDoctors(); // Load danh sách bác sĩ ngay khi vào trang
    }, []);

    // --- API CALLS ---
    const fetchPatients = async (query = '') => {
        try {
            const url = query ? `/patients?search=${query}` : '/patients';
            const response = await api.get(url);
            setPatients(response.data);
        } catch (error) {
            console.error("Lỗi tải danh sách bệnh nhân:", error);
        }
    };

    const fetchDoctors = async () => {
        try {
            const res = await api.get('/users/doctors');
            setDoctors(res.data);
        } catch (err) { console.error("Lỗi tải danh sách bác sĩ:", err); }
    };

    // --- HANDLERS ---
    
    // 1. Tìm kiếm
    const handleSearch = (e) => {
        e.preventDefault();
        fetchPatients(searchTerm);
    };

    // 2. Thêm bệnh nhân mới
    const handleAddPatient = async (e) => {
        e.preventDefault();
        try {
            await api.post('/patients', newPatient);
            alert("Thêm bệnh nhân thành công!");
            // Reset form
            setNewPatient({
                full_name: '', dob: '', gender: 'Nam', phone: '', address: '', insurance_card: '',
                cccd: '', email: '', emergency_contact: '', blood_type: '', height: '', weight: '', allergies: '', medical_history: ''
            });
            fetchPatients();
        } catch (error) {
            alert("Lỗi: " + (error.response?.data?.detail || "Không thể thêm"));
        }
    };

    // 3. Mở Modal Sàng lọc (Thay thế nút Tiếp đón cũ)
    const handleOpenTriage = (patientId) => {
        setSelectedPatientId(patientId);
        setShowTriageModal(true);
        // Reset form triage
        setTriageForm({
            doctor_id: '', 
            chief_complaint: '', 
            pulse: '', 
            temperature: '',
            blood_pressure: '', 
            respiratory_rate: '', 
            priority: 'NORMAL'
        });
    };

    // 4. Gửi dữ liệu Sàng lọc lên Server (Tạo lượt khám)
    const handleSubmitTriage = async (e) => {
        e.preventDefault();
        try {
            await api.post('/visits', {
                patient_id: selectedPatientId,
                doctor_id: triageForm.doctor_id || null, // Nếu rỗng thì gửi null
                chief_complaint: triageForm.chief_complaint,
                pulse: triageForm.pulse || null,
                temperature: triageForm.temperature || null,
                blood_pressure: triageForm.blood_pressure || null,
                respiratory_rate: triageForm.respiratory_rate || null,
                priority: triageForm.priority
            });
            alert("Đã phân loại và chuyển bệnh nhân vào hàng đợi!");
            setShowTriageModal(false);
        } catch (error) {
            alert("Lỗi: " + (error.response?.data?.detail || error.message));
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen relative">
            <h1 className="text-3xl font-bold text-blue-700 mb-6">Khu Vực Tiếp Đón & Sàng Lọc</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* --- CỘT TRÁI: FORM THÊM BỆNH NHÂN (Giữ nguyên form chi tiết) --- */}
                <div className="md:col-span-1 bg-white p-4 rounded shadow h-fit">
                    <h2 className="text-xl font-bold mb-4 text-gray-700">Thêm Bệnh Nhân Mới</h2>
                    <form onSubmit={handleAddPatient} className="space-y-3">
                        <h3 className="font-bold text-blue-600 border-b text-sm uppercase mt-2">1. Hành chính</h3>
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
                        <div className="grid grid-cols-2 gap-2">
                            <input type="text" placeholder="Số CCCD" className="border p-2 rounded"
                                value={newPatient.cccd} onChange={e => setNewPatient({...newPatient, cccd: e.target.value})} />
                            <input type="text" placeholder="Số BHYT" className="border p-2 rounded"
                                value={newPatient.insurance_card} onChange={e => setNewPatient({...newPatient, insurance_card: e.target.value})} />
                        </div>
                        <input type="text" placeholder="Người thân (Tên - SĐT)" className="w-full border p-2 rounded"
                            value={newPatient.emergency_contact} onChange={e => setNewPatient({...newPatient, emergency_contact: e.target.value})} />

                        <h3 className="font-bold text-red-600 border-b text-sm uppercase mt-4">2. Y tế & Thể trạng</h3>
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
                            + Lưu Hồ Sơ
                        </button>
                    </form>
                </div>

                {/* --- CỘT PHẢI: DANH SÁCH & TÌM KIẾM --- */}
                <div className="md:col-span-2 bg-white p-4 rounded shadow h-fit">
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
                                        <td className="p-3 border font-medium text-blue-900">{p.full_name}</td>
                                        <td className="p-3 border">{p.dob}</td>
                                        <td className="p-3 border">{p.gender}</td>
                                        <td className="p-3 border text-center">
                                            {/* Nút này giờ sẽ mở Modal Sàng lọc */}
                                            <button 
                                                onClick={() => handleOpenTriage(p.patient_id)}
                                                className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600 font-bold shadow"
                                            >
                                                Tiếp đón & Sàng lọc
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

            {/* --- MODAL SÀNG LỌC (TRIAGE) --- */}
            {showTriageModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity">
                    <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-2xl transform transition-all scale-100">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h2 className="text-2xl font-bold text-blue-800">
                                🩺 Sàng Lọc Bệnh Nhân (Triage)
                            </h2>
                            <button onClick={() => setShowTriageModal(false)} className="text-gray-500 hover:text-red-500 font-bold text-xl">&times;</button>
                        </div>
                        
                        <form onSubmit={handleSubmitTriage}>
                            {/* Lý do khám & Ưu tiên */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="col-span-2">
                                    <label className="font-bold text-gray-700">Lý do khám (*):</label>
                                    <input required type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="VD: Đau bụng dữ dội, Sốt cao, Tai nạn..."
                                        value={triageForm.chief_complaint}
                                        onChange={e => setTriageForm({...triageForm, chief_complaint: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-gray-700">Mức độ ưu tiên:</label>
                                    <select className="w-full border p-2 rounded font-bold focus:ring-2 focus:ring-blue-500"
                                        value={triageForm.priority}
                                        onChange={e => setTriageForm({...triageForm, priority: e.target.value})}
                                        style={{
                                            color: triageForm.priority === 'EMERGENCY' ? 'red' : 
                                                   triageForm.priority === 'HIGH' ? '#d97706' : 'black',
                                            borderColor: triageForm.priority === 'EMERGENCY' ? 'red' : '#e5e7eb'
                                        }}
                                    >
                                        <option value="NORMAL">🟢 Bình thường</option>
                                        <option value="HIGH">🟡 Ưu tiên cao (Trẻ em/Người già)</option>
                                        <option value="EMERGENCY" className="text-red-600 font-bold">🔴 CẤP CỨU</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="font-bold text-gray-700">Chỉ định Bác sĩ:</label>
                                    <select className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                                        value={triageForm.doctor_id}
                                        onChange={e => setTriageForm({...triageForm, doctor_id: e.target.value})}
                                    >
                                        <option value="">-- Chọn bác sĩ (Tùy chọn) --</option>
                                        {doctors.map(d => (
                                            <option key={d.user_id} value={d.user_id}>{d.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Chỉ số sinh tồn */}
                            <fieldset className="border p-4 rounded bg-blue-50 mb-6">
                                <legend className="font-bold text-blue-700 px-2 bg-blue-50 rounded">Chỉ số sinh tồn (Vitals)</legend>
                                <div className="grid grid-cols-4 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-600">Mạch (lần/p)</label>
                                        <input type="number" className="w-full border p-2 rounded text-center"
                                            value={triageForm.pulse} onChange={e => setTriageForm({...triageForm, pulse: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-600">Nhiệt độ (°C)</label>
                                        <input type="number" step="0.1" className="w-full border p-2 rounded text-center"
                                            value={triageForm.temperature} onChange={e => setTriageForm({...triageForm, temperature: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-600">Huyết áp</label>
                                        <input type="text" placeholder="120/80" className="w-full border p-2 rounded text-center"
                                            value={triageForm.blood_pressure} onChange={e => setTriageForm({...triageForm, blood_pressure: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-600">Nhịp thở</label>
                                        <input type="number" className="w-full border p-2 rounded text-center"
                                            value={triageForm.respiratory_rate} onChange={e => setTriageForm({...triageForm, respiratory_rate: e.target.value})} />
                                    </div>
                                </div>
                            </fieldset>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button type="button" onClick={() => setShowTriageModal(false)} className="px-5 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 font-medium">
                                    Hủy bỏ
                                </button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 shadow-lg transform hover:scale-105 transition-transform">
                                    Xác nhận & Chuyển
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reception;