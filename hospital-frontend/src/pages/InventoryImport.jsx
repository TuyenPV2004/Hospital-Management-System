import { useState, useEffect } from 'react';
import api from '../services/api';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const InventoryImport = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [medicines, setMedicines] = useState([]);
    
    // Header Data
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [note, setNote] = useState('');
    
    // Details List
    const [details, setDetails] = useState([]);
    
    // Form Adding Line
    const [selectedItem, setSelectedItem] = useState(''); // ID
    const [itemType, setItemType] = useState('MEDICINE');
    const [qty, setQty] = useState(1);
    const [price, setPrice] = useState(0);
    const [batch, setBatch] = useState('');
    const [expiry, setExpiry] = useState(new Date());

    useEffect(() => {
        api.get('/suppliers').then(res => setSuppliers(res.data));
        api.get('/medicines').then(res => setMedicines(res.data));
        // api.get('/supplies')... nếu có API lấy vật tư
    }, []);

    const handleAddLine = () => {
        if (!selectedItem) return;
        const itemObj = medicines.find(m => m.medicine_id == selectedItem);
        
        const newLine = {
            item_type: itemType,
            item_id: parseInt(selectedItem),
            name: itemObj ? itemObj.name : 'Unknown',
            quantity: parseInt(qty),
            import_price: parseFloat(price),
            batch_number: batch,
            expiry_date: expiry.toISOString().split('T')[0]
        };
        
        setDetails([...details, newLine]);
        // Reset form
        setQty(1); setBatch('');
    };

    const handleSave = async () => {
        if (!selectedSupplier || details.length === 0) return alert("Thiếu thông tin");
        
        try {
            // 1. Tạo phiếu
            const res = await api.post('/imports', {
                supplier_id: selectedSupplier,
                note: note,
                details: details
            });
            
            // 2. Xác nhận nhập kho ngay (Hoặc để sau tùy quy trình)
            if(window.confirm("Lưu thành công! Bạn có muốn nhập kho (Cộng tồn) ngay không?")) {
                await api.put(`/imports/${res.data.receipt_id}/confirm`);
                alert("Đã nhập kho hoàn tất!");
            } else {
                alert("Đã lưu nháp.");
            }
            
            // Reset All
            setDetails([]); setNote('');
        } catch (err) {
            alert("Lỗi nhập kho");
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-black">Quản lý nhập xuất</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Panel Trái: Thông tin chung */}
                <div className="col-span-1 bg-white p-4 rounded shadow h-fit">
                    <h3 className="font-bold mb-4 border-b pb-2">Thông tin phiếu</h3>
                    <div className="mb-3">
                        <label className="block text-sm font-medium">Nhà cung cấp:</label>
                        <select className="w-full p-2 border rounded" 
                            onChange={e => setSelectedSupplier(e.target.value)}>
                            <option value="">Lựa chọn nhà cung cấp</option>
                            {suppliers.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="mb-3">
                        <label className="block text-sm font-medium">Ghi chú:</label>
                        <textarea className="w-full p-2 border rounded" rows="3"
                             onChange={e => setNote(e.target.value)}></textarea>
                    </div>
                    <button onClick={handleSave} className="w-full bg-black text-white py-2 rounded font-bold hover:bg-green-700">
                        Lưu thông tin phiếu
                    </button>
                </div>

                {/* Panel Phải: Danh sách hàng */}
                <div className="col-span-2 bg-white p-4 rounded shadow">
                    <h3 className="font-bold mb-4 border-b pb-2">Thông tin chi tiết hàng hóa</h3>
                    
                    {/* Form thêm dòng */}
                    <div className="grid grid-cols-6 gap-2 mb-4 bg-gray-100 p-3 rounded">
                        <div className="col-span-2">
                            <label className="text-xs font-bold">Tên Thuốc</label>
                            <select className="w-full p-1 border rounded text-sm"
                                onChange={e => setSelectedItem(e.target.value)}>
                                <option value="">-- Chọn --</option>
                                {medicines.map(m => <option key={m.medicine_id} value={m.medicine_id}>{m.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold">Số lượng</label>
                            <input type="number" className="w-full p-1 border rounded text-sm" value={qty} onChange={e=>setQty(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-bold">Giá nhập</label>
                            <input type="number" className="w-full p-1 border rounded text-sm" value={price} onChange={e=>setPrice(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-bold">Số lô / Hạn</label>
                            <input type="text" placeholder="Lô" className="w-full p-1 border rounded text-sm mb-1" value={batch} onChange={e=>setBatch(e.target.value)} />
                            <DatePicker selected={expiry} onChange={setExpiry} className="w-full p-1 border rounded text-sm" />
                        </div>
                        <div className="flex items-end">
                            <button onClick={handleAddLine} className="bg-blue-500 text-white px-3 py-1 rounded text-sm w-full h-8">Thêm</button>
                        </div>
                    </div>

                    {/* Bảng dữ liệu */}
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="p-2">Tên hàng</th>
                                <th className="p-2">SL</th>
                                <th className="p-2">Giá</th>
                                <th className="p-2">Lô/Hạn</th>
                                <th className="p-2">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {details.map((d, idx) => (
                                <tr key={idx} className="border-b">
                                    <td className="p-2">{d.name}</td>
                                    <td className="p-2">{d.quantity}</td>
                                    <td className="p-2">{d.import_price.toLocaleString()}</td>
                                    <td className="p-2">{d.batch_number} <br/><span className="text-gray-500 text-xs">{d.expiry_date}</span></td>
                                    <td className="p-2 font-bold">{(d.quantity * d.import_price).toLocaleString()}</td>
                                </tr>
                            ))}
                            {details.length > 0 && (
                                <tr className="bg-green-50">
                                    <td colSpan="4" className="p-2 text-right font-bold">Tổng:</td>
                                    <td className="p-2 font-bold text-red-600">
                                        {details.reduce((sum, item) => sum + (item.quantity * item.import_price), 0).toLocaleString()} đ
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InventoryImport;