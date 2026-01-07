import { useState, useEffect } from 'react';
import api from '../services/api';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from 'date-fns';

const Booking = () => {
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [patientId, setPatientId] = useState(''); // Nhập ID bệnh nhân (hoặc lấy từ user login)
    const [reason, setReason] = useState('');

    // Load danh sách bác sĩ
    useEffect(() => {
        api.get('/users/doctors').then(res => setDoctors(res.data));
    }, []);

    // Khi đổi Bác sĩ hoặc Ngày -> Load lại Slot
    useEffect(() => {
        if (selectedDoctor && selectedDate) {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            api.get(`/doctors/${selectedDoctor}/slots?date_str=${dateStr}`)
               .then(res => {
                   if(res.data.slots) setSlots([]); // Case ko có lịch
                   else setSlots(res.data);
               })
               .catch(() => setSlots([]));
        }
    }, [selectedDoctor, selectedDate]);

    const handleBooking = async () => {
        if (!selectedSlot || !patientId) return alert("Vui lòng nhập đủ thông tin");
        
        try {
            await api.post('/appointments', {
                patient_id: patientId,
                doctor_id: selectedDoctor,
                appointment_date: format(selectedDate, 'yyyy-MM-dd'),
                start_time: selectedSlot,
                reason: reason
            });
            alert("Đặt lịch thành công!");
            // Reset form or redirect
        } catch (err) {
            alert(err.response?.data?.detail || "Lỗi đặt lịch");
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto bg-white shadow-lg rounded-lg mt-10">
            <h1 className="text-2xl font-bold mb-6 text-blue-600">Đặt Lịch Khám Online</h1>

            {/* Bước 1: Chọn Bác sĩ */}
            <div className="mb-4">
                <label className="block font-medium mb-2">Chọn Bác sĩ:</label>
                <select 
                    className="w-full p-2 border rounded"
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                >
                    <option value="">-- Chọn bác sĩ --</option>
                    {doctors.map(doc => (
                        <option key={doc.user_id} value={doc.user_id}>
                            {doc.full_name} ({doc.role})
                        </option>
                    ))}
                </select>
            </div>

            {/* Bước 2: Chọn Ngày */}
            <div className="mb-4">
                <label className="block font-medium mb-2">Chọn Ngày khám:</label>
                <DatePicker 
                    selected={selectedDate} 
                    onChange={(date) => setSelectedDate(date)} 
                    dateFormat="yyyy-MM-dd"
                    minDate={new Date()}
                    className="w-full p-2 border rounded"
                />
            </div>

            {/* Bước 3: Chọn Giờ (Grid Layout) */}
            {selectedDoctor && (
                <div className="mb-4">
                    <label className="block font-medium mb-2">Chọn Khung giờ:</label>
                    <div className="grid grid-cols-4 gap-2">
                        {slots.length === 0 ? <p className="text-gray-500 col-span-4">Không có lịch trống.</p> : 
                            slots.map((slot, idx) => (
                                <button
                                    key={idx}
                                    disabled={slot.is_booked}
                                    onClick={() => setSelectedSlot(slot.time)}
                                    className={`p-2 rounded text-sm font-semibold ${
                                        slot.is_booked 
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                            : selectedSlot === slot.time 
                                                ? 'bg-blue-600 text-white' 
                                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    }`}
                                >
                                    {slot.time}
                                </button>
                            ))
                        }
                    </div>
                </div>
            )}

            {/* Bước 4: Thông tin bổ sung */}
            <div className="mb-4">
                <label className="block font-medium mb-2">Mã Bệnh nhân (ID):</label>
                <input 
                    type="number" 
                    className="w-full p-2 border rounded"
                    value={patientId}
                    onChange={e => setPatientId(e.target.value)}
                    placeholder="Nhập ID hồ sơ bệnh án..."
                />
            </div>
            <div className="mb-6">
                <label className="block font-medium mb-2">Lý do khám:</label>
                <textarea 
                    className="w-full p-2 border rounded"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="VD: Đau đầu, sốt nhẹ..."
                ></textarea>
            </div>

            <button 
                onClick={handleBooking}
                className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition"
            >
                Xác nhận Đặt lịch
            </button>
        </div>
    );
};

export default Booking;