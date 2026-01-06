// src/pages/DoctorRoom.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';

const DoctorRoom = () => {
    // State quản lý dữ liệu
    const [waitingList, setWaitingList] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [selectedVisit, setSelectedVisit] = useState(null);
    
    // State cho form nghiệp vụ
    const [diagnosis, setDiagnosis] = useState('');
    const [prescriptionForm, setPrescriptionForm] = useState({
        medicine_id: '',
        quantity: 1,
        note: ''
    });
    const [billPreview, setBillPreview] = useState(null);

    // 1. Load dữ liệu ban đầu
    useEffect(() => {
        fetchWaitingList();
        fetchMedicines();
    }, []);

    const fetchWaitingList = async () => {
        try {
            // Chỉ lấy danh sách đang chờ (WAITING)
            const res = await api.get('/visits?status=WAITING');
            setWaitingList(res.data);
        } catch (err) {
            console.error("Lỗi tải hàng đợi:", err);
        }
    };

    const fetchMedicines = async () => {
        try {
            const res = await api.get('/medicines');
            setMedicines(res.data);
        } catch (err) { console.error(err); }
    };

    // 2. Chọn bệnh nhân để khám
    const handleSelectPatient = (visit) => {
        setSelectedVisit(visit);
        setDiagnosis(visit.diagnosis || ''); // Load chẩn đoán cũ nếu có
        setBillPreview(null); // Reset hóa đơn tạm
    };

    // 3. Lưu chẩn đoán (Cập nhật bệnh án)
    const handleSaveDiagnosis = async () => {
        if (!selectedVisit) return;
        try {
            await api.put(`/visits/${selectedVisit.visit_id}/diagnosis`, {
                diagnosis: diagnosis
            });
            alert("Đã lưu chẩn đoán!");
        } catch (err) {
            alert("Lỗi lưu chẩn đoán");
        }
    };

    // 4. Kê đơn thuốc (Thêm thuốc)
    const handleAddPrescription = async (e) => {
        e.preventDefault();
        if (!selectedVisit) return;

        try {
            await api.post('/prescriptions', {
                visit_id: selectedVisit.visit_id,
                medicine_id: parseInt(prescriptionForm.medicine_id),
                quantity: parseInt(prescriptionForm.quantity),
                note: prescriptionForm.note
            });
            alert("Đã kê thuốc thành công!");
            // Cập nhật lại xem trước hóa đơn để thấy tiền tăng lên
            updateBillPreview(); 
        } catch (err) {
            alert("Lỗi: " + (err.response?.data?.detail || "Không thể kê đơn"));
        }
    };

    // Hàm phụ: Xem trước tiền thuốc
    const updateBillPreview = async () => {
        if (!selectedVisit) return;
        try {
            const res = await api.get(`/visits/${selectedVisit.visit_id}/bill`);
            setBillPreview(res.data);
        } catch (err) { console.error(err); }
    };

    // 5. Kết thúc khám
    const handleFinishVisit = async () => {
        if (!window.confirm("Hoàn tất khám cho bệnh nhân này?")) return;
        try {
            await api.post(`/visits/${selectedVisit.visit_id}/finish`);
            alert("Đã chuyển bệnh nhân sang thanh toán.");
            setSelectedVisit(null); // Xóa màn hình làm việc
            fetchWaitingList(); // Load lại hàng đợi mới
        } catch (err) {
            alert("Lỗi kết thúc khám");
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* --- CỘT 1: DANH SÁCH CHỜ (25%) --- */}
            <div className="w-1/4 bg-white border-r overflow-y-auto">
                <div className="p-4 bg-blue-600 text-white font-bold">
                    Danh Sách Chờ ({waitingList.length})
                </div>
                <ul>
                    {waitingList.map(visit => (
                        <li 
                            key={visit.visit_id}
                            onClick={() => handleSelectPatient(visit)}
                            className={`p-4 border-b cursor-pointer hover:bg-blue-50 ${selectedVisit?.visit_id === visit.visit_id ? 'bg-blue-100' : ''}`}
                        >
                            <div className="font-bold">ID: {visit.patient_id}</div>
                            <div className="text-sm text-gray-500">{new Date(visit.visit_date).toLocaleString()}</div>
                            <span className="text-xs bg-yellow-200 px-2 rounded">WAITING</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* --- KHU VỰC LÀM VIỆC (75%) --- */}
            {selectedVisit ? (
                <div className="flex w-3/4">
                    {/* --- CỘT 2: KHÁM BỆNH & CHẨN ĐOÁN --- */}
                    <div className="w-1/2 p-6 border-r bg-white">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Thông tin bệnh án</h2>
                        <div className="mb-4 p-3 bg-gray-50 rounded">
                            <p><strong>Mã lượt khám:</strong> {selectedVisit.visit_id}</p>
                            <p><strong>Mã bệnh nhân:</strong> {selectedVisit.patient_id}</p>
                        </div>
                        
                        <div className="mb-6">
                            <label className="block font-bold mb-2">Chẩn đoán / Triệu chứng:</label>
                            <textarea 
                                className="w-full h-32 p-3 border rounded focus:ring-2 focus:ring-blue-500"
                                placeholder="Nhập kết quả khám..."
                                value={diagnosis}
                                onChange={(e) => setDiagnosis(e.target.value)}
                            ></textarea>
                            <button 
                                onClick={handleSaveDiagnosis}
                                className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                Lưu Chẩn Đoán
                            </button>
                        </div>

                        <div className="mt-10 pt-4 border-t">
                             <button 
                                onClick={handleFinishVisit}
                                className="w-full bg-green-600 text-white py-3 rounded font-bold text-lg hover:bg-green-700 shadow"
                            >
                                ✓ KẾT THÚC KHÁM
                            </button>
                        </div>
                    </div>

                    {/* --- CỘT 3: KÊ ĐƠN THUỐC --- */}
                    <div className="w-1/2 p-6 bg-gray-50">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Kê Đơn Thuốc</h2>
                        
                        <form onSubmit={handleAddPrescription} className="bg-white p-4 rounded shadow mb-6">
                            <div className="mb-3">
                                <label className="block text-sm font-bold mb-1">Chọn thuốc (Tồn kho):</label>
                                <select 
                                    className="w-full border p-2 rounded"
                                    onChange={e => setPrescriptionForm({...prescriptionForm, medicine_id: e.target.value})}
                                    required
                                >
                                    <option value="">-- Chọn thuốc --</option>
                                    {medicines.map(med => (
                                        <option key={med.medicine_id} value={med.medicine_id}>
                                            {med.name} (Còn: {med.stock_quantity} {med.unit}) - {med.price}đ
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2 mb-3">
                                <input 
                                    type="number" min="1" placeholder="SL"
                                    className="w-20 border p-2 rounded"
                                    value={prescriptionForm.quantity}
                                    onChange={e => setPrescriptionForm({...prescriptionForm, quantity: e.target.value})}
                                    required
                                />
                                <input 
                                    type="text" placeholder="Cách dùng (Sáng 1, Tối 1...)"
                                    className="flex-1 border p-2 rounded"
                                    value={prescriptionForm.note}
                                    onChange={e => setPrescriptionForm({...prescriptionForm, note: e.target.value})}
                                />
                            </div>
                            <button type="submit" className="w-full bg-orange-500 text-white py-2 rounded font-bold hover:bg-orange-600">
                                + Thêm thuốc
                            </button>
                        </form>

                        {/* Preview Hóa đơn tạm tính */}
                        <div className="bg-white p-4 rounded shadow border border-blue-200">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-gray-700">Hóa đơn tạm tính</h3>
                                <button onClick={updateBillPreview} className="text-xs text-blue-500 underline">Cập nhật</button>
                            </div>
                            {billPreview ? (
                                <div className="space-y-1 text-sm">
                                    <p>Tiền thuốc: <span className="font-bold">{billPreview.medicine_cost.toLocaleString()} đ</span></p>
                                    <p>Tiền khám: <span className="font-bold">{billPreview.exam_fee.toLocaleString()} đ</span></p>
                                    <div className="border-t pt-2 mt-2 text-lg font-bold text-red-600">
                                        Tổng: {billPreview.total.toLocaleString()} đ
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm italic">Chưa có dữ liệu thanh toán...</p>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="w-3/4 flex items-center justify-center text-gray-400 italic">
                    Chọn một bệnh nhân từ danh sách chờ để bắt đầu khám.
                </div>
            )}
        </div>
    );
};

export default DoctorRoom;