import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getInpatientDetail, createDailyOrder, getBillingPreview, getBedMap, transferBed } from '../services/api';
import { toast } from 'react-toastify';

const InpatientDetail = () => {
    const { id } = useParams();
    const [record, setRecord] = useState(null);
    const [activeTab, setActiveTab] = useState('daily'); // 'daily', 'bed', 'billing'
    
    // State cho Daily Order Form
    const [note, setNote] = useState({ progress: '', instruction: '', vitals: '' });

    // State cho Billing Preview
    const [bill, setBill] = useState(null);

    // State cho Modal Chuyển giường
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [beds, setBeds] = useState([]);
    const [selectedBed, setSelectedBed] = useState('');

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const fetchDetail = async () => {
        try {
            const data = await getInpatientDetail(id);
            setRecord(data);
        } catch (error) {
            console.error("Lỗi tải hồ sơ", error);
        }
    };

    // --- LOGIC TAB 1: DAILY ORDERS ---
    const handleAddNote = async (e) => {
        e.preventDefault();
        try {
            await createDailyOrder(id, {
                progress_note: note.progress,
                doctor_instruction: note.instruction,
                nurse_notes: '',
                vitals: note.vitals ? { text: note.vitals } : null // Demo simple json
            });
            toast.success("Đã lưu diễn tiến");
            setNote({ progress: '', instruction: '', vitals: '' });
            fetchDetail(); // Reload list
        } catch (error) {
            toast.error("Lỗi lưu diễn tiến");
        }
    };

    // --- LOGIC TAB 2: BED TRANSFER ---
    const openTransferModal = async () => {
        try {
            const mapData = await getBedMap();
            // Flatten beds từ mapData (Department -> Rooms -> Beds)
            let availableBeds = [];
            mapData.forEach(dept => {
                dept.beds.forEach(bed => {
                    if (bed.status === 'AVAILABLE') {
                        availableBeds.push({ ...bed, deptName: dept.department_name });
                    }
                });
            });
            setBeds(availableBeds);
            setShowTransferModal(true);
        } catch (error) {
            toast.error("Lỗi tải danh sách giường");
        }
    };

    const handleTransfer = async () => {
        if (!selectedBed) return;
        try {
            await transferBed(id, { new_bed_id: parseInt(selectedBed) });
            toast.success("Chuyển giường thành công");
            setShowTransferModal(false);
            fetchDetail();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Lỗi chuyển giường");
        }
    };

    // --- LOGIC TAB 3: BILLING ---
    const fetchBill = async () => {
        try {
            const data = await getBillingPreview(id);
            setBill(data);
        } catch (error) {
            console.error(error);
        }
    };

    // Load bill khi chuyển tab
    useEffect(() => {
        if (activeTab === 'billing') fetchBill();
    }, [activeTab]);

    if (!record) return <div>Loading...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header Hồ Sơ */}
            <div className="bg-white p-6 rounded shadow mb-6 border-l-4 border-blue-600">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">{record.patient_name}</h1>
                        <p className="text-gray-500">Mã HS: IP-{record.inpatient_id} | BS: {record.treating_doctor_name}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-blue-600">{record.bed_number}</div>
                        <span className={`px-3 py-1 rounded text-sm font-bold ${record.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-200'}`}>
                            {record.status}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b mb-6 bg-white rounded-t shadow-sm">
                <button 
                    onClick={() => setActiveTab('daily')}
                    className={`flex-1 py-3 font-medium ${activeTab === 'daily' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    🩺 Theo Dõi & Y Lệnh
                </button>
                <button 
                    onClick={() => setActiveTab('bed')}
                    className={`flex-1 py-3 font-medium ${activeTab === 'bed' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    🛏️ Lịch Sử Giường
                </button>
                <button 
                    onClick={() => setActiveTab('billing')}
                    className={`flex-1 py-3 font-medium ${activeTab === 'billing' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    💰 Viện Phí Tạm Tính
                </button>
            </div>

            {/* TAB CONTENT */}
            
            {/* 1. DAILY ORDERS */}
            {activeTab === 'daily' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Form nhập */}
                    <div className="bg-white p-4 rounded shadow md:col-span-1 h-fit">
                        <h3 className="font-bold mb-3 text-gray-700">Thêm diễn tiến mới</h3>
                        <form onSubmit={handleAddNote} className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium">Diễn biến bệnh</label>
                                <textarea 
                                    className="w-full border rounded p-2 text-sm" rows="3"
                                    value={note.progress} onChange={e => setNote({...note, progress: e.target.value})}
                                    required
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Y lệnh điều trị</label>
                                <textarea 
                                    className="w-full border rounded p-2 text-sm" rows="3"
                                    value={note.instruction} onChange={e => setNote({...note, instruction: e.target.value})}
                                    required
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Sinh hiệu (Mạch/HA)</label>
                                <input 
                                    type="text" className="w-full border rounded p-2 text-sm"
                                    value={note.vitals} onChange={e => setNote({...note, vitals: e.target.value})}
                                />
                            </div>
                            <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium">Lưu Hồ Sơ</button>
                        </form>
                    </div>

                    {/* Danh sách lịch sử */}
                    <div className="bg-white p-4 rounded shadow md:col-span-2">
                        <h3 className="font-bold mb-3 text-gray-700">Lịch sử diễn tiến</h3>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                            {record.daily_orders.map((order) => (
                                <div key={order.order_id} className="border p-3 rounded hover:bg-gray-50 relative">
                                    <div className="absolute top-3 right-3 text-xs text-gray-400">
                                        {new Date(order.date).toLocaleDateString()}
                                    </div>
                                    <p className="text-sm font-bold text-blue-800 mb-1">{order.doctor_name}</p>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="font-semibold text-gray-600">Diễn biến:</span>
                                            <p>{order.progress_note}</p>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-600">Y lệnh:</span>
                                            <p className="text-red-700">{order.doctor_instruction}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {record.daily_orders.length === 0 && <p className="text-gray-500 italic">Chưa có ghi chép nào.</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* 2. BED HISTORY */}
            {activeTab === 'bed' && (
                <div className="bg-white p-6 rounded shadow">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-700">Lịch sử nằm giường</h3>
                        <button 
                            onClick={openTransferModal}
                            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 flex items-center gap-2"
                        >
                            🔄 Chuyển Giường
                        </button>
                    </div>
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3 text-left">Giường</th>
                                <th className="p-3 text-left">Phòng</th>
                                <th className="p-3 text-left">Nhận lúc</th>
                                <th className="p-3 text-left">Trả lúc</th>
                                <th className="p-3 text-right">Đơn giá</th>
                                <th className="p-3 text-right">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {record.bed_history.map((h) => (
                                <tr key={h.allocation_id} className="border-b">
                                    <td className="p-3 font-bold">{h.bed_number}</td>
                                    <td className="p-3">{h.room_number}</td>
                                    <td className="p-3">{new Date(h.check_in_time).toLocaleString()}</td>
                                    <td className="p-3">{h.check_out_time ? new Date(h.check_out_time).toLocaleString() : <span className="text-green-600 font-bold">Đang nằm</span>}</td>
                                    <td className="p-3 text-right">{h.price_per_day.toLocaleString()} đ</td>
                                    <td className="p-3 text-right font-bold">{h.total_price.toLocaleString()} đ</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* 3. BILLING PREVIEW */}
            {activeTab === 'billing' && bill && (
                <div className="bg-white p-6 rounded shadow space-y-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-blue-50 rounded">
                            <p className="text-sm text-gray-500">Tiền Giường</p>
                            <p className="text-xl font-bold text-blue-700">{bill.bed_fee_total.toLocaleString()} đ</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded">
                            <p className="text-sm text-gray-500">Tiền Thuốc & DV</p>
                            <p className="text-xl font-bold text-green-700">{(bill.medicine_fee_total + bill.service_fee_total).toLocaleString()} đ</p>
                        </div>
                        <div className="p-4 bg-red-50 rounded border border-red-200">
                            <p className="text-sm text-gray-500 font-bold">TỔNG CỘNG</p>
                            <p className="text-2xl font-bold text-red-700">{bill.total_amount.toLocaleString()} đ</p>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold border-b pb-2 mb-2">Chi tiết Dịch vụ & Thuốc đã dùng</h4>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500">
                                    <th className="pb-2">Tên mục</th>
                                    <th className="pb-2">Số lượng</th>
                                    <th className="pb-2 text-right">Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...bill.medicine_details, ...bill.service_details].map((item, idx) => (
                                    <tr key={idx} className="border-b border-dashed">
                                        <td className="py-2">{item.name}</td>
                                        <td className="py-2">x{item.qty}</td>
                                        <td className="py-2 text-right">{item.total.toLocaleString()} đ</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAL CHUYỂN GIƯỜNG */}
            {showTransferModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow-lg w-96">
                        <h3 className="font-bold text-lg mb-4">Chọn giường mới</h3>
                        <select 
                            className="w-full border p-2 mb-4 rounded"
                            value={selectedBed}
                            onChange={(e) => setSelectedBed(e.target.value)}
                        >
                            <option value="">-- Chọn giường trống --</option>
                            {beds.map(b => (
                                <option key={b.bed_id} value={b.bed_id}>
                                    {b.bed_number} - {b.deptName} ({parseFloat(b.price).toLocaleString()}đ)
                                </option>
                            ))}
                        </select>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowTransferModal(false)} className="px-4 py-2 text-gray-600">Hủy</button>
                            <button onClick={handleTransfer} className="px-4 py-2 bg-blue-600 text-white rounded">Xác nhận chuyển</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InpatientDetail;