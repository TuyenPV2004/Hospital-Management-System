// src/pages/ForgotPassword.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // Step 1: Nhập Email, Step 2: Nhập OTP
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Xử lý gửi Email (Bước 1)
    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/forgot-password', { email });
            alert(`Đã gửi mã OTP đến ${email}. Vui lòng kiểm tra hộp thư!`);
            setStep(2); // Chuyển sang bước 2
        } catch (err) {
            alert("Lỗi: " + (err.response?.data?.detail || "Không gửi được email"));
        } finally {
            setLoading(false);
        }
    };

    // Xử lý đổi mật khẩu (Bước 2)
    const handleResetPassword = async (e) => {
        e.preventDefault();
        try {
            await api.post('/reset-password', {
                email,
                otp,
                new_password: newPassword
            });
            alert("Thành công! Mật khẩu đã được thay đổi.");
            navigate('/'); // Quay về đăng nhập
        } catch (err) {
            alert("Lỗi: " + (err.response?.data?.detail || "OTP sai hoặc hết hạn"));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Khôi phục mật khẩu</h2>

                {step === 1 ? (
                    <form onSubmit={handleRequestOtp} className="space-y-4">
                        <p className="text-sm text-gray-600">Hãy nhập email bạn dùng để đăng ký tài khoản.</p>
                        <input 
                            type="email" placeholder="Email của bạn" required 
                            className="w-full border p-2 rounded"
                            value={email} onChange={e => setEmail(e.target.value)}
                        />
                        <button type="submit" disabled={loading}
                            className={`w-full text-white py-2 rounded font-bold ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                            {loading ? 'Đang gửi...' : 'Gửi mã xác thực OTP'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 mb-2">
                            Mã OTP đã được gửi tới <strong>{email}</strong>
                        </div>
                        <input 
                            type="text" placeholder="Nhập mã OTP (6 số)" required 
                            className="w-full border p-2 rounded text-center letter-spacing-2 font-bold"
                            maxLength="6"
                            value={otp} onChange={e => setOtp(e.target.value)}
                        />
                        <input 
                            type="password" placeholder="Mật khẩu mới" required 
                            className="w-full border p-2 rounded"
                            value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        />
                        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700">
                            Đổi mật khẩu
                        </button>
                        <button type="button" onClick={() => setStep(1)} className="w-full text-gray-500 text-sm mt-2 hover:underline">
                            Gửi lại mã ?
                        </button>
                    </form>
                )}
                
                <div className="text-center mt-6">
                    <button onClick={() => navigate('/')} className="text-sm text-blue-600 hover:underline">
                        Quay lại trang đăng nhập
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;