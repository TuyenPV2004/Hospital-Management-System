import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // State dữ liệu
  const [stats, setStats] = useState({
    patientsToday: 0,
    revenueToday: 0,
    newAppointments: 0,
    lowStockCount: 0
  });
  
  const [revenueData, setRevenueData] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [waitingList, setWaitingList] = useState([]);

  // Hàm format tiền tệ VNĐ
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Hàm format ngày tháng cho biểu đồ
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // 1. Gọi API Doanh thu & Bệnh nhân (7 ngày gần nhất) -> Dùng cho Chart & Card thống kê
        // Lưu ý: API này yêu cầu quyền ADMIN trong backend hiện tại
        const revenueRes = await api.get('/reports/revenue').catch(err => ({ data: [] }));
        
        // 2. Gọi API Lịch hẹn hôm nay -> Dùng cho Card "Lịch hẹn mới" & Bảng
        const apptRes = await api.get('/appointments/today').catch(err => ({ data: [] }));
        
        // 3. Gọi API Cảnh báo kho -> Dùng cho Card "Cảnh báo tồn kho"
        const alertRes = await api.get('/inventory/alerts').catch(err => ({ data: [] }));

        // 4. Gọi API Danh sách chờ khám -> Dùng cho Bảng "Hàng đợi"
        const visitRes = await api.get('/visits?status=WAITING').catch(err => ({ data: [] }));

        // --- XỬ LÝ DỮ LIỆU ---

        // A. Xử lý Thống kê & Biểu đồ doanh thu
        const reports = revenueRes.data || [];
        // Đảo ngược mảng để ngày cũ bên trái, ngày mới bên phải cho biểu đồ
        const chartData = [...reports].reverse().map(item => ({
          name: formatDate(item.date),
          revenue: item.daily_revenue,
          patients: item.patient_count
        }));
        setRevenueData(chartData);

        // Lấy dữ liệu ngày hôm nay (Phần tử đầu tiên của mảng gốc API trả về là mới nhất)
        const todayReport = reports.length > 0 ? reports[0] : { daily_revenue: 0, patient_count: 0 };
        // Kiểm tra xem report đầu tiên có phải là ngày hôm nay không (nếu không có giao dịch thì API có thể không trả về)
        const isToday = reports.length > 0 && new Date(reports[0].date).toDateString() === new Date().toDateString();
        
        // B. Xử lý Lịch hẹn (Đếm status PENDING)
        const pendingAppts = apptRes.data.filter(a => a.status === 'PENDING');

        // C. Xử lý Cảnh báo kho (Đếm LOW_STOCK)
        const lowStockItems = alertRes.data.filter(a => a.alert_type === 'LOW_STOCK');

        // Cập nhật State Thống kê Tổng quan
        setStats({
          revenueToday: isToday ? todayReport.daily_revenue : 0,
          patientsToday: isToday ? todayReport.patient_count : 0,
          newAppointments: pendingAppts.length,
          lowStockCount: lowStockItems.length
        });

        // Cập nhật State Bảng
        setAppointments(apptRes.data.slice(0, 5)); // Lấy 5 cái mới nhất
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Tổng quan Bệnh viện</h1>
        <span className="text-sm text-gray-500">Dữ liệu cập nhật: {new Date().toLocaleTimeString()}</span>
      </div>

      {/* --- PHẦN 1: CARDS THỐNG KÊ (WIDGETS) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Số bệnh nhân hôm nay */}
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Bệnh nhân hôm nay</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats.patientsToday}</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
          </div>
        </div>

        {/* Card 2: Doanh thu ngày */}
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Doanh thu ngày</p>
              <h3 className="text-xl font-bold text-gray-800">{formatCurrency(stats.revenueToday)}</h3>
            </div>
            <div className="p-3 bg-green-100 rounded-full text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
        </div>

        {/* Card 3: Lịch hẹn mới (Pending) */}
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-yellow-500 cursor-pointer hover:shadow-md transition" onClick={() => navigate('/booking')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Lịch hẹn chờ duyệt</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats.newAppointments}</h3>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
        </div>

        {/* Card 4: Cảnh báo tồn kho */}
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500 cursor-pointer hover:shadow-md transition" onClick={() => navigate('/inventory/alerts')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Cảnh báo tồn kho</p>
              <h3 className="text-2xl font-bold text-red-600">{stats.lowStockCount}</h3>
            </div>
            <div className="p-3 bg-red-100 rounded-full text-red-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* --- PHẦN 2: BIỂU ĐỒ DOANH THU (LINE CHART) --- */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Biểu đồ doanh thu 7 ngày gần nhất</h3>
        <div className="h-80 w-full">
          {revenueData.length > 0 ? (
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
                <YAxis tickFormatter={(value) => new Intl.NumberFormat('vi-VN', { notation: "compact" }).format(value)}/>
                <Tooltip formatter={(value) => formatCurrency(value)} labelStyle={{ color: '#333' }} />
                <Area type="monotone" dataKey="revenue" stroke="#10B981" fillOpacity={1} fill="url(#colorRevenue)" name="Doanh thu" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-gray-400">Chưa có dữ liệu doanh thu tuần này</div>
          )}
        </div>
      </div>

      {/* --- PHẦN 3: BẢNG DỮ LIỆU --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Bảng 1: Lịch hẹn hôm nay */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-700">Lịch hẹn hôm nay</h3>
            <span className="text-xs text-blue-600 cursor-pointer hover:underline" onClick={() => navigate('/booking')}>Xem tất cả</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Giờ</th>
                  <th className="px-4 py-3">Bệnh nhân</th>
                  <th className="px-4 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {appointments.length > 0 ? (
                  appointments.map((appt) => (
                    <tr key={appt.appointment_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {appt.start_time.substring(0, 5)}
                      </td>
                      <td className="px-4 py-3">{appt.patient_name || `Bệnh nhân #${appt.patient_id}`}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                          ${appt.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                            appt.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          {appt.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-4 py-8 text-center text-gray-400">Không có lịch hẹn hôm nay</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bảng 2: Hàng đợi khám (Status: WAITING) */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-700">Hàng đợi khám bệnh (Waiting)</h3>
            <span className="text-xs text-blue-600 cursor-pointer hover:underline" onClick={() => navigate('/reception')}>Quản lý</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Ưu tiên</th>
                  <th className="px-4 py-3">ID Bệnh nhân</th>
                  <th className="px-4 py-3">Triệu chứng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {waitingList.length > 0 ? (
                  waitingList.map((visit) => (
                    <tr key={visit.visit_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {visit.priority === 'EMERGENCY' ? (
                           <span className="text-red-600 font-bold animate-pulse">CẤP CỨU</span>
                        ) : visit.priority === 'HIGH' ? (
                           <span className="text-orange-600 font-bold">Cao</span>
                        ) : (
                           <span className="text-green-600">Thường</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">#{visit.patient_id}</td>
                      <td className="px-4 py-3 text-gray-500 truncate max-w-xs">{visit.chief_complaint}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-4 py-8 text-center text-gray-400">Không có bệnh nhân đang chờ</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;