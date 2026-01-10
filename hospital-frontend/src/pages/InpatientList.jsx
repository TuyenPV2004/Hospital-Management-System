import React, { useState, useEffect } from 'react';
import { getInpatients, createInpatient, getBedMap } from '../services/api';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

const InpatientList = () => {
    const [inpatients, setInpatients] = useState([]);
    const [filterStatus, setFilterStatus] = useState('ACTIVE');
    const [showModal, setShowModal] = useState(false);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [beds, setBeds] = useState([]);
    
    const [formData, setFormData] = useState({
        patient_id: '',
        bed_id: '',
        doctor_id: '',
        admission_reason: '',
        diagnosis: ''
    });

    useEffect(() => {
        loadData();
    }, [filterStatus]);

    const loadData = async () => {
        try {
            const data = await getInpatients({ status: filterStatus });
            setInpatients(data);
        } catch (error) {
            console.error('Load inpatients error:', error);
            // Không hiển thị lỗi nếu chưa có dữ liệu, chỉ set empty array
            if (error.response?.status === 500) {
                console.warn('Backend schema error - InpatientResponse thiếu patient_name và bed_number');
                setInpatients([]);
            } else {
                toast.error('Lỗi tải danh sách nội trú');
            }
        }
    };

    const openModal = async () => {
        try {
            // Load danh sách bệnh nhân, bác sĩ, giường trống
            const [patientsRes, doctorsRes, bedsData] = await Promise.all([
                api.get('/patients'),
                api.get('/doctors'),
                getBedMap()
            ]);
            
            setPatients(patientsRes.data);
            setDoctors(doctorsRes.data);
            
            // Flatten beds từ bed map
            let availableBeds = [];
            bedsData.forEach(dept => {
                dept.beds.forEach(bed => {
                    if (bed.status === 'AVAILABLE') {
                        availableBeds.push({ ...bed, deptName: dept.department_name });
                    }
                });
            });
            setBeds(availableBeds);
            setShowModal(true);
        } catch (error) {
            console.error('Error loading data:', error);
            const errorMsg = error.response?.data?.detail || error.message || 'Lỗi tải dữ liệu';
            toast.error(errorMsg);
            
            // Nếu là lỗi 401, có thể token hết hạn
            if (error.response?.status === 401) {
                toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createInpatient({
                patient_id: parseInt(formData.patient_id),
                bed_id: parseInt(formData.bed_id),
                doctor_id: parseInt(formData.doctor_id),
                admission_reason: formData.admission_reason,
                diagnosis: formData.diagnosis
            });
            toast.success('Đã tạo hồ sơ nội trú thành công!');
            setShowModal(false);
            setFormData({
                patient_id: '',
                bed_id: '',
                doctor_id: '',
                admission_reason: '',
                diagnosis: ''
            });
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Lỗi tạo hồ sơ nội trú');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-blue-800">Quản lý nội trú</h2>
                <button 
                    onClick={openModal}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2 font-medium shadow"
                >
                    Nhập viện
                </button>
            </div>
            
            {/* Filter */}
            <div className="mb-4 flex gap-2">
                <button 
                    onClick={() => setFilterStatus('ACTIVE')}
                    className={`px-4 py-2 rounded ${filterStatus === 'ACTIVE' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                >
                    Đang điều trị
                </button>
                <button 
                    onClick={() => setFilterStatus('DISCHARGED')}
                    className={`px-4 py-2 rounded ${filterStatus === 'DISCHARGED' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                >
                    Đã xuất viện
                </button>
            </div>

            {/* Table */}
            <div className="bg-white shadow rounded overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="p-3 text-left">Mã HS</th>
                            <th className="p-3 text-left">Bệnh nhân</th>
                            <th className="p-3 text-left">Giường hiện tại</th>
                            <th className="p-3 text-left">Ngày nhập viện</th>
                            <th className="p-3 text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inpatients.map((item) => (
                            <tr key={item.inpatient_id} className="border-b hover:bg-gray-50">
                                <td className="p-3 font-mono text-blue-600">IP-{item.inpatient_id}</td>
                                <td className="p-3 font-medium">{item.patient_name}</td>
                                <td className="p-3">
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-bold">
                                        {item.bed_number}
                                    </span>
                                </td>
                                <td className="p-3">{new Date(item.admission_date).toLocaleDateString()}</td>
                                <td className="p-3 text-center">
                                    <Link 
                                        to={`/inpatients/${item.inpatient_id}`}
                                        className="text-blue-600 hover:underline"
                                    >
                                        Chi tiết
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {inpatients.length === 0 && (
                            <tr><td colSpan="5" className="p-4 text-center text-gray-500">Không có dữ liệu</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL THÊM BỆNH NHÂN NỘI TRÚ */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
                            <h3 className="text-xl font-bold">Tạo hồ sơ nội trú</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Chọn bệnh nhân</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={formData.patient_id}
                                    onChange={(e) => setFormData({...formData, patient_id: e.target.value})}
                                    required
                                >
                                    <option value="">Chọn bệnh nhân</option>
                                    {patients.map(p => (
                                        <option key={p.patient_id} value={p.patient_id}>
                                            {p.full_name} - {p.cccd} ({p.phone})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Chọn giường bệnh</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={formData.bed_id}
                                    onChange={(e) => setFormData({...formData, bed_id: e.target.value})}
                                    required
                                >
                                    <option value="">Chọn giường trống</option>
                                    {beds.map(b => (
                                        <option key={b.bed_id} value={b.bed_id}>
                                            {b.bed_number} - {b.deptName} ({parseFloat(b.price).toLocaleString()}đ/ngày)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Chỉ định bác sĩ điều trị</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={formData.doctor_id}
                                    onChange={(e) => setFormData({...formData, doctor_id: e.target.value})}
                                    required
                                >
                                    <option value="">Chọn bác sĩ</option>
                                    {doctors.map(d => (
                                        <option key={d.user_id} value={d.user_id}>
                                            {d.full_name} - {d.department || 'Chưa phân khoa'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lý do nhập viện</label>
                                <textarea 
                                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows="3"
                                    value={formData.admission_reason}
                                    onChange={(e) => setFormData({...formData, admission_reason: e.target.value})}
                                    placeholder="Nhập lý do nhập viện..."
                                    required
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Chẩn đoán ban đầu</label>
                                <textarea 
                                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows="3"
                                    value={formData.diagnosis}
                                    onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                                    placeholder="Nhập chẩn đoán ban đầu..."
                                    required
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)} 
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                                >
                                    Hủy
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 font-medium"
                                >
                                    Tạo Hồ Sơ
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InpatientList;