import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // --- STATE DỮ LIỆU ---
  const [stats, setStats] = useState({
    patientsToday: 0,
    revenueToday: 0,
    newAppointments: 0,
    lowStockCount: 0
  });
  
  const [revenueData, setRevenueData] = useState([]);      // Biểu đồ doanh thu
  const [visitStatusData, setVisitStatusData] = useState([]); // Biểu đồ tròn trạng thái khám
  const [topMedicines, setTopMedicines] = useState([]);    // Biểu đồ top thuốc
  
  const [appointments, setAppointments] = useState([]);    // Bảng lịch hẹn
  const [waitingList, setWaitingList] = useState([]);      // Bảng chờ khám
  
  const [expiryAlerts, setExpiryAlerts] = useState([]);    // Cảnh báo hết hạn
  const [bedStats, setBedStats] = useState({ total: 0, available: 0, percent: 0 }); // Thống kê giường

  // Màu cho biểu đồ tròn
  const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EF4444']; // Yellow, Blue, Green, Red

  // Hàm format tiền tệ
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // --- GỌI API SONG SONG ---
        const [
          revenueRes, 
          apptRes, 
          alertRes, 
          visitRes, 
          topMedRes, 
          bedRes,
          allVisitsRes // Gọi thêm cái này để thống kê Pie Chart (lấy tất cả visit)
        ] = await Promise.all([
          api.get('/reports/revenue').catch(() => ({ data: [] })),
          api.get('/appointments/today').catch(() => ({ data: [] })),
          api.get('/inventory/alerts').catch(() => ({ data: [] })),
          api.get('/visits?status=WAITING').catch(() => ({ data: [] })),
          api.get('/reports/top-medicines').catch(() => ({ data: [] })),
          api.get('/beds/map').catch(() => ({ data: [] })),
          api.get('/visits').catch(() => ({ data: [] })) // Lấy toàn bộ visit để phân tích trạng thái
        ]);

        // 1. XỬ LÝ THỐNG KÊ TỔNG QUAN (CARDS)
        const reports = revenueRes.data || [];
        const isToday = reports.length > 0 && new Date(reports[0].date).toDateString() === new Date().toDateString();
        const pendingAppts = apptRes.data.filter(a => a.status === 'PENDING');
        const lowStockItems = alertRes.data.filter(a => a.alert_type === 'LOW_STOCK');

        setStats({
          revenueToday: isToday ? reports[0].daily_revenue : 0,
          patientsToday: isToday ? reports[0].patient_count : 0,
          newAppointments: pendingAppts.length,
          lowStockCount: lowStockItems.length
        });

        // 2. XỬ LÝ BIỂU ĐỒ DOANH THU (AREA CHART)
        const chartData = [...reports].reverse().map(item => ({
          name: formatDate(item.date),
          revenue: item.daily_revenue,
          patients: item.patient_count
        }));
        setRevenueData(chartData);

        // 3. XỬ LÝ BIỂU ĐỒ TRÒN (VISIT STATUS PIE CHART)
        const allVisits = allVisitsRes.data || [];
        const statusCounts = { WAITING: 0, IN_PROGRESS: 0, COMPLETED: 0, PAID: 0 };
        allVisits.forEach(v => {
          if (statusCounts[v.status] !== undefined) statusCounts[v.status]++;
        });
        
        setVisitStatusData([
          { name: 'Đang chờ', value: statusCounts.WAITING },
          { name: 'Đang khám', value: statusCounts.IN_PROGRESS },
          { name: 'Hoàn thành', value: statusCounts.COMPLETED + statusCounts.PAID }, // Gộp Completed & Paid
        ].filter(item => item.value > 0)); // Chỉ hiện cái nào có dữ liệu

        // 4. XỬ LÝ TOP THUỐC (BAR CHART)
        setTopMedicines(topMedRes.data || []);

        // 5. XỬ LÝ CẢNH BÁO HẾT HẠN
        const expiryItems = alertRes.data.filter(a => a.alert_type === 'EXPIRY');
        setExpiryAlerts(expiryItems);

        // 6. XỬ LÝ GIƯỜNG BỆNH
        let totalBeds = 0;
        let availableBeds = 0;
        const departments = bedRes.data || [];
        departments.forEach(dept => {
          dept.beds.forEach(bed => {
            totalBeds++;
            if (bed.status === 'AVAILABLE') availableBeds++;
          });
        });
        setBedStats({
          total: totalBeds,
          available: availableBeds,
          percent: totalBeds > 0 ? Math.round((availableBeds / totalBeds) * 100) : 0
        });

        // 7. CẬP NHẬT BẢNG
        setAppointments(apptRes.data.slice(0, 5));
        setWaitingList(visitRes.data || []);

      } catch (error) {
        console.error("Lỗi tải dữ liệu Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu tổng quan...</div>;

  return (
    <div className="space-y-6 pb-10">
      {/* HEADER & QUICK ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tổng quan Bệnh viện</h1>
          <span className="text-sm text-gray-500">Cập nhật: {new Date().toLocaleTimeString()}</span>
        </div>
        
        {/* Quick Actions Buttons */}
        <div className="flex gap-3">
          <button onClick={() => navigate('/reception')} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition">
            <span>+ Tiếp nhận</span>
          </button>
          <button onClick={() => navigate('/booking')} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm transition">
            <span>+ Đặt lịch</span>
          </button>
          <button onClick={() => navigate('/inventory/import')} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 shadow-sm transition">
            <span>+ Nhập kho</span>
          </button>
        </div>
      </div>

      {/* --- PHẦN 1: CARDS THỐNG KÊ CƠ BẢN --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
          <p className="text-sm text-gray-500 mb-1">Bệnh nhân hôm nay</p>
          <h3 className="text-2xl font-bold text-gray-800">{stats.patientsToday}</h3>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
          <p className="text-sm text-gray-500 mb-1">Doanh thu ngày</p>
          <h3 className="text-xl font-bold text-gray-800">{formatCurrency(stats.revenueToday)}</h3>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-yellow-500 cursor-pointer hover:shadow-md" onClick={() => navigate('/booking')}>
          <p className="text-sm text-gray-500 mb-1">Lịch hẹn chờ duyệt</p>
          <h3 className="text-2xl font-bold text-gray-800">{stats.newAppointments}</h3>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500 cursor-pointer hover:shadow-md" onClick={() => navigate('/inventory/alerts')}>
          <p className="text-sm text-gray-500 mb-1">Cảnh báo tồn kho</p>
          <h3 className="text-2xl font-bold text-red-600">{stats.lowStockCount}</h3>
        </div>
      </div>

      {/* --- PHẦN 2: BIỂU ĐỒ PHÂN TÍCH --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Doanh thu 7 ngày (Area Chart) - Chiếm 2 phần */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Xu hướng doanh thu (7 ngày)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(val) => new Intl.NumberFormat('vi-VN', { notation: "compact" }).format(val)}/>
                <Tooltip formatter={(val) => formatCurrency(val)} />
                <Area type="monotone" dataKey="revenue" stroke="#10B981" fillOpacity={1} fill="url(#colorRevenue)" name="Doanh thu" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Trạng thái khám (Pie Chart) - Chiếm 1 phần */}
        <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-center">
          <h3 className="text-lg font-bold text-gray-800 mb-2 w-full text-left">Tình trạng khám</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={visitStatusData}
                  cx="50%" cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {visitStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-center text-sm text-gray-500">
             Dựa trên {visitStatusData.reduce((a, b) => a + b.value, 0)} lượt truy cập
          </div>
        </div>
      </div>

      {/* --- PHẦN 3: THÔNG TIN CHI TIẾT & CẢNH BÁO --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 3.1: Top Thuốc bán chạy (Bar Chart Horizontal) */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Top 5 Thuốc tiêu thụ nhiều nhất</h3>
          <div className="h-64">
             {topMedicines.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={topMedicines} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                    <Tooltip />
                    <Bar dataKey="sold_quantity" fill="#3B82F6" name="Đã bán" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
             ) : (
                <div className="h-full flex items-center justify-center text-gray-400">Chưa có dữ liệu bán hàng</div>
             )}
          </div>
        </div>

        {/* 3.2: Cảnh báo & Giường trống */}
        <div className="space-y-6">
            
            {/* Widget Giường Trống */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Công suất giường bệnh</h3>
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">Nội trú</span>
               </div>
               <div className="flex items-end gap-2 mb-2">
                  <span className="text-4xl font-bold text-blue-600">{bedStats.percent}%</span>
                  <span className="text-gray-500 mb-1">giường khả dụng</span>
               </div>
               {/* Progress Bar */}
               <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${bedStats.percent}%` }}></div>
               </div>
               <p className="text-sm text-gray-500">
                  Hiện còn trống <strong>{bedStats.available}</strong> / {bedStats.total} giường
               </p>
            </div>

            {/* Widget Cảnh báo Thuốc Hết Hạn */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-red-100">
               <h3 className="text-lg font-bold text-red-600 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  Cảnh báo Hết hạn sử dụng
               </h3>
               <div className="max-h-40 overflow-y-auto space-y-2">
                  {expiryAlerts.length > 0 ? (
                     expiryAlerts.map(item => (
                        <div key={item.id} className="flex justify-between items-center p-2 bg-red-50 rounded text-sm">
                           <span className="font-medium text-gray-700">{item.name}</span>
                           <span className="text-red-600">Hết hạn: {formatDate(item.expiry_date)}</span>
                        </div>
                     ))
                  ) : (
                     <p className="text-green-600 text-sm italic">Không có thuốc nào sắp hết hạn trong 60 ngày tới.</p>
                  )}
               </div>
            </div>

        </div>
      </div>

      {/* --- PHẦN 4: CÁC BẢNG DỮ LIỆU (Giữ lại từ Phase 1) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex justify-between">
             <h3 className="font-bold text-gray-700">Lịch hẹn mới nhất</h3>
             <button onClick={() => navigate('/booking')} className="text-xs text-blue-600 hover:underline">Xem tất cả</button>
          </div>
          <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                <tr><th className="px-4 py-3">Giờ</th><th className="px-4 py-3">Bệnh nhân</th><th className="px-4 py-3">Trạng thái</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {appointments.map((appt) => (
                    <tr key={appt.appointment_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{appt.start_time.substring(0, 5)}</td>
                      <td className="px-4 py-3">{appt.patient_name || `BN #${appt.patient_id}`}</td>
                      <td className="px-4 py-3"><span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">{appt.status}</span></td>
                    </tr>
                ))}
              </tbody>
          </table>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
           <div className="p-4 border-b bg-gray-50 flex justify-between">
             <h3 className="font-bold text-gray-700">Hàng đợi khám</h3>
             <button onClick={() => navigate('/reception')} className="text-xs text-blue-600 hover:underline">Quản lý</button>
           </div>
           <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                <tr><th className="px-4 py-3">Ưu tiên</th><th className="px-4 py-3">ID</th><th className="px-4 py-3">Vấn đề</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {waitingList.map((visit) => (
                    <tr key={visit.visit_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-red-600 font-bold">{visit.priority}</td>
                      <td className="px-4 py-3">#{visit.patient_id}</td>
                      <td className="px-4 py-3 truncate max-w-[150px]">{visit.chief_complaint}</td>
                    </tr>
                ))}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;