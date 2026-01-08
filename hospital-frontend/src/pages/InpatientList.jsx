import React, { useState, useEffect } from 'react';
import { getInpatients } from '../services/api';
import { Link } from 'react-router-dom';

const InpatientList = () => {
    const [inpatients, setInpatients] = useState([]);
    const [filterStatus, setFilterStatus] = useState('ACTIVE');

    useEffect(() => {
        loadData();
    }, [filterStatus]);

    const loadData = async () => {
        try {
            const data = await getInpatients({ status: filterStatus });
            setInpatients(data);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-blue-800">Quản lý Nội Trú</h2>
            
            {/* Filter */}
            <div className="mb-4 flex gap-2">
                <button 
                    onClick={() => setFilterStatus('ACTIVE')}
                    className={`px-4 py-2 rounded ${filterStatus === 'ACTIVE' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                >
                    Đang điều trị
                </button>
                <button 
                    onClick={() => setFilterStatus('DISCHARGED')}
                    className={`px-4 py-2 rounded ${filterStatus === 'DISCHARGED' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                >
                    Đã xuất viện
                </button>
            </div>

            {/* Table */}
            <div className="bg-white shadow rounded overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="p-3 text-left">Mã HS</th>
                            <th className="p-3 text-left">Bệnh nhân</th>
                            <th className="p-3 text-left">Giường hiện tại</th>
                            <th className="p-3 text-left">Ngày nhập viện</th>
                            <th className="p-3 text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inpatients.map((item) => (
                            <tr key={item.inpatient_id} className="border-b hover:bg-gray-50">
                                <td className="p-3 font-mono text-blue-600">IP-{item.inpatient_id}</td>
                                <td className="p-3 font-medium">{item.patient_name}</td>
                                <td className="p-3">
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-bold">
                                        {item.bed_number}
                                    </span>
                                </td>
                                <td className="p-3">{new Date(item.admission_date).toLocaleDateString()}</td>
                                <td className="p-3 text-center">
                                    <Link 
                                        to={`/inpatients/${item.inpatient_id}`}
                                        className="text-blue-600 hover:underline"
                                    >
                                        Chi tiết
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {inpatients.length === 0 && (
                            <tr><td colSpan="5" className="p-4 text-center text-gray-500">Không có dữ liệu</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InpatientList;