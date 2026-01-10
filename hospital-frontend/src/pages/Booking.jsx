import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // <--- 1. Thêm Import này
import api from '../services/api';

const Booking = () => {
    const navigate = useNavigate(); // <--- 2. Khởi tạo hook điều hướng

    // --- STATE QUẢN LÝ DỮ LIỆU ---
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedTime, setSelectedTime] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    // Danh sách khung giờ cố định
    const timeSlots = [
        "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
        "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
    ];

    // --- 1. LOAD DANH SÁCH BÁC SĨ & CHECK LOGIN ---
    useEffect(() => {
        // Kiểm tra xem đã đăng nhập chưa
        const token = localStorage.getItem('token');
        if (!token) {
            alert("⚠️ Bạn cần đăng nhập để thực hiện đặt lịch!");
            navigate('/'); // Chuyển về trang Login
            return;
        }

        const fetchDoctors = async () => {
            try {
                const res = await api.get('/users/doctors');
                setDoctors(res.data);
            } catch (err) {
                console.error("Lỗi tải bác sĩ:", err);
            }
        };
        fetchDoctors();
    }, [navigate]);

    // --- 2. HÀM KIỂM TRA GIỜ HỢP LỆ (LOGIC 2 TIẾNG) ---
    const isSlotValid = (slotTime) => {
        const now = new Date();
        const selected = new Date(selectedDate);
        
        const [hours, minutes] = slotTime.split(':').map(Number);
        selected.setHours(hours, minutes, 0, 0);

        const limitTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);

        const today = new Date();
        today.setHours(0,0,0,0);
        const checkDate = new Date(selectedDate);
        checkDate.setHours(0,0,0,0);
        
        if (checkDate < today) return false;

        if (checkDate.getTime() === today.getTime()) {
            return selected > limitTime;
        }

        return true;
    };

    // --- 3. GỬI ĐẶT LỊCH ---
    const handleBooking = async (e) => {
        e.preventDefault();
        
        if (!selectedDoctor || !selectedTime) {
            alert("Vui lòng chọn Bác sĩ và Giờ khám!");
            return;
        }

        setLoading(true);
        try {
            // Lấy ID user hiện tại (Sẽ tự động đính kèm Token nhờ file api.js)
            const meRes = await api.get('/users/me');
            const myId = meRes.data.user_id;

            await api.post('/appointments', {
                patient_id: myId, 
                doctor_id: selectedDoctor,
                appointment_date: selectedDate,
                start_time: selectedTime,
                reason: reason || "Khám bệnh theo yêu cầu"
            });

            alert("✅ Đặt lịch thành công! Vui lòng đến đúng giờ.");
            setReason('');
            setSelectedTime('');
        } catch (err) {
            console.error(err);
            // Xử lý lỗi Token hết hạn
            if (err.response && err.response.status === 401) {
                alert("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
                navigate('/');
            } else {
                const msg = err.response?.data?.detail || "Lỗi đặt lịch";
                alert("❌ " + msg);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 flex justify-center">
            <div className="bg-white w-full max-w-3xl rounded-xl shadow-lg p-8">
                <h2 className="text-3xl font-bold text-black mb-6 text-center border-b pb-4">
                    Đặt lịch thăm khám trực tuyến
                </h2>

                <form onSubmit={handleBooking} className="space-y-6">
                    {/* CHỌN BÁC SĨ */}
                    <div>
                        <label className="block font-bold text-gray-700 mb-2">Chọn Bác Sĩ:</label>
                        <select 
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                            value={selectedDoctor}
                            onChange={(e) => setSelectedDoctor(e.target.value)}
                            required
                        >
                            <option value="">Vui lòng chọn</option>
                            {doctors.map(d => (
                                <option key={d.user_id} value={d.user_id}>
                                    BS. {d.full_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* CHỌN NGÀY */}
                    <div>
                        <label className="block font-bold text-gray-700 mb-2">Ngày Khám:</label>
                        <input 
                            type="date" 
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={selectedDate}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            required
                        />
                    </div>

                    {/* CHỌN GIỜ (GRID) */}
                    <div>
                        <label className="block font-bold text-gray-700 mb-2">Giờ Khám (Dự kiến):</label>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                            {timeSlots.map((slot) => {
                                const isValid = isSlotValid(slot);
                                return (
                                    <button
                                        key={slot}
                                        type="button"
                                        disabled={!isValid}
                                        onClick={() => setSelectedTime(slot)}
                                        className={`py-2 px-1 rounded border text-sm font-semibold transition-all
                                            ${!isValid 
                                                ? 'bg-gray-100 text-gray-300 cursor-not-allowed border-gray-200' 
                                                : selectedTime === slot 
                                                    ? 'bg-blue-600 text-white shadow-lg transform scale-105 border-blue-600' 
                                                    : 'bg-white text-blue-600 hover:bg-blue-50 border-blue-200'
                                            }
                                        `}
                                    >
                                        {slot}
                                    </button>
                                );
                            })}
                        </div>
                        {!selectedTime && <p className="text-red-500 text-xs mt-2 italic">* Các khung giờ mờ là đã qua hoặc quá gấp (cần đặt trước 2 tiếng).</p>}
                    </div>

                    {/* LÝ DO KHÁM */}
                    <div>
                        <label className="block font-bold text-gray-700 mb-2">Lý do khám:</label>
                        <textarea 
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            rows="3"
                            placeholder="Nêu triệu chứng hoặc lý do bạn muốn khám"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        ></textarea>
                    </div>

                    {/* NÚT SUBMIT */}
                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`w-full py-3 rounded-lg text-white font-bold text-lg shadow-md transition-all
                            ${loading ? 'bg-gray-400 cursor-wait' : 'bg-gradient-to-r from-black to-indigo-600 hover:from-black hover:to-indigo-700'}
                        `}
                    >
                        {loading ? 'Đang xử lý' : 'XÁC NHẬN ĐẶT LỊCH'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Booking;