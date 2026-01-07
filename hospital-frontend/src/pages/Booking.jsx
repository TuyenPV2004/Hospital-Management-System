// src/pages/Booking.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const Booking = () => {
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [reason, setReason] = useState('');

    // State cho thông tin khách
    const [isGuest, setIsGuest] = useState(true); // Mặc định là khách vãng lai
    const [guestInfo, setGuestInfo] = useState({
        full_name: '',
        phone: '',
        dob: new Date(),
        gender: 'Nam',
        address: ''
    });
    const [patientId, setPatientId] = useState(''); // Nếu nhập ID có sẵn

    useEffect(() => {
        api.get('/users/doctors').then(res => setDoctors(res.data));
    }, []);

    useEffect(() => {
        if (selectedDoctor && selectedDate) {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            api.get(`/doctors/${selectedDoctor}/slots?date_str=${dateStr}`)
               .then(res => setSlots(res.data || []))
               .catch(() => setSlots([]));
        }
    }, [selectedDoctor, selectedDate]);

    const handleBooking = async () => {
        if (!selectedSlot || !selectedDoctor) return alert("Vui lòng chọn bác sĩ và giờ khám");
        
        // Payload gửi lên server
        const payload = {
            doctor_id: selectedDoctor,
            appointment_date: format(selectedDate, 'yyyy-MM-dd'),
            start_time: selectedSlot,
            reason: reason,
            // Nếu là Guest thì gửi info, nếu là Cũ thì gửi ID
            patient_id: isGuest ? null : patientId,
            full_name: isGuest ? guestInfo.full_name : null,
            phone: isGuest ? guestInfo.phone : null,
            dob: isGuest ? format(guestInfo.dob, 'yyyy-MM-dd') : null,
            gender: isGuest ? guestInfo.gender : null,
            address: isGuest ? guestInfo.address : null
        };

        try {
            await api.post('/appointments', payload);
            alert("✅ Đặt lịch thành công! Vui lòng đến đúng giờ.");
            navigate('/'); // Quay về trang chủ
        } catch (err) {
            alert("Lỗi: " + (err.response?.data?.detail || "Không thể đặt lịch"));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden">
                <div className="bg-blue-600 p-4">
                    <h1 className="text-white text-xl font-bold text-center">Đăng Ký Khám Bệnh Trực Tuyến</h1>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cột Trái: Chọn Lịch */}
                    <div>
                        <h3 className="font-bold text-gray-700 mb-3 border-b pb-1">1. Chọn Lịch Khám</h3>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Bác sĩ chuyên khoa</label>
                            <select className="w-full p-2 border rounded focus:ring-2 ring-blue-200"
                                onChange={(e) => setSelectedDoctor(e.target.value)}>
                                <option value="">-- Chọn bác sĩ --</option>
                                {doctors.map(d => (
                                    <option key={d.user_id} value={d.user_id}>{d.full_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Ngày mong muốn</label>
                            <DatePicker 
                                selected={selectedDate} 
                                onChange={setSelectedDate} 
                                dateFormat="dd/MM/yyyy"
                                minDate={new Date()}
                                className="w-full p-2 border rounded focus:ring-2 ring-blue-200"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Giờ khám</label>
                            <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                                {slots.length === 0 ? <span className="text-gray-400 text-sm col-span-3 text-center py-2">Chưa chọn bác sĩ hoặc kín lịch</span> :
                                    slots.map((slot, idx) => (
                                        <button key={idx} disabled={slot.is_booked}
                                            onClick={() => setSelectedSlot(slot.time)}
                                            className={`py-1 px-2 text-sm rounded border ${
                                                slot.is_booked ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                                                selectedSlot === slot.time ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 text-blue-700 border-blue-200'
                                            }`}
                                        >
                                            {slot.time}
                                        </button>
                                    ))
                                }
                            </div>
                        </div>
                    </div>

                    {/* Cột Phải: Thông tin & Xác nhận */}
                    <div>
                        <h3 className="font-bold text-gray-700 mb-3 border-b pb-1">2. Thông Tin Bệnh Nhân</h3>
                        
                        <div className="flex gap-4 mb-4 text-sm">
                            <label className="flex items-center cursor-pointer">
                                <input type="radio" checked={isGuest} onChange={() => setIsGuest(true)} className="mr-2"/>
                                Khách mới / Vãng lai
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input type="radio" checked={!isGuest} onChange={() => setIsGuest(false)} className="mr-2"/>
                                Đã có hồ sơ (Nhập ID)
                            </label>
                        </div>

                        {isGuest ? (
                            <div className="space-y-3 animation-fade-in">
                                <input placeholder="Họ và tên (*)" className="w-full p-2 border rounded text-sm"
                                    value={guestInfo.full_name} onChange={e=>setGuestInfo({...guestInfo, full_name: e.target.value})} />
                                <input placeholder="Số điện thoại (*)" className="w-full p-2 border rounded text-sm"
                                    value={guestInfo.phone} onChange={e=>setGuestInfo({...guestInfo, phone: e.target.value})} />
                                <div className="flex gap-2">
                                    <DatePicker selected={guestInfo.dob} onChange={d=>setGuestInfo({...guestInfo, dob: d})} 
                                        className="w-full p-2 border rounded text-sm" dateFormat="dd/MM/yyyy" placeholderText="Ngày sinh" />
                                    <select className="p-2 border rounded text-sm" value={guestInfo.gender} onChange={e=>setGuestInfo({...guestInfo, gender: e.target.value})}>
                                        <option value="Nam">Nam</option>
                                        <option value="Nu">Nữ</option>
                                    </select>
                                </div>
                                <input placeholder="Địa chỉ" className="w-full p-2 border rounded text-sm"
                                    value={guestInfo.address} onChange={e=>setGuestInfo({...guestInfo, address: e.target.value})} />
                            </div>
                        ) : (
                            <div className="mb-4">
                                <input type="number" placeholder="Nhập ID hồ sơ (VD: 101)" 
                                    className="w-full p-2 border rounded"
                                    value={patientId} onChange={e => setPatientId(e.target.value)} />
                            </div>
                        )}

                        <div className="mt-4">
                            <textarea rows="3" placeholder="Lý do khám / Triệu chứng..." 
                                className="w-full p-2 border rounded text-sm"
                                value={reason} onChange={e => setReason(e.target.value)}></textarea>
                        </div>

                        <button onClick={handleBooking}
                            className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded shadow-lg transform transition active:scale-95">
                            XÁC NHẬN ĐẶT LỊCH
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Booking;