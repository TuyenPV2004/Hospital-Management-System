import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Reception = () => {
    // --- STATE QUẢN LÝ DỮ LIỆU ---
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]); // Danh sách bác sĩ
    const [searchTerm, setSearchTerm] = useState('');
    
    // State quản lý Modal & Form Sàng lọc
    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const [showTriageModal, setShowTriageModal] = useState(false);
    const [triageForm, setTriageForm] = useState({
        doctor_id: '',
        chief_complaint: '', // Lý do khám
        pulse: '', temperature: '', blood_pressure: '', respiratory_rate: '', // Chỉ số sinh tồn
        priority: 'NORMAL' // Mức độ ưu tiên
    });

    // State cho Form thêm bệnh nhân mới
    const [newPatient, setNewPatient] = useState({
        full_name: '', dob: '', gender: 'Nam', phone: '', address: '', insurance_card: '',
        cccd: '', email: '', emergency_contact: '', blood_type: '', 
        height: '', weight: '', allergies: '', medical_history: ''
    });

    // --- 1. LOAD DỮ LIỆU ---
    useEffect(() => {
        fetchPatients();
        fetchDoctors();
    }, []);

    const fetchPatients = async (query = '') => {
        try {
            const url = query ? `/patients?search=${query}` : '/patients';
            const res = await api.get(url);
            setPatients(res.data);
        } catch (err) { console.error("Lỗi tải danh sách BN:", err); }
    };

    const fetchDoctors = async () => {
        try {
            // API này sẽ được thêm vào Backend ở bước sau
            const res = await api.get('/users/doctors');
            setDoctors(res.data);
        } catch (err) { console.error("Chưa có API lấy bác sĩ:", err); }
    };

    // --- 2. XỬ LÝ SÀNG LỌC (TRIAGE) ---
    const handleOpenTriage = (patientId) => {
        setSelectedPatientId(patientId);
        setShowTriageModal(true);
        // Reset form triage
        setTriageForm({
            doctor_id: '', chief_complaint: '', 
            pulse: '', temperature: '', blood_pressure: '', respiratory_rate: '', 
            priority: 'NORMAL'
        });
    };

    const handleSubmitTriage = async (e) => {
        e.preventDefault();
        try {
            await api.post('/visits', {
                patient_id: selectedPatientId,
                doctor_id: triageForm.doctor_id || null,
                chief_complaint: triageForm.chief_complaint,
                pulse: triageForm.pulse ? parseInt(triageForm.pulse) : null,
                temperature: triageForm.temperature ? parseFloat(triageForm.temperature) : null,
                blood_pressure: triageForm.blood_pressure,
                respiratory_rate: triageForm.respiratory_rate ? parseInt(triageForm.respiratory_rate) : null,
                priority: triageForm.priority
            });
            alert("✅ Đã tiếp nhận và phân loại bệnh nhân!");
            setShowTriageModal(false);
        } catch (error) {
            alert("❌ Lỗi: " + (error.response?.data?.detail || error.message));
        }
    };

    // --- 3. CÁC HÀM XỬ LÝ KHÁC (Tìm kiếm, Thêm BN) ---
    const handleSearch = (e) => {
        e.preventDefault();
        fetchPatients(searchTerm);
    };

    const handleAddPatient = async (e) => {
        e.preventDefault();
        try {
            await api.post('/patients', newPatient);
            alert("Đã thêm bệnh nhân mới!");
            fetchPatients();
            // Reset form (giản lược)
            setNewPatient({...newPatient, full_name: '', insurance_card: ''}); 
        } catch (err) { alert("Lỗi thêm BN: " + err.message); }
    };

    return (
        <div className="flex h-screen bg-gray-100 p-4 gap-4 relative">
            
            {/* CỘT TRÁI: FORM THÊM BỆNH NHÂN */}
            <div className="w-1/3 bg-white p-4 rounded shadow h-full overflow-y-auto">
                <h2 className="text-xl font-bold text-blue-800 mb-4 border-b pb-2">Thêm Bệnh Nhân</h2>
                <form onSubmit={handleAddPatient} className="space-y-3">
                    <input required className="w-full border p-2 rounded" placeholder="Họ tên (*)" 
                        value={newPatient.full_name} onChange={e=>setNewPatient({...newPatient, full_name: e.target.value})} />
                    <div className="grid grid-cols-2 gap-2">
                        <input type="date" className="border p-2 rounded" 
                            value={newPatient.dob} onChange={e=>setNewPatient({...newPatient, dob: e.target.value})} />
                        <select className="border p-2 rounded" 
                            value={newPatient.gender} onChange={e=>setNewPatient({...newPatient, gender: e.target.value})}>
                            <option value="Nam">Nam</option><option value="Nu">Nữ</option>
                        </select>
                    </div>
                    <input className="w-full border p-2 rounded" placeholder="Số BHYT" 
                        value={newPatient.insurance_card} onChange={e=>setNewPatient({...newPatient, insurance_card: e.target.value})} />
                    <input className="w-full border p-2 rounded" placeholder="SĐT Liên hệ" 
                        value={newPatient.phone} onChange={e=>setNewPatient({...newPatient, phone: e.target.value})} />
                    <textarea className="w-full border p-2 rounded" placeholder="Địa chỉ" 
                        value={newPatient.address} onChange={e=>setNewPatient({...newPatient, address: e.target.value})}></textarea>
                    
                    <h3 className="font-bold text-sm text-gray-500 pt-2">Thông tin y tế (Tùy chọn)</h3>
                    <div className="grid grid-cols-2 gap-2">
                         <input className="border p-2 rounded" placeholder="Chiều cao (cm)" type="number"
                            value={newPatient.height} onChange={e=>setNewPatient({...newPatient, height: e.target.value})} />
                         <input className="border p-2 rounded" placeholder="Cân nặng (kg)" type="number"
                            value={newPatient.weight} onChange={e=>setNewPatient({...newPatient, weight: e.target.value})} />
                    </div>
                    <textarea className="w-full border p-2 rounded border-red-200" placeholder="Tiền sử dị ứng" 
                        value={newPatient.allergies} onChange={e=>setNewPatient({...newPatient, allergies: e.target.value})}></textarea>
                    
                    <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700">
                        + Lưu Hồ Sơ
                    </button>
                </form>
            </div>

            {/* CỘT PHẢI: DANH SÁCH & NÚT TIẾP ĐÓN */}
            <div className="w-2/3 bg-white p-4 rounded shadow h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-700">Tra cứu & Tiếp đón</h2>
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input className="border p-2 rounded w-64" placeholder="Tìm tên hoặc BHYT..." 
                            value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
                        <button className="bg-gray-200 px-4 rounded font-bold">Tìm</button>
                    </form>
                </div>

                <div className="overflow-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="p-3 border">ID</th>
                                <th className="p-3 border">Họ tên</th>
                                <th className="p-3 border">Năm sinh</th>
                                <th className="p-3 border">Giới tính</th>
                                <th className="p-3 border text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patients.map(p => (
                                <tr key={p.patient_id} className="hover:bg-blue-50">
                                    <td className="p-3 border">{p.patient_id}</td>
                                    <td className="p-3 border font-medium">{p.full_name}</td>
                                    <td className="p-3 border">{p.dob ? new Date(p.dob).getFullYear() : ''}</td>
                                    <td className="p-3 border">{p.gender}</td>
                                    <td className="p-3 border text-center">
                                        <button 
                                            onClick={() => handleOpenTriage(p.patient_id)}
                                            className="bg-orange-500 text-white px-4 py-1.5 rounded text-sm font-bold shadow hover:bg-orange-600"
                                        >
                                            Tiếp đón ➜
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL SÀNG LỌC (TRIAGE) --- */}
            {showTriageModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 animate-fadeIn">
                    <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-2xl transform transition-all scale-100">
                        <h2 className="text-2xl font-bold text-blue-800 mb-4 border-b pb-2 flex justify-between">
                            <span>🩺 Sàng Lọc Bệnh Nhân (Triage)</span>
                            <span className="text-sm text-gray-500 font-normal mt-2">BN ID: {selectedPatientId}</span>
                        </h2>
                        
                        <form onSubmit={handleSubmitTriage}>
                            {/* Lý do khám & Ưu tiên */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="col-span-2">
                                    <label className="font-bold text-gray-700">Lý do khám chính (*)</label>
                                    <input required type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                                        placeholder="VD: Đau bụng dữ dội, Sốt cao 3 ngày..."
                                        value={triageForm.chief_complaint}
                                        onChange={e => setTriageForm({...triageForm, chief_complaint: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-gray-700">Mức độ ưu tiên</label>
                                    <select className="w-full border p-2 rounded font-bold"
                                        value={triageForm.priority}
                                        onChange={e => setTriageForm({...triageForm, priority: e.target.value})}
                                        style={{
                                            color: triageForm.priority === 'EMERGENCY' ? 'red' : 
                                                   triageForm.priority === 'HIGH' ? '#d97706' : 'green'
                                        }}
                                    >
                                        <option value="NORMAL" className="text-green-600">🟢 Bình thường</option>
                                        <option value="HIGH" className="text-yellow-600">🟡 Ưu tiên cao</option>
                                        <option value="EMERGENCY" className="text-red-600">🔴 CẤP CỨU</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="font-bold text-gray-700">Chỉ định Bác sĩ</label>
                                    <select className="w-full border p-2 rounded"
                                        value={triageForm.doctor_id}
                                        onChange={e => setTriageForm({...triageForm, doctor_id: e.target.value})}
                                    >
                                        <option value="">-- Bác sĩ trực --</option>
                                        {doctors.map(d => (
                                            <option key={d.user_id} value={d.user_id}>BS. {d.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Chỉ số sinh tồn */}
                            <fieldset className="border p-4 rounded bg-blue-50 mb-6">
                                <legend className="font-bold text-blue-700 bg-blue-100 px-2 rounded text-sm">Chỉ số sinh tồn (Vitals)</legend>
                                <div className="grid grid-cols-4 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-gray-600">Mạch (lần/p)</label>
                                        <input type="number" className="w-full border p-2 rounded bg-white" placeholder="VD: 80"
                                            value={triageForm.pulse} onChange={e => setTriageForm({...triageForm, pulse: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-600">Nhiệt độ (°C)</label>
                                        <input type="number" step="0.1" className="w-full border p-2 rounded bg-white" placeholder="VD: 37.5"
                                            value={triageForm.temperature} onChange={e => setTriageForm({...triageForm, temperature: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-600">Huyết áp</label>
                                        <input type="text" className="w-full border p-2 rounded bg-white" placeholder="120/80"
                                            value={triageForm.blood_pressure} onChange={e => setTriageForm({...triageForm, blood_pressure: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-600">Nhịp thở</label>
                                        <input type="number" className="w-full border p-2 rounded bg-white" placeholder="VD: 20"
                                            value={triageForm.respiratory_rate} onChange={e => setTriageForm({...triageForm, respiratory_rate: e.target.value})} />
                                    </div>
                                </div>
                            </fieldset>

                            <div className="flex justify-end gap-3 pt-2 border-t">
                                <button type="button" onClick={() => setShowTriageModal(false)} 
                                    className="px-5 py-2 bg-gray-300 rounded hover:bg-gray-400 font-medium">
                                    Hủy bỏ
                                </button>
                                <button type="submit" 
                                    className="px-6 py-2 bg-green-600 text-white font-bold rounded shadow hover:bg-green-700 flex items-center gap-2">
                                    <span>✅ Chuyển vào khám</span>
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