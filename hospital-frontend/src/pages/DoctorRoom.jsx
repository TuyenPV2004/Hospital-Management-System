import React, { useState, useEffect } from 'react';
import api from '../services/api';

const DoctorRoom = () => {
    // --- STATE QUẢN LÝ DỮ LIỆU ---
    const [waitingList, setWaitingList] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [selectedVisit, setSelectedVisit] = useState(null);
    
    // (MỚI) State lưu chi tiết lịch sử bệnh nhân
    const [patientHistory, setPatientHistory] = useState(null);

    // --- STATE FORM NGHIỆP VỤ ---
    const [diagnosis, setDiagnosis] = useState('');
    const [prescriptionForm, setPrescriptionForm] = useState({
        medicine_id: '',
        quantity: 1,
        note: ''
    });
    // Giỏ hàng thuốc tạm thời
    const [tempPrescriptions, setTempPrescriptions] = useState([]); 
    const [billPreview, setBillPreview] = useState(null);

    // 1. Load dữ liệu ban đầu
    useEffect(() => {
        fetchWaitingList();
        fetchMedicines();
    }, []);

    const fetchWaitingList = async () => {
        try {
            const res = await api.get('/visits?status=WAITING');
            setWaitingList(res.data);
        } catch (err) { console.error("Lỗi tải hàng đợi:", err); }
    };

    const fetchMedicines = async () => {
        try {
            const res = await api.get('/medicines');
            setMedicines(res.data);
        } catch (err) { console.error(err); }
    };

    // --- (CẬP NHẬT) HÀM CHỌN BỆNH NHÂN ---
    const handleSelectPatient = async (visit) => {
        setSelectedVisit(visit);
        setDiagnosis(visit.diagnosis || '');
        setBillPreview(null);
        setTempPrescriptions([]);
        setPatientHistory(null); // Reset lịch sử cũ để hiện loading
        
        // GỌI API MỚI: Lấy chi tiết lịch sử
        try {
            // Lưu ý: Cần thêm API này ở Backend main.py
            const res = await api.get(`/patients/${visit.patient_id}/history`);
            setPatientHistory(res.data);
        } catch (err) {
            console.error("Lỗi tải lịch sử bệnh nhân", err);
        }
    };

    // 3. Thêm thuốc vào danh sách tạm
    const handleAddDrug = (e) => {
        e.preventDefault();
        const med = medicines.find(m => m.medicine_id === parseInt(prescriptionForm.medicine_id));
        if (!med) return;

        const newItem = {
            ...prescriptionForm,
            medicine_name: med.name,
            price: med.price,
            medicine_id: parseInt(prescriptionForm.medicine_id)
        };
        setTempPrescriptions([...tempPrescriptions, newItem]);
    };

    // 4. Xử lý Hoàn tất khám
    const handleFinishExam = async () => {
        if (!selectedVisit) return;
        try {
            // Bước 1: Cập nhật chẩn đoán
            await api.put(`/visits/${selectedVisit.visit_id}/diagnosis`, { diagnosis });

            // Bước 2: Gửi từng đơn thuốc lên Server
            for (const item of tempPrescriptions) {
                await api.post('/prescriptions', {
                    visit_id: selectedVisit.visit_id,
                    medicine_id: item.medicine_id,
                    quantity: item.quantity,
                    note: item.note
                });
            }

            // Bước 3: Kết thúc khám
            await api.post(`/visits/${selectedVisit.visit_id}/finish`);

            alert("Đã hoàn tất khám bệnh!");
            
            // Reset form
            setSelectedVisit(null);
            setPatientHistory(null);
            setTempPrescriptions([]);
            fetchWaitingList(); // Load lại danh sách chờ
        } catch (err) {
            alert("Lỗi: " + (err.response?.data?.detail || err.message));
        }
    };

    // Tính tạm tính hóa đơn
    const updateBillPreview = () => {
        const totalMed = tempPrescriptions.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const examFee = 50000;
        setBillPreview({
            medicine_cost: totalMed,
            exam_fee: examFee,
            total: totalMed + examFee
        });
    };

    return (
        <div className="flex h-screen bg-gray-100 p-4 gap-4">
            {/* --- CỘT 1: DANH SÁCH CHỜ --- */}
            <div className="w-1/4 bg-white rounded shadow p-4 overflow-y-auto">
                <h2 className="text-xl font-bold text-blue-800 mb-4 border-b pb-2">Hàng Đợi Khám</h2>
                <div className="space-y-2">
                    {waitingList.map(visit => (
                        <div 
                            key={visit.visit_id}
                            onClick={() => handleSelectPatient(visit)}
                            className={`p-3 border rounded cursor-pointer hover:bg-blue-50 transition 
                                ${selectedVisit?.visit_id === visit.visit_id ? 'bg-blue-100 border-blue-500 shadow-inner' : ''}`}
                        >
                            <div className="font-bold text-gray-700">BN #{visit.patient_id}</div>
                            <div className="text-sm text-gray-500">{new Date(visit.visit_date).toLocaleString()}</div>
                            <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full mt-1 inline-block">
                                {visit.status}
                            </span>
                        </div>
                    ))}
                    {waitingList.length === 0 && <p className="text-center text-gray-400 mt-10">Không có bệnh nhân chờ</p>}
                </div>
            </div>

            {/* --- CỘT 2: KHÁM BỆNH & LỊCH SỬ (ĐÃ CẬP NHẬT GIAO DIỆN) --- */}
            {selectedVisit ? (
                <div className="w-2/4 bg-white rounded shadow flex flex-col h-full">
                    {/* 2.1 THÔNG TIN BỆNH NHÂN & LỊCH SỬ */}
                    <div className="p-4 border-b bg-gray-50 overflow-y-auto h-1/2">
                        {patientHistory ? (
                            <>
                                {/* CẢNH BÁO DỊ ỨNG */}
                                {patientHistory.allergies && (
                                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-3 text-sm animate-pulse" role="alert">
                                        <p className="font-bold">⚠️ CẢNH BÁO DỊ ỨNG:</p>
                                        <p>{patientHistory.allergies}</p>
                                    </div>
                                )}

                                <div className="flex justify-between items-center mb-2">
                                    <h2 className="text-2xl font-bold text-gray-800">{patientHistory.full_name}</h2>
                                    <span className="text-sm bg-blue-600 text-white px-2 rounded">BHYT: {patientHistory.insurance_card}</span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm bg-white p-3 rounded border mb-4">
                                    <div><span className="font-bold">Tuổi:</span> {new Date().getFullYear() - new Date(patientHistory.dob).getFullYear()}</div>
                                    <div><span className="font-bold">Giới tính:</span> {patientHistory.gender}</div>
                                    <div><span className="font-bold">BMI:</span> {patientHistory.height && patientHistory.weight ? 
                                        <span className="font-bold text-blue-600 ml-1">
                                            {(patientHistory.weight / ((patientHistory.height/100)**2)).toFixed(1)}
                                        </span> : 'N/A'}
                                    </div>
                                    <div><span className="font-bold">Nhóm máu:</span> {patientHistory.blood_type || 'Unknown'}</div>
                                    <div className="col-span-2 text-red-600"><span className="font-bold text-gray-700">Bệnh nền:</span> {patientHistory.medical_history || 'Không'}</div>
                                </div>

                                {/* LỊCH SỬ KHÁM */}
                                <div>
                                    <h3 className="font-bold text-gray-700 border-b mb-2 text-sm">🔻 Lịch sử khám chữa bệnh</h3>
                                    <div className="max-h-32 overflow-y-auto space-y-2 pr-1">
                                        {patientHistory.visits?.map(v => (
                                            <div key={v.visit_id} className="text-xs border-b pb-1">
                                                <div className="flex justify-between">
                                                    <span className="font-bold">{new Date(v.visit_date).toLocaleDateString()}</span>
                                                    <span className={`px-1 rounded text-white ${v.status === 'PAID' ? 'bg-green-500' : 'bg-gray-400'}`}>{v.status}</span>
                                                </div>
                                                <p className="text-gray-600 truncate italic">Dx: {v.diagnosis || '...'}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-10 text-gray-400">Đang tải hồ sơ sức khỏe...</div>
                        )}
                    </div>

                    {/* 2.2 KHUNG CHẨN ĐOÁN */}
                    <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-bold text-blue-800 mb-2">🩺 Chẩn đoán & Kết luận</h3>
                        <textarea 
                            className="w-full border p-3 rounded focus:ring-2 focus:ring-blue-500 flex-1 resize-none"
                            placeholder="Nhập triệu chứng, chẩn đoán bệnh..."
                            value={diagnosis}
                            onChange={(e) => setDiagnosis(e.target.value)}
                        ></textarea>
                    </div>
                </div>
            ) : (
                <div className="w-2/4 flex items-center justify-center text-gray-400 italic bg-white rounded shadow">
                    Chọn một bệnh nhân từ danh sách chờ để bắt đầu khám.
                </div>
            )}

            {/* --- CỘT 3: KÊ ĐƠN THUỐC (GIỮ NGUYÊN LOGIC CŨ) --- */}
            <div className="w-1/4 bg-white rounded shadow p-4 flex flex-col">
                <h2 className="text-xl font-bold text-green-700 mb-4 border-b pb-2">💊 Kê Đơn Thuốc</h2>
                
                {selectedVisit && (
                    <>
                        <form onSubmit={handleAddDrug} className="space-y-2 mb-4">
                            <select 
                                className="w-full border p-2 rounded text-sm"
                                value={prescriptionForm.medicine_id}
                                onChange={e => setPrescriptionForm({...prescriptionForm, medicine_id: e.target.value})}
                                required
                            >
                                <option value="">-- Chọn thuốc --</option>
                                {medicines.map(m => (
                                    <option key={m.medicine_id} value={m.medicine_id}>
                                        {m.name} ({m.unit}) - Tồn: {m.stock_quantity}
                                    </option>
                                ))}
                            </select>
                            
                            <div className="flex gap-2">
                                <input 
                                    type="number" min="1" placeholder="SL" 
                                    className="w-20 border p-2 rounded text-sm"
                                    value={prescriptionForm.quantity}
                                    onChange={e => setPrescriptionForm({...prescriptionForm, quantity: parseInt(e.target.value)})}
                                />
                                <input 
                                    type="text" placeholder="Cách dùng (Sáng/Tối...)" 
                                    className="flex-1 border p-2 rounded text-sm"
                                    value={prescriptionForm.note}
                                    onChange={e => setPrescriptionForm({...prescriptionForm, note: e.target.value})}
                                />
                            </div>
                            <button type="submit" className="w-full bg-blue-100 text-blue-700 font-bold py-1 rounded hover:bg-blue-200 text-sm">
                                + Thêm thuốc
                            </button>
                        </form>

                        <div className="flex-1 overflow-y-auto mb-4 border rounded p-2 bg-gray-50">
                            {tempPrescriptions.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-start text-sm border-b last:border-0 pb-1 mb-1">
                                    <div>
                                        <div className="font-bold">{item.medicine_name}</div>
                                        <div className="text-xs text-gray-500">SL: {item.quantity} | {item.note}</div>
                                    </div>
                                    <button 
                                        onClick={() => setTempPrescriptions(tempPrescriptions.filter((_, i) => i !== idx))}
                                        className="text-red-500 font-bold px-2 hover:bg-red-100 rounded"
                                    >x</button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-auto pt-2 border-t">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-gray-700 text-sm">Tạm tính</h3>
                                <button onClick={updateBillPreview} className="text-xs text-blue-500 underline">Cập nhật</button>
                            </div>
                            {billPreview && (
                                <div className="text-right text-sm mb-3">
                                    <div className="text-red-600 font-bold text-lg">{billPreview.total.toLocaleString()} đ</div>
                                </div>
                            )}
                            
                            <button 
                                onClick={handleFinishExam}
                                className="w-full bg-green-600 text-white py-3 rounded font-bold shadow hover:bg-green-700"
                            >
                                ✅ HOÀN TẤT KHÁM
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default DoctorRoom;