// src/pages/Payment.jsx
import React, { useState } from 'react';
import api from '../services/api';

const Payment = () => {
    const [visitId, setVisitId] = useState('');
    const [billData, setBillData] = useState(null);
    const [invoice, setInvoice] = useState(null);

    // 1. Xem trước hóa đơn (Khi nhập ID lượt khám và bấm Tìm)
    const handleCheckBill = async (e) => {
        e.preventDefault();
        setInvoice(null); // Reset hóa đơn cũ nếu có
        try {
            // Gọi API xem trước tiền
            const res = await api.get(`/visits/${visitId}/bill`);
            setBillData(res.data);
        } catch (err) {
            alert("Không tìm thấy lượt khám hoặc lỗi server");
            setBillData(null);
        }
    };

    // 2. Xác nhận thanh toán
    const handlePay = async () => {
        if (!confirm("Xác nhận thu tiền và xuất hóa đơn?")) return;
        try {
            const res = await api.post(`/invoices?visit_id=${visitId}`);
            setInvoice(res.data); // Lưu kết quả hóa đơn đã tạo
            alert("Thanh toán thành công!");
        } catch (err) {
            alert("Lỗi: " + (err.response?.data?.detail || "Thanh toán thất bại"));
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Thu Ngân & Thanh Toán</h1>

            <div className="bg-white p-8 rounded shadow-md w-full max-w-lg">
                {/* Form tìm kiếm */}
                <form onSubmit={handleCheckBill} className="flex gap-2 mb-6">
                    <input 
                        type="number" 
                        placeholder="Nhập Mã Lượt Khám (Visit ID)..."
                        className="flex-1 border p-3 rounded text-lg focus:outline-blue-500"
                        value={visitId}
                        onChange={e => setVisitId(e.target.value)}
                        required
                    />
                    <button type="submit" className="bg-blue-600 text-white px-6 rounded font-bold hover:bg-blue-700">
                        Kiểm tra
                    </button>
                </form>

                {/* Hiển thị chi tiết tiền cần thu */}
                {billData && !invoice && (
                    <div className="space-y-4 border-t pt-4">
                        <h3 className="text-xl font-bold text-gray-700">Chi tiết thanh toán</h3>
                        <div className="flex justify-between">
                            <span>Mã lượt khám:</span>
                            <span className="font-bold">{billData.visit_id}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tiền khám cố định:</span>
                            <span>{billData.exam_fee.toLocaleString()} đ</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tiền thuốc:</span>
                            <span>{billData.medicine_cost.toLocaleString()} đ</span>
                        </div>
                        <div className="flex justify-between text-xl text-red-600 font-bold border-t pt-2 mt-2">
                            <span>TỔNG CỘNG:</span>
                            <span>{billData.total.toLocaleString()} đ</span>
                        </div>

                        <button 
                            onClick={handlePay}
                            className="w-full bg-green-600 text-white py-3 rounded font-bold text-lg mt-4 hover:bg-green-700 shadow"
                        >
                            $$ THU TIỀN $$
                        </button>
                    </div>
                )}

                {/* Hiển thị kết quả sau khi thanh toán xong */}
                {invoice && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded text-center animate-pulse">
                        <h3 className="text-green-800 font-bold text-xl mb-2">ĐÃ THANH TOÁN THÀNH CÔNG</h3>
                        <p>Mã hóa đơn: <strong>#{invoice.invoice_id}</strong></p>
                        <p>Thời gian: {new Date(invoice.payment_time).toLocaleString()}</p>
                        <p className="text-2xl font-bold mt-2">{invoice.total_amount.toLocaleString()} đ</p>
                        <button 
                            onClick={() => window.print()}
                            className="mt-4 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                        >
                            🖨 In Hóa Đơn
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Payment;