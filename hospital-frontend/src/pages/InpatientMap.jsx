import { useState, useEffect } from 'react';
import api from '../services/api';

const InpatientMap = () => {
    const [departments, setDepartments] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedBed, setSelectedBed] = useState(null);
    
    // Form data nhập viện
    const [patientId, setPatientId] = useState('');
    const [diagnosis, setDiagnosis] = useState('');

    useEffect(() => {
        loadMap();
    }, []);

    const loadMap = () => {
        api.get('/beds/map').then(res => setDepartments(res.data));
    };

    const handleBedClick = (bed) => {
        if (bed.status === 'AVAILABLE') {
            setSelectedBed(bed);
            setShowModal(true); // Mở form nhập viện
        } else if (bed.status === 'OCCUPIED') {
            alert(`Giường ${bed.bed_number} đang có người nằm. (Chức năng xem chi tiết đang phát triển)`);
        }
    };

    const handleAdmit = async () => {
        try {
            await api.post('/inpatients/admit', {
                patient_id: patientId,
                bed_id: selectedBed.bed_id,
                initial_diagnosis: diagnosis
            });
            alert("✅ Nhập viện thành công!");
            setShowModal(false);
            loadMap(); // Refresh lại sơ đồ
        } catch (err) {
            alert("Lỗi: " + (err.response?.data?.detail || "Không thể nhập viện"));
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-blue-800">Sơ Đồ Giường Bệnh (Nội Trú)</h1>

            {departments.map(dept => (
                <div key={dept.department_id} className="mb-8 bg-white p-4 rounded shadow">
                    <h2 className="text-xl font-bold mb-4 text-gray-700 border-b pb-2">
                        🏥 {dept.department_name}
                    </h2>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {dept.beds.map(bed => (
                            <div 
                                key={bed.bed_id}
                                onClick={() => handleBedClick(bed)}
                                className={`
                                    relative p-4 rounded-lg cursor-pointer border-2 transition transform hover:scale-105
                                    ${bed.status === 'AVAILABLE' ? 'bg-green-100 border-green-400 hover:bg-green-200' : ''}
                                    ${bed.status === 'OCCUPIED' ? 'bg-red-100 border-red-400 hover:bg-red-200' : ''}
                                    ${bed.status === 'MAINTENANCE' ? 'bg-gray-200 border-gray-400 opacity-50' : ''}
                                `}
                            >
                                <div className="font-bold text-lg text-gray-800">{bed.bed_number}</div>
                                <div className="text-xs text-gray-600">{bed.room_number} ({bed.type})</div>
                                <div className="mt-2 text-sm font-semibold">
                                    {bed.status === 'AVAILABLE' ? <span className="text-green-700">Trống</span> : 
                                     bed.status === 'OCCUPIED' ? <span className="text-red-700">Có người</span> : bed.status}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {bed.price?.toLocaleString()} đ/ngày
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Modal Nhập viện */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg w-96 shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 text-blue-600">
                            Nhập viện vào giường: {selectedBed?.bed_number}
                        </h3>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Mã Bệnh nhân (ID):</label>
                            <input type="number" className="w-full p-2 border rounded"
                                value={patientId} onChange={e => setPatientId(e.target.value)} />
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Chẩn đoán nhập viện:</label>
                            <textarea className="w-full p-2 border rounded" rows="3"
                                value={diagnosis} onChange={e => setDiagnosis(e.target.value)}></textarea>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Hủy</button>
                            <button onClick={handleAdmit} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Xác nhận</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InpatientMap;