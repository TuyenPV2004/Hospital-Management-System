import React, { useState, useEffect } from 'react';
import { getAppointments, cancelAppointment, updateAppointment } from '../services/api';
import { toast } from 'react-toastify';

const AppointmentManager = ({ role }) => {
    const [appointments, setAppointments] = useState([]);
    const [filterDate, setFilterDate] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const fetchAppts = async () => {
        try {
            const filters = {};
            if (filterDate) filters.date_str = filterDate;
            if (filterStatus) filters.status = filterStatus;
            
            const data = await getAppointments(filters);
            setAppointments(data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchAppts();
    }, [filterDate, filterStatus]);

    const handleCancel = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn hủy lịch này?")) return;
        try {
            await cancelAppointment(id);
            toast.success("Đã hủy lịch hẹn");
            fetchAppts(); // Reload list
        } catch (err) {
            toast.error(err.response?.data?.detail || "Lỗi khi hủy lịch");
        }
    };

    // Hàm đổi trạng thái nhanh (Cho Doctor/Admin)
    const handleChangeStatus = async (id, newStatus) => {
        try {
            await updateAppointment(id, { status: newStatus });
            toast.success("Đã cập nhật trạng thái");
            fetchAppts();
        } catch (err) {
             toast.error("Lỗi cập nhật");
        }
    };

    return (
        <div className="p-6 bg-white rounded shadow">
            <h2 className="text-xl font-bold mb-4">Quản lý lịch hẹn</h2>
            
            {/* Filter Bar */}
            <div className="flex gap-4 mb-4">
                <input 
                    type="date" 
                    className="border p-2 rounded"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                />
                <select 
                    className="border p-2 rounded"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="PENDING">Chờ xác nhận</option>
                    <option value="CONFIRMED">Đã xác nhận</option>
                    <option value="COMPLETED">Hoàn thành</option>
                    <option value="CANCELLED">Đã hủy</option>
                </select>
                <button 
                    onClick={fetchAppts}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    Lọc
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3 text-left">ID</th>
                            <th className="p-3 text-left">Bệnh nhân</th>
                            <th className="p-3 text-left">Bác sĩ</th>
                            <th className="p-3 text-left">Thời gian</th>
                            <th className="p-3 text-left">Trạng thái</th>
                            <th className="p-3 text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appointments.map((appt) => (
                            <tr key={appt.appointment_id} className="border-b">
                                <td className="p-3">{appt.appointment_id}</td>
                                <td className="p-3">
                                    <div className="font-medium">{appt.patient_full_name}</div>
                                    <div className="text-sm text-gray-500">{appt.patient_phone}</div>
                                </td>
                                <td className="p-3">{appt.doctor_full_name}</td>
                                <td className="p-3">
                                    {appt.start_time} - {appt.appointment_date}
                                </td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-xs ${
                                        appt.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                        appt.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                                        appt.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                        {appt.status}
                                    </span>
                                </td>
                                <td className="p-3 flex gap-2 justify-center">
                                    {/* Action Buttons */}
                                    {role !== 'PATIENT' && appt.status === 'PENDING' && (
                                        <button 
                                            onClick={() => handleChangeStatus(appt.appointment_id, 'CONFIRMED')}
                                            className="text-blue-600 hover:underline text-sm"
                                        >
                                            Duyệt
                                        </button>
                                    )}
                                    
                                    {(appt.status === 'PENDING' || appt.status === 'CONFIRMED') && (
                                        <button 
                                            onClick={() => handleCancel(appt.appointment_id)}
                                            className="text-red-600 hover:underline text-sm"
                                        >
                                            Hủy
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {appointments.length === 0 && (
                    <div className="text-center p-4 text-gray-500">Không tìm thấy lịch hẹn nào</div>
                )}
            </div>
        </div>
    );
};

export default AppointmentManager;
