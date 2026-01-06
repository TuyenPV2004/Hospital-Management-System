// src/pages/AdminReport.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AdminReport = () => {
    const [revenue, setRevenue] = useState([]);
    const [topMeds, setTopMeds] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const resRev = await api.get('/reports/revenue');
                setRevenue(resRev.data);
                
                const resMeds = await api.get('/reports/top-medicines');
                setTopMeds(resMeds.data);
            } catch (err) { console.error(err); }
        };
        fetchData();
    }, []);

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">📊 Báo Cáo Quản Trị</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* 1. Báo cáo Doanh thu */}
                <div className="bg-white p-6 rounded shadow-lg">
                    <h2 className="text-xl font-bold mb-4 text-green-700">Doanh thu 7 ngày gần nhất</h2>
                    <table className="w-full text-left">
                        <thead className="bg-green-50">
                            <tr>
                                <th className="p-2">Ngày</th>
                                <th className="p-2 text-right">Bệnh nhân</th>
                                <th className="p-2 text-right">Doanh thu</th>
                            </tr>
                        </thead>
                        <tbody>
                            {revenue.map((r, i) => (
                                <tr key={i} className="border-b">
                                    <td className="p-2">{r.date}</td>
                                    <td className="p-2 text-right">{r.patient_count}</td>
                                    <td className="p-2 text-right font-bold">{r.daily_revenue.toLocaleString()} đ</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 2. Báo cáo Thuốc bán chạy */}
                <div className="bg-white p-6 rounded shadow-lg">
                    <h2 className="text-xl font-bold mb-4 text-orange-600">Top 5 Thuốc bán chạy</h2>
                    <ul className="space-y-3">
                        {topMeds.map((m, i) => (
                            <li key={i} className="flex justify-between items-center border-b pb-2">
                                <div>
                                    <span className="font-bold block text-gray-800">{i+1}. {m.name}</span>
                                    <span className="text-xs text-gray-500">Còn tồn: {m.stock_quantity}</span>
                                </div>
                                <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded font-bold">
                                    Đã bán: {m.sold_quantity}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AdminReport;