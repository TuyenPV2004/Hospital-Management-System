import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Pharmacy = () => {
    const [medicines, setMedicines] = useState([]);
    // Form state mở rộng
    const [formData, setFormData] = useState({
        name: '', active_ingredient: '', category: 'Kháng sinh',
        unit: 'Vien', dosage: '', 
        price: 0, import_price: 0, stock_quantity: 0,
        expiry_date: '', batch_number: '', manufacturer: '', usage_instruction: ''
    });

    useEffect(() => {
        fetchMedicines();
    }, []);

    const fetchMedicines = async () => {
        try {
            const res = await api.get('/medicines');
            setMedicines(res.data);
        } catch (err) { console.error(err); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/medicines', formData);
            alert("Đã nhập kho thuốc mới!");
            fetchMedicines();
            // Reset form (có thể clear bớt các trường tùy ý)
        } catch (err) {
            alert("Lỗi: " + err.message);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-black mb-6">Quản lý kho dược</h1>
            
            {/* --- FORM NHẬP KHO CHI TIẾT --- */}
            <div className="bg-white p-6 rounded shadow-lg mb-8">
                <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Nhập thông tin thuốc</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    
                    {/* Hàng 1: Định danh thuốc */}
                    <div className="col-span-1">
                        <label className="text-xs font-bold text-gray-600">Tên biệt dược</label>
                        <input name="name" onChange={handleChange} required className="w-full border p-2 rounded focus:ring-teal-500" placeholder="VD: Panadol Extra" />
                    </div>
                    <div className="col-span-1">
                        <label className="text-xs font-bold text-gray-600">Hoạt chất chính</label>
                        <input name="active_ingredient" onChange={handleChange} className="w-full border p-2 rounded" placeholder="VD: Paracetamol" />
                    </div>
                    <div className="col-span-1">
                        <label className="text-xs font-bold text-gray-600">Nhóm thuốc</label>
                        <select name="category" onChange={handleChange} className="w-full border p-2 rounded">
                            <option>Kháng sinh</option>
                            <option>Giảm đau, hạ sốt</option>
                            <option>Vitamin, khoáng chất</option>
                            <option>Tim mạch</option>
                            <option>Tiêu hóa</option>
                        </select>
                    </div>
                    <div className="col-span-1">
                        <label className="text-xs font-bold text-gray-600">Hàm lượng</label>
                        <input name="dosage" onChange={handleChange} className="w-full border p-2 rounded" placeholder="VD: 500mg" />
                    </div>

                    {/* Hàng 2: Kinh tế & Kho */}
                    <div>
                        <label className="text-xs font-bold text-gray-600">Đơn vị tính</label>
                        <select name="unit" onChange={handleChange} className="w-full border p-2 rounded">
                            <option value="Vien">Viên</option>
                            <option value="Vi">Vỉ</option>
                            <option value="Hop">Hộp</option>
                            <option value="Chai">Chai</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-600">Giá nhập thuốc</label>
                        <input type="number" name="import_price" onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-600 text-blue-600">Giá bán thuốc</label>
                        <input type="number" name="price" onChange={handleChange} required className="w-full border p-2 rounded font-bold text-blue-700" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-600">Số lượng nhập</label>
                        <input type="number" name="stock_quantity" onChange={handleChange} required className="w-full border p-2 rounded" />
                    </div>

                    {/* Hàng 3: Hạn dùng & Nguồn gốc */}
                    <div>
                        <label className="text-xs font-bold text-gray-600 text-black">Hạn sử dụng</label>
                        <input type="date" name="expiry_date" onChange={handleChange} required className="w-full border p-2 rounded" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-600">Số lô sản xuất</label>
                        <input name="batch_number" onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                    <div className="col-span-2">
                        <label className="text-xs font-bold text-gray-600">Nhà sản xuất</label>
                        <input name="manufacturer" onChange={handleChange} className="w-full border p-2 rounded" placeholder="VD: Dược Hậu Giang" />
                    </div>
                    
                    {/* Hàng 4: Cách dùng */}
                    <div className="col-span-4">
                        <label className="text-xs font-bold text-gray-600">Hướng dẫn sử dụng</label>
                        <input name="usage_instruction" onChange={handleChange} className="w-full border p-2 rounded" placeholder="Nhập hướng dẫn sử dụng" />
                    </div>

                    <div className="col-span-4 mt-2">
                        <button type="submit" className="w-full bg-teal-600 text-white font-bold py-3 rounded hover:bg-teal-700 shadow">
                            Xác nhận nhập kho
                        </button>
                    </div>
                </form>
            </div>

            {/* --- DANH SÁCH THUỐC HIỆN CÓ --- */}
            <div className="bg-white p-6 rounded shadow-lg">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Danh mục thuốc tồn kho</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-gray-100 uppercase font-bold text-gray-600">
                            <tr>
                                <th className="p-3">ID</th>
                                <th className="p-3">Tên thuốc</th>
                                <th className="p-3">Đơn vị</th>
                                <th className="p-3">Giá bán</th>
                                <th className="p-3">Tồn kho</th>
                                <th className="p-3">Hạn dùng</th>
                                <th className="p-3">Nhà sản xuất</th>
                            </tr>
                        </thead>
                        <tbody>
                            {medicines.map(med => {
                                // Logic cảnh báo hết hạn
                                const isExpired = new Date(med.expiry_date) < new Date();
                                const isNearExpiry = new Date(med.expiry_date) < new Date(new Date().setDate(new Date().getDate() + 30));
                                
                                return (
                                    <tr key={med.medicine_id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 font-bold">{med.medicine_id}</td>
                                        <td className="p-3">
                                            <div className="font-bold text-teal-700">{med.name}</div>
                                            <div className="text-xs text-gray-500">{med.active_ingredient} - {med.dosage}</div>
                                        </td>
                                        <td className="p-3">{med.unit}</td>
                                        <td className="p-3 font-bold">{med.price.toLocaleString()}</td>
                                        <td className={`p-3 font-bold ${med.stock_quantity < 10 ? 'text-red-600' : 'text-green-600'}`}>
                                            {med.stock_quantity}
                                        </td>
                                        <td className="p-3">
                                            {med.expiry_date}
                                            {isExpired && <span className="ml-2 bg-red-500 text-white px-1 text-xs rounded">HẾT HẠN</span>}
                                            {!isExpired && isNearExpiry && <span className="ml-2 bg-yellow-500 text-white px-1 text-xs rounded">SẮP HẾT</span>}
                                        </td>
                                        <td className="p-3 text-gray-500">{med.manufacturer}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Pharmacy;