// src/pages/Payment.jsx
import React, { useState, useRef } from 'react';
import api from '../services/api';

const Payment = () => {
    const [visitId, setVisitId] = useState('');
    const [billData, setBillData] = useState(null);
    
    // State nhập liệu của Thu ngân
    const [extraFee, setExtraFee] = useState(0); // Tiền thủ thuật
    const [insurance, setInsurance] = useState(0); // % BHYT (0, 80, 100)
    const [method, setMethod] = useState('CASH');
    
    const [invoice, setInvoice] = useState(null);
    const printRef = useRef(); // Ref để in hóa đơn

    // 1. Kiểm tra tiền (Live Calculate)
    const handleCheckBill = async (e) => {
        if(e) e.preventDefault();
        try {
            // Gọi API với các tham số tính toán
            const res = await api.get(`/visits/${visitId}/bill?insurance_percent=${insurance}&procedure_fee=${extraFee}`);
            setBillData(res.data);
            setInvoice(null);
        } catch (err) {
            alert("Không tìm thấy lượt khám (hoặc chưa kê đơn)");
            setBillData(null);
        }
    };

    // 2. Thanh toán
    const handlePay = async () => {
        if (!window.confirm(`Xác nhận thu ${billData.final_amount.toLocaleString()} đ?`)) return;
        try {
            const res = await api.post('/invoices', {
                visit_id: visitId,
                procedure_fee: parseFloat(extraFee),
                insurance_percent: parseInt(insurance),
                payment_method: method
            });
            setInvoice(res.data);
            alert("Thanh toán thành công!");
        } catch (err) {
            alert("Lỗi thanh toán");
        }
    };

    // 3. Hàm in hóa đơn
    const handlePrint = () => {
        const content = printRef.current.innerHTML;
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Hóa Đơn</title>');
        printWindow.document.write('<style>body{font-family: monospace; padding: 20px;} .header{text-align:center; border-bottom:1px dashed #000} .total{font-weight:bold; border-top:1px dashed #000}</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(content);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-100 p-6">
            <h1 className="text-3xl font-bold text-black mb-6">Quản lý tài chính</h1>

            <div className="flex gap-6 w-full max-w-5xl">
                {/* CỘT TRÁI: NHẬP LIỆU */}
                <div className="w-1/2 bg-white p-6 rounded shadow">
                    <div className="flex gap-2 mb-4">
                        <input type="number" placeholder="Nhập mã ID" className="flex-1 border p-2 rounded text-lg font-bold"
                            value={visitId} onChange={e => setVisitId(e.target.value)} />
                        <button onClick={handleCheckBill} className="bg-blue-600 text-white px-4 rounded">Kiểm tra</button>
                    </div>

                    {billData && !invoice && (
                        <div className="space-y-4">
                            {/* Danh sách thuốc */}
                            <div className="bg-gray-50 p-2 rounded text-sm max-h-40 overflow-y-auto">
                                <table className="w-full">
                                    <thead><tr className="text-left text-gray-500"><th>Thuốc</th><th>SL</th><th>Thành tiền</th></tr></thead>
                                    <tbody>
                                        {billData.medicine_details.map((m, i) => (
                                            <tr key={i} className="border-b">
                                                <td>{m.name}</td>
                                                <td>{m.qty}</td>
                                                <td>{(m.qty * m.price).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Form nhập phụ phí & BH */}
                            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                <div>
                                    <label className="block text-sm font-bold">Phí thủ thuật/khác:</label>
                                    <input type="number" className="w-full border p-2 rounded"
                                        value={extraFee} onChange={e => setExtraFee(e.target.value)} onBlur={() => handleCheckBill()} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold">% BHYT chi trả:</label>
                                    <select className="w-full border p-2 rounded"
                                        value={insurance} onChange={e => {setInsurance(e.target.value); setTimeout(handleCheckBill, 100)}}>
                                        <option value="0">Không BHYT (0%)</option>
                                        <option value="80">Đúng tuyến (80%)</option>
                                        <option value="100">Miễn phí (100%)</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold">Hình thức thanh toán:</label>
                                    <select className="w-full border p-2 rounded" value={method} onChange={e => setMethod(e.target.value)}>
                                        <option value="CASH">💵 Tiền mặt</option>
                                        <option value="TRANSFER">🏦 Chuyển khoản (QR)</option>
                                        <option value="CARD">💳 Thẻ tín dụng</option>
                                    </select>
                                </div>
                            </div>

                            {/* Tổng kết tiền */}
                            <div className="bg-yellow-50 p-4 rounded text-right space-y-1">
                                <p>Tiền thuốc: {billData.medicine_total.toLocaleString()}</p>
                                <p>Tiền khám: {billData.exam_fee.toLocaleString()}</p>
                                <p>Thủ thuật: {parseFloat(extraFee).toLocaleString()}</p>
                                <p className="font-bold border-t border-gray-300 pt-1">Tổng cộng: {billData.sub_total.toLocaleString()}</p>
                                <p className="text-green-600">BHYT trả (-{billData.insurance_percent}%): -{billData.discount.toLocaleString()}</p>
                                <h2 className="text-2xl font-bold text-red-600 mt-2">
                                    KHÁCH TRẢ: {billData.final_amount.toLocaleString()} đ
                                </h2>
                            </div>

                            <button onClick={handlePay} className="w-full bg-green-600 text-white py-3 rounded font-bold text-lg hover:bg-green-700 shadow">
                                XÁC NHẬN THANH TOÁN
                            </button>
                        </div>
                    )}
                </div>

                {/* CỘT PHẢI: MẪU HÓA ĐƠN IN */}
                <div className="w-1/2 bg-gray-200 p-6 rounded flex justify-center items-start">
                    {invoice ? (
                        <div className="bg-white p-6 shadow-lg w-full max-w-sm text-sm" ref={printRef}>
                            <div className="header text-center mb-4 pb-2 border-b border-dashed border-gray-400">
                                <h2 className="text-xl font-bold">HÓA ĐƠN VIỆN PHÍ</h2>
                                <p>Mã HĐ: #{invoice.invoice_id} | Visit: #{invoice.visit_id}</p>
                                <p>Ngày: {new Date().toLocaleString()}</p>
                            </div>
                            
                            <div className="mb-4">
                                <div className="flex justify-between font-bold border-b mb-1">
                                    <span>Dịch vụ/Thuốc</span>
                                    <span>Thành tiền</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Công khám</span>
                                    <span>{invoice.exam_fee.toLocaleString()}</span>
                                </div>
                                {invoice.procedure_fee > 0 && (
                                    <div className="flex justify-between">
                                        <span>Thủ thuật</span>
                                        <span>{invoice.procedure_fee.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span>Tổng tiền thuốc</span>
                                    <span>{invoice.medicine_total.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="total pt-2 border-top border-dashed border-gray-400 space-y-1">
                                <div className="flex justify-between">
                                    <span>Tổng cộng:</span>
                                    <span>{(invoice.final_amount / (1 - invoice.insurance_percent/100)).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between italic">
                                    <span>BHYT ({invoice.insurance_percent}%):</span>
                                    <span>- ...</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold mt-2">
                                    <span>THÀNH TIỀN:</span>
                                    <span>{invoice.final_amount.toLocaleString()}</span>
                                </div>
                                <div className="text-center mt-4 italic">
                                    ({invoice.payment_method === 'CASH' ? 'Tiền mặt' : invoice.payment_method})
                                </div>
                            </div>
                            <div className="mt-6 text-center text-xs">Cảm ơn và chúc sức khỏe!</div>
                        </div>
                    ) : (
                        <div className="text-gray-500 italic mt-10">Hóa đơn sẽ hiện ở đây sau khi thanh toán...</div>
                    )}
                </div>
            </div>
            
            {invoice && (
                <button onClick={handlePrint} className="mt-4 bg-gray-800 text-white px-6 py-2 rounded shadow hover:bg-black">
                    🖨 In Hóa Đơn Ngay
                </button>
            )}
        </div>
    );
};

export default Payment;