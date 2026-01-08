import React, { useState, useEffect } from 'react';
import { 
    getDoctorPerformanceReport, 
    getServiceUsageReport, 
    getInpatientCensusReport, 
    getInpatientCostReport,
    exportReportExcel 
} from '../services/api';

const AdminReport = () => {
    const [activeTab, setActiveTab] = useState('doctors'); // doctors, services, census, inpatients_cost
    
    // Date Filters (Mặc định: 30 ngày gần nhất)
    const [fromDate, setFromDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
    
    const [data, setData] = useState([]);
    const [censusData, setCensusData] = useState([]); // Dữ liệu riêng cho Census vì không dùng date filter
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadData();
    }, [activeTab]); // Chỉ reload khi đổi tab, người dùng phải bấm nút "Xem" nếu đổi ngày

    const loadData = async () => {
        console.log('loadData called with activeTab:', activeTab);
        setLoading(true);
        setError(null);
        try {
            if (activeTab === 'doctors') {
                console.log('Fetching doctor performance report');
                const res = await getDoctorPerformanceReport(fromDate, toDate);
                console.log('Doctor data:', res);
                setData(Array.isArray(res) ? res : []);
            } else if (activeTab === 'services') {
                console.log('Fetching service usage report');
                const res = await getServiceUsageReport(fromDate, toDate);
                console.log('Services data:', res);
                setData(Array.isArray(res) ? res : []);
            } else if (activeTab === 'census') {
                console.log('Fetching census report');
                const res = await getInpatientCensusReport();
                console.log('Census data:', res);
                setCensusData(Array.isArray(res) ? res : []);
            } else if (activeTab === 'inpatients_cost') {
                console.log('Fetching inpatient costs report');
                const res = await getInpatientCostReport(fromDate, toDate);
                console.log('Inpatient costs data:', res);
                setData(Array.isArray(res) ? res : []);
            }
        } catch (error) {
            console.error("Lỗi tải báo cáo", error);
            setError(error.message || "Lỗi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            // Mapping tab name to report_type param
            const typeMap = {
                'doctors': 'doctors',
                'services': 'services',
                'inpatients_cost': 'inpatients_cost'
            };
            
            if (activeTab === 'census') {
                alert("Báo cáo Census hiện tại là realtime, chưa hỗ trợ xuất lịch sử.");
                return;
            }

            await exportReportExcel(typeMap[activeTab], fromDate, toDate);
        } catch (error) {
            console.error("Lỗi xuất file", error);
            alert("Lỗi xuất file Excel: " + (error.message || error));
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-blue-800">📊 Báo Cáo Quản Trị</h2>

            {/* Controls */}
            <div className="bg-white p-4 rounded shadow mb-6 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Từ ngày</label>
                    <input 
                        type="date" className="border p-2 rounded"
                        value={fromDate} onChange={e => setFromDate(e.target.value)}
                        disabled={activeTab === 'census'}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Đến ngày</label>
                    <input 
                        type="date" className="border p-2 rounded"
                        value={toDate} onChange={e => setToDate(e.target.value)}
                        disabled={activeTab === 'census'}
                    />
                </div>
                <button 
                    onClick={loadData}
                    disabled={activeTab === 'census' || loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {loading ? 'Đang tải...' : 'Xem Báo Cáo'}
                </button>
                
                <button 
                    onClick={handleExport}
                    disabled={activeTab === 'census' || loading}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ml-auto flex items-center gap-2 disabled:bg-gray-400"
                >
                    📥 Xuất Excel
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b mb-6">
                {[
                    { id: 'doctors', label: 'Hiệu suất Bác sĩ' },
                    { id: 'services', label: 'Doanh thu Dịch vụ' },
                    { id: 'census', label: 'Hiện trạng Giường' },
                    { id: 'inpatients_cost', label: 'Chi phí Nội trú' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 font-medium ${activeTab === tab.id ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="bg-white shadow rounded overflow-hidden">
                {error && (
                    <div className="p-4 bg-red-100 text-red-800 rounded mb-4">
                        Lỗi: {error}
                    </div>
                )}

                {loading && (
                    <div className="p-6 text-center text-gray-500">
                        Đang tải dữ liệu...
                    </div>
                )}

                {!loading && !error && (
                    <>
                        {/* TAB 1: DOCTORS */}
                        {activeTab === 'doctors' && (
                            data.length === 0 ? (
                                <div className="p-6 text-center text-gray-500">Không có dữ liệu</div>
                            ) : (
                                <table className="min-w-full">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="p-3 text-left">Bác sĩ</th>
                                            <th className="p-3 text-right">Tổng lượt khám</th>
                                            <th className="p-3 text-right">Doanh thu chỉ định</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map((row, idx) => (
                                            <tr key={idx} className="border-b">
                                                <td className="p-3 font-medium">{row.doctor_name}</td>
                                                <td className="p-3 text-right">{row.total_visits}</td>
                                                <td className="p-3 text-right font-bold text-blue-600">{row.total_service_revenue.toLocaleString()} đ</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                        )}

                        {/* TAB 2: SERVICES */}
                        {activeTab === 'services' && (
                            data.length === 0 ? (
                                <div className="p-6 text-center text-gray-500">Không có dữ liệu</div>
                            ) : (
                                <table className="min-w-full">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="p-3 text-left">Tên Dịch vụ</th>
                                            <th className="p-3 text-left">Phân loại</th>
                                            <th className="p-3 text-right">Số lần dùng</th>
                                            <th className="p-3 text-right">Tổng doanh thu</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map((row, idx) => {
                                            console.log('Rendering service row:', row);
                                            return (
                                                <tr key={idx} className="border-b">
                                                    <td className="p-3 font-medium">{row?.service_name || 'N/A'}</td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-1 text-xs rounded ${row?.category === 'LAB' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'}`}>
                                                            {row?.category || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-right">{row?.usage_count || 0}</td>
                                                    <td className="p-3 text-right font-bold text-green-600">{(row?.total_revenue || 0).toLocaleString()} đ</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )
                        )}

                        {/* TAB 3: CENSUS (Table riêng dùng censusData) */}
                        {activeTab === 'census' && (
                            censusData.length === 0 ? (
                                <div className="p-6 text-center text-gray-500">Không có dữ liệu</div>
                            ) : (
                                <table className="min-w-full">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="p-3 text-left">Khoa / Phòng</th>
                                            <th className="p-3 text-right">Tổng số giường</th>
                                            <th className="p-3 text-right">Đang sử dụng</th>
                                            <th className="p-3 text-right">Tỷ lệ lấp đầy</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {censusData.map((row, idx) => (
                                            <tr key={idx} className="border-b">
                                                <td className="p-3 font-bold text-blue-800">{row.department_name}</td>
                                                <td className="p-3 text-right">{row.total_beds}</td>
                                                <td className="p-3 text-right">{row.occupied_beds}</td>
                                                <td className="p-3 text-right">
                                                    <span className={`font-bold ${row.occupancy_rate > 90 ? 'text-red-600' : 'text-green-600'}`}>
                                                        {row.occupancy_rate}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                        )}

                        {/* TAB 4: INPATIENT COSTS */}
                        {activeTab === 'inpatients_cost' && (
                            data.length === 0 ? (
                                <div className="p-6 text-center text-gray-500">Không có dữ liệu</div>
                            ) : (
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="p-3 text-left">Bệnh nhân</th>
                                            <th className="p-3 text-center">Ngày vào/ra</th>
                                            <th className="p-3 text-right">Tiền giường</th>
                                            <th className="p-3 text-right">Tiền thuốc</th>
                                            <th className="p-3 text-right">Tiền DV</th>
                                            <th className="p-3 text-right">Tổng chi phí</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map((row, idx) => {
                                            console.log('Rendering inpatient row:', row);
                                            return (
                                                <tr key={idx} className="border-b hover:bg-gray-50">
                                                    <td className="p-3 font-medium">
                                                        {row?.patient_name || 'N/A'}
                                                        <div className="text-xs text-gray-500">IP-{row?.inpatient_id || 'N/A'}</div>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        {row?.admission_date || 'N/A'} <br/> ➝ {row?.discharge_date || 'N/A'}
                                                    </td>
                                                    <td className="p-3 text-right">{(row?.bed_fee || 0).toLocaleString()}</td>
                                                    <td className="p-3 text-right">{(row?.medicine_fee || 0).toLocaleString()}</td>
                                                    <td className="p-3 text-right">{(row?.service_fee || 0).toLocaleString()}</td>
                                                    <td className="p-3 text-right font-bold text-red-600">{(row?.total_cost || 0).toLocaleString()} đ</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminReport;