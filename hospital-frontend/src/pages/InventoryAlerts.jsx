import { useState, useEffect } from 'react';
import api from '../services/api';

const InventoryAlerts = () => {
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        api.get('/inventory/alerts').then(res => setAlerts(res.data));
    }, []);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-red-600">⚠️ Cảnh Báo Kho Hàng</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bảng Hết hạn */}
                <div className="bg-white p-4 rounded shadow border-l-4 border-red-500">
                    <h2 className="text-lg font-bold mb-4 text-red-700">Thuốc sắp hết hạn (60 ngày)</h2>
                    <ul>
                        {alerts.filter(a => a.alert_type === 'EXPIRY').map((item, idx) => (
                            <li key={idx} className="flex justify-between border-b py-2">
                                <div>
                                    <span className="font-bold">{item.name}</span>
                                    <div className="text-xs text-gray-500">Tồn: {item.stock}</div>
                                </div>
                                <div className="text-right">
                                    <span className="text-red-600 font-bold">{item.expiry_date}</span>
                                    <div className="text-xs text-red-400">Hết hạn</div>
                                </div>
                            </li>
                        ))}
                        {alerts.filter(a => a.alert_type === 'EXPIRY').length === 0 && <p className="text-green-500 italic">Không có cảnh báo.</p>}
                    </ul>
                </div>

                {/* Bảng Tồn kho thấp */}
                <div className="bg-white p-4 rounded shadow border-l-4 border-yellow-500">
                    <h2 className="text-lg font-bold mb-4 text-yellow-700">Sắp hết hàng (Dưới định mức)</h2>
                    <ul>
                        {alerts.filter(a => a.alert_type === 'LOW_STOCK').map((item, idx) => (
                            <li key={idx} className="flex justify-between border-b py-2">
                                <div>
                                    <span className="font-bold">{item.name}</span>
                                    <div className="text-xs text-gray-500">Định mức: {item.min_stock}</div>
                                </div>
                                <div className="text-right">
                                    <span className="text-yellow-600 font-bold text-xl">{item.stock}</span>
                                    <div className="text-xs text-yellow-500">Hiện có</div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default InventoryAlerts;