// src/pages/DoctorRoom.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ServiceRequestManager from '../components/ServiceRequestManager';

const DoctorRoom = () => {
    // --- STATE ---
    const [waitingList, setWaitingList] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [services, setServices] = useState([]);
    const [selectedVisit, setSelectedVisit] = useState(null);
    const [patientHistory, setPatientHistory] = useState(null); // Chi tiết bệnh nhân (Dị ứng, lịch sử)
    const [billPreview, setBillPreview] = useState(null);
    const [orderedServices, setOrderedServices] = useState([]); // Dịch vụ đã chỉ định của BN hiện tại

    // Form Chẩn đoán (Nâng cấp)
    const [examForm, setExamForm] = useState({
        clinical_symptoms: '',
        diagnosis: '',
        icd10: '',
        advice: '',
        follow_up_date: ''
    });

    // Form Kê đơn (Nâng cấp)
    const [presForm, setPresForm] = useState({
        medicine_id: '',
        quantity: 1,
        dosage_morning: '0',
        dosage_noon: '0',
        dosage_afternoon: '0',
        dosage_evening: '0',
        usage_instruction: 'Uống sau ăn',
        note: ''
    });

    // --- EFFECT ---
    useEffect(() => {
        fetchWaitingList();
        fetchMedicines();
        fetchServices();
    }, []);

    useEffect(() => {
        if (selectedVisit) {
            fetchOrderedServices();
        }
    }, [selectedVisit]);

    // --- API CALLS ---
    const fetchWaitingList = async () => {
        try {
            const res = await api.get('/visits?status=WAITING');
            setWaitingList(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchMedicines = async () => {
        try {
            const res = await api.get('/medicines');
            setMedicines(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchServices = async () => {
        try {
            const res = await api.get('/services');
            setServices(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchOrderedServices = async () => {
        try {
            const res = await api.get(`/visits/${selectedVisit.visit_id}/services`);
            setOrderedServices(res.data);
        } catch (err) { console.error(err); }
    };

    // Khi chọn bệnh nhân
    const handleSelectPatient = async (visit) => {
        setSelectedVisit(visit);
        setBillPreview(null);
        
        // Reset form chẩn đoán với dữ liệu cũ (nếu có)
        setExamForm({
            clinical_symptoms: visit.clinical_symptoms || '',
            diagnosis: visit.diagnosis || '',
            icd10: visit.icd10 || '',
            advice: visit.advice || '',
            follow_up_date: visit.follow_up_date ? visit.follow_up_date.split('T')[0] : ''
        });

        // Lấy chi tiết lịch sử & dị ứng
        try {
            const res = await api.get(`/patients/${visit.patient_id}/history`);
            setPatientHistory(res.data);
        } catch (err) { console.error(err); }
    };

    // --- HANDLERS ---
    
    // 1. Lưu bệnh án
    const handleSaveExam = async () => {
        if (!selectedVisit) return;
        try {
            await api.put(`/visits/${selectedVisit.visit_id}/diagnosis`, examForm);
            alert("✅ Đã lưu hồ sơ bệnh án!");
        } catch (err) { alert("Lỗi lưu hồ sơ"); }
    };

    // 2. Kê đơn thuốc
    const handleAddPrescription = async (e) => {
        e.preventDefault();
        if (!selectedVisit) return;
        try {
            await api.post('/prescriptions', {
                visit_id: selectedVisit.visit_id,
                ...presForm,
                medicine_id: parseInt(presForm.medicine_id),
                quantity: parseInt(presForm.quantity)
            });
            alert("💊 Đã thêm thuốc!");
            updateBillPreview();
            // Reset liều lượng về mặc định
            setPresForm({...presForm, quantity: 1, dosage_morning:'0', dosage_noon:'0', dosage_afternoon:'0', dosage_evening:'0'}); 
        } catch (err) {
            alert("Lỗi: " + (err.response?.data?.detail || "Không thể kê đơn"));
        }
    };

    const updateBillPreview = async () => {
        if (!selectedVisit) return; // Kiểm tra an toàn
        try {
            const res = await api.get(`/visits/${selectedVisit.visit_id}/bill`);
            if (res.data) {
                setBillPreview(res.data);
            }
        } catch (err) { 
            console.error("Lỗi cập nhật giá:", err);
            // Không setBillPreview lỗi để tránh crash giao diện
        }
    };

    const handleFinishVisit = async () => {
        if (!window.confirm("Hoàn tất khám và chuyển thu ngân?")) return;
        try {
            await api.post(`/visits/${selectedVisit.visit_id}/finish`);
            setSelectedVisit(null);
            fetchWaitingList();
        } catch (err) { alert("Lỗi"); }
    };

    // Hàm chỉ định dịch vụ
    const handleOrderService = async (serviceId) => {
        if (!selectedVisit || !serviceId) return;
        try {
            await api.post(`/visits/${selectedVisit.visit_id}/services`, { service_id: parseInt(serviceId), quantity: 1 });
            alert("✅ Đã chỉ định dịch vụ!");
            fetchOrderedServices();
        } catch (err) {
            alert("Lỗi: " + (err.response?.data?.detail || "Không thể chỉ định dịch vụ"));
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* --- CỘT 1: DANH SÁCH CHỜ --- */}
            <div className="w-1/4 bg-white border-r flex flex-col">
                <div className="p-4 bg-blue-800 text-white font-bold flex justify-between items-center">
                    <span>Hàng Đợi Khám</span>
                    <span className="bg-blue-600 px-2 rounded text-sm">{waitingList.length}</span>
                </div>
                <ul className="overflow-y-auto flex-1">
                    {waitingList.map(visit => (
                        <li key={visit.visit_id} onClick={() => handleSelectPatient(visit)}
                            className={`p-4 border-b cursor-pointer hover:bg-blue-50 transition-colors ${selectedVisit?.visit_id === visit.visit_id ? 'bg-blue-100 border-l-4 border-blue-600' : ''}`}
                        >
                            <div className="flex justify-between font-bold text-gray-800">
                                <span>ID: {visit.patient_id}</span>
                                {visit.priority === 'EMERGENCY' && <span className="text-red-600 animate-pulse">🆘 CẤP CỨU</span>}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">Lý do: {visit.chief_complaint || 'Không rõ'}</div>
                            <div className="text-xs text-gray-400 mt-1">{new Date(visit.visit_date).toLocaleTimeString()}</div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* --- KHU VỰC LÀM VIỆC --- */}
            {selectedVisit ? (
                <div className="flex w-3/4 overflow-hidden">
                    
                    {/* --- CỘT 2: KHÁM BỆNH --- */}
                    <div className="w-1/2 p-6 overflow-y-auto border-r bg-white">
                        {/* 1. Thông tin Sàng lọc & Dị ứng */}
                        <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
                            <h2 className="text-xl font-bold text-blue-800 mb-2">
                                {patientHistory?.full_name} ({patientHistory && (new Date().getFullYear() - new Date(patientHistory.dob).getFullYear())}T)
                            </h2>
                            
                            {patientHistory?.allergies && (
                                <div className="bg-red-100 text-red-700 p-2 rounded font-bold mb-2 border-l-4 border-red-500">
                                    ⚠️ DỊ ỨNG: {patientHistory.allergies}
                                </div>
                            )}

                            <div className="grid grid-cols-4 gap-2 text-sm bg-white p-3 rounded shadow-sm">
                                <div className="text-center">
                                    <span className="block text-gray-500 text-xs">Mạch</span>
                                    <span className="font-bold text-lg">{selectedVisit.pulse || '-'}</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-gray-500 text-xs">Nhiệt độ</span>
                                    <span className={`font-bold text-lg ${selectedVisit.temperature > 37.5 ? 'text-red-500' : ''}`}>
                                        {selectedVisit.temperature || '-'}°C
                                    </span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-gray-500 text-xs">Huyết áp</span>
                                    <span className="font-bold text-lg">{selectedVisit.blood_pressure || '-'}</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-gray-500 text-xs">SpO2/Nhịp thở</span>
                                    <span className="font-bold text-lg">{selectedVisit.respiratory_rate || '-'}</span>
                                </div>
                            </div>
                            <div className="mt-2 text-sm">
                                <strong>Lý do khám:</strong> {selectedVisit.chief_complaint}
                            </div>
                        </div>

                        {/* 2. Form Bệnh Án */}
                        <div className="space-y-4">
                            <div>
                                <label className="font-bold text-gray-700 block mb-1">Triệu chứng lâm sàng (Khám thấy):</label>
                                <textarea className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" rows="3"
                                    placeholder="VD: Phổi có tiếng rale ẩm, họng đỏ..."
                                    value={examForm.clinical_symptoms} onChange={e => setExamForm({...examForm, clinical_symptoms: e.target.value})}
                                ></textarea>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="col-span-2">
                                    <label className="font-bold text-gray-700 block mb-1">Chẩn đoán (*):</label>
                                    <input type="text" className="w-full border p-2 rounded font-bold text-blue-900"
                                        placeholder="VD: Viêm phế quản cấp"
                                        value={examForm.diagnosis} onChange={e => setExamForm({...examForm, diagnosis: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-gray-700 block mb-1">Mã ICD-10:</label>
                                    <input type="text" className="w-full border p-2 rounded text-center uppercase"
                                        placeholder="J20"
                                        value={examForm.icd10} onChange={e => setExamForm({...examForm, icd10: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="font-bold text-gray-700 block mb-1">Lời dặn & Hẹn tái khám:</label>
                                <div className="flex gap-2">
                                    <input type="text" className="flex-1 border p-2 rounded" placeholder="Lời dặn..."
                                        value={examForm.advice} onChange={e => setExamForm({...examForm, advice: e.target.value})} />
                                    <input type="date" className="border p-2 rounded"
                                        value={examForm.follow_up_date} onChange={e => setExamForm({...examForm, follow_up_date: e.target.value})} />
                                </div>
                            </div>
                            
                            <button onClick={handleSaveExam} className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 shadow">
                                💾 LƯU BỆNH ÁN
                            </button>
                        </div>
                        
                        <div className="mt-8 pt-4 border-t">
                             <button onClick={handleFinishVisit} className="w-full bg-green-600 text-white py-3 rounded font-bold text-lg hover:bg-green-700 shadow-lg">
                                ✓ KẾT THÚC KHÁM
                            </button>
                        </div>
                    </div>

                    {/* --- CỘT 3: KÊ ĐƠN THUỐC --- */}
                    <div className="w-1/2 p-6 bg-gray-50 overflow-y-auto">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            💊 Đơn Thuốc Điện Tử
                        </h2>
                        
                        <form onSubmit={handleAddPrescription} className="bg-white p-5 rounded shadow-lg border border-gray-200 mb-6">
                            {/* Chọn thuốc */}
                            <div className="mb-3">
                                <label className="text-xs font-bold text-gray-500 uppercase">1. Chọn thuốc</label>
                                <select className="w-full border p-2 rounded font-medium"
                                    value={presForm.medicine_id} onChange={e => setPresForm({...presForm, medicine_id: e.target.value})} required
                                >
                                    <option value="">-- Tìm tên thuốc / hoạt chất --</option>
                                    {medicines.map(med => (
                                        <option key={med.medicine_id} value={med.medicine_id} disabled={med.stock_quantity <= 0}>
                                            {med.name} ({med.active_ingredient}) - Còn: {med.stock_quantity} {med.unit}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Liều dùng chi tiết */}
                            <div className="mb-3">
                                <label className="text-xs font-bold text-gray-500 uppercase">2. Liều dùng (Sáng - Trưa - Chiều - Tối)</label>
                                <div className="grid grid-cols-4 gap-2 mt-1">
                                    <input type="text" placeholder="Sáng" className="border p-2 rounded text-center"
                                        value={presForm.dosage_morning} onChange={e => setPresForm({...presForm, dosage_morning: e.target.value})} />
                                    <input type="text" placeholder="Trưa" className="border p-2 rounded text-center"
                                        value={presForm.dosage_noon} onChange={e => setPresForm({...presForm, dosage_noon: e.target.value})} />
                                    <input type="text" placeholder="Chiều" className="border p-2 rounded text-center"
                                        value={presForm.dosage_afternoon} onChange={e => setPresForm({...presForm, dosage_afternoon: e.target.value})} />
                                    <input type="text" placeholder="Tối" className="border p-2 rounded text-center"
                                        value={presForm.dosage_evening} onChange={e => setPresForm({...presForm, dosage_evening: e.target.value})} />
                                </div>
                            </div>

                            {/* Số lượng & Cách dùng */}
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Tổng SL</label>
                                    <input type="number" min="1" className="w-full border p-2 rounded font-bold text-blue-600"
                                        value={presForm.quantity} onChange={e => setPresForm({...presForm, quantity: e.target.value})} required />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Cách dùng</label>
                                    <input type="text" list="usage-suggestions" className="w-full border p-2 rounded"
                                        value={presForm.usage_instruction} onChange={e => setPresForm({...presForm, usage_instruction: e.target.value})} />
                                    <datalist id="usage-suggestions">
                                        <option value="Uống sau ăn" />
                                        <option value="Uống trước ăn" />
                                        <option value="Uống khi đau" />
                                    </datalist>
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-orange-500 text-white py-2 rounded font-bold hover:bg-orange-600 shadow">
                                + THÊM VÀO ĐƠN
                            </button>
                        </form>

                        {/* Danh sách thuốc đã kê (Hóa đơn tạm) */}
                        <div className="bg-white p-4 rounded shadow border border-blue-200">
                            <h3 className="font-bold text-gray-700 border-b pb-2 mb-2 flex justify-between">
                                <span>Đơn thuốc hiện tại</span>
                                <button onClick={updateBillPreview} className="text-xs text-blue-500 underline">Cập nhật giá</button>
                            </h3>
                            {billPreview ? (
                                <div>
                                    <div className="text-sm space-y-2 max-h-40 overflow-y-auto">
                                        <p className="italic text-gray-500 text-xs">
                                            Tổng tiền thuốc tạm tính: {billPreview.medicine_total?.toLocaleString() || 0} đ
                                        </p>
                                    </div>
                                    <div className="border-t pt-2 mt-2 text-right text-xl font-bold text-red-600">
                                        Tổng: {billPreview.sub_total?.toLocaleString() || 0} đ
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm italic text-center py-4">Chưa có thuốc...</p>
                            )}
                        </div>

                        {/* --- KHU VỰC CHỈ ĐỊNH CẬN LÂM SÀNG --- */}
                        <div className="mt-6 border-t pt-4">
                            <h3 className="font-bold text-lg text-gray-800 mb-3 flex items-center gap-2">
                                🔬 Chỉ định Cận Lâm Sàng
                            </h3>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2 text-gray-700">Chọn dịch vụ để chỉ định:</label>
                                <select className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" 
                                    onChange={(e) => handleOrderService(e.target.value)}>
                                    <option value="">-- Chọn dịch vụ --</option>
                                    {services.map(s => (
                                        <option key={s.service_id} value={s.service_id}>
                                            {s.name} - {s.price?.toLocaleString() || '0'} đ
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Sử dụng ServiceRequestManager cho phép Sửa/Hủy chỉ định */}
                            <ServiceRequestManager 
                                requests={orderedServices} 
                                onRefresh={fetchOrderedServices} 
                            />
                            
                            {/* Hiển thị kết quả chi tiết (nếu có) */}
                            {orderedServices.filter(req => req.result).length > 0 && (
                                <div className="mt-4 bg-blue-50 rounded border border-blue-200 p-3">
                                    <h4 className="font-bold text-blue-800 mb-2">Kết quả đã có:</h4>
                                    <div className="space-y-2">
                                        {orderedServices.filter(req => req.result).map(req => (
                                            <div key={req.request_id} className="bg-white p-2 rounded border">
                                                <p className="font-medium text-gray-700">{req.service_name}</p>
                                                <p className="text-sm font-bold text-blue-600 mt-1">{req.result.conclusion}</p>
                                                <p className="text-xs text-gray-600 line-clamp-2">{req.result.result_data}</p>
                                                {req.result.image_url && (
                                                    <a href={req.result.image_url} target="_blank" rel="noreferrer" 
                                                       className="text-blue-500 underline text-xs block mt-1">📷 Xem ảnh</a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="w-3/4 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                    <div className="text-6xl mb-4">🩺</div>
                    <p className="text-xl">Chọn bệnh nhân từ hàng đợi để bắt đầu khám</p>
                </div>
            )}
        </div>
    );
};

export default DoctorRoom;