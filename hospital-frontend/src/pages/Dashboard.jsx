import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { 
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // --- STATE USER & TIME ---
  const [user, setUser] = useState({ username: '', role: '', id: null });
  const [currentTime, setCurrentTime] = useState(new Date());

  // --- STATE DỮ LIỆU (Dùng chung) ---
  const [stats, setStats] = useState({ patientsToday: 0, revenueToday: 0, newAppointments: 0, lowStockCount: 0 });
  const [revenueData, setRevenueData] = useState([]);      
  const [visitStatusData, setVisitStatusData] = useState([]); 
  const [topMedicines, setTopMedicines] = useState([]);    
  const [appointments, setAppointments] = useState([]);    
  const [waitingList, setWaitingList] = useState([]);      
  const [expiryAlerts, setExpiryAlerts] = useState([]);    
  const [bedStats, setBedStats] = useState({ total: 0, available: 0, percent: 0 }); 
  
  // State riêng theo Role
  const [myPatients, setMyPatients] = useState([]); 
  const [pendingServices, setPendingServices] = useState([]);
  const [myHistory, setMyHistory] = useState(null);

  const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EF4444']; 
  const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  const formatDate = (dateString) => `${new Date(dateString).getDate()}/${new Date(dateString).getMonth() + 1}`;

  // 1. ĐỒNG HỒ REAL-TIME (Chạy mỗi giây)
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. LẤY USER INFO
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/'); return; }
        const res = await api.get('/users/me');
        setUser({ 
          username: res.data.username, 
          role: res.data.role,
          id: res.data.user_id,
          insurance_card: res.data.patient_info?.insurance_card 
        });
      } catch (err) {
        console.error(err);
        navigate('/');
      }
    };
    fetchUser();
  }, [navigate]);

  // 3. LOGIC TẢI DỮ LIỆU (Phân luồng theo Role)
  const fetchData = useCallback(async () => {
    if (!user.role) return;
    try {
      // === LOGIC CHO ADMIN (Lấy FULL dữ liệu như Phase 2) ===
      if (user.role === 'ADMIN') {
        const [
          revenueRes, apptRes, alertRes, visitRes, topMedRes, bedRes, allVisitsRes
        ] = await Promise.all([
          api.get('/reports/revenue').catch(() => ({ data: [] })),
          api.get('/appointments/today').catch(() => ({ data: [] })),
          api.get('/inventory/alerts').catch(() => ({ data: [] })),
          api.get('/visits?status=WAITING').catch(() => ({ data: [] })),
          api.get('/reports/top-medicines').catch(() => ({ data: [] })),
          api.get('/beds/map').catch(() => ({ data: [] })),
          api.get('/visits').catch(() => ({ data: [] }))
        ]);

        // Xử lý dữ liệu Admin
        const reports = revenueRes.data || [];
        const isToday = reports.length > 0 && new Date(reports[0].date).toDateString() === new Date().toDateString();
        
        setStats({
          revenueToday: isToday ? reports[0].daily_revenue : 0,
          patientsToday: isToday ? reports[0].patient_count : 0,
          newAppointments: (apptRes.data || []).filter(a => a.status === 'PENDING').length,
          lowStockCount: (alertRes.data || []).filter(a => a.alert_type === 'LOW_STOCK').length
        });

        setRevenueData([...reports].reverse().map(item => ({ name: formatDate(item.date), revenue: item.daily_revenue })));
        setTopMedicines(topMedRes.data || []);
        setExpiryAlerts((alertRes.data || []).filter(a => a.alert_type === 'EXPIRY'));
        setAppointments((apptRes.data || []).slice(0, 5));
        setWaitingList(visitRes.data || []);

        // Pie Chart
        const allVisits = allVisitsRes.data || [];
        const statusCounts = { WAITING: 0, IN_PROGRESS: 0, COMPLETED: 0, PAID: 0 };
        allVisits.forEach(v => { if (statusCounts[v.status] !== undefined) statusCounts[v.status]++; });
        setVisitStatusData([
          { name: 'Đang chờ', value: statusCounts.WAITING },
          { name: 'Đang khám', value: statusCounts.IN_PROGRESS },
          { name: 'Hoàn thành', value: statusCounts.COMPLETED + statusCounts.PAID },
        ].filter(item => item.value > 0));

        // Bed Stats
        let totalBeds = 0, availableBeds = 0;
        (bedRes.data || []).forEach(dept => dept.beds.forEach(b => { totalBeds++; if(b.status === 'AVAILABLE') availableBeds++; }));
        setBedStats({ total: totalBeds, available: availableBeds, percent: totalBeds ? Math.round((availableBeds/totalBeds)*100) : 0 });
      }

      // === LOGIC CHO DOCTOR ===
      else if (user.role === 'DOCTOR') {
        const [apptRes, visitRes] = await Promise.all([
          api.get('/appointments/today').catch(() => ({ data: [] })),
          api.get('/visits').catch(() => ({ data: [] }))
        ]);
        setAppointments((apptRes.data || []).slice(0, 5));
        setMyPatients((visitRes.data || []).filter(v => v.status === 'IN_PROGRESS')); // Lọc bệnh nhân đang khám
        setWaitingList((visitRes.data || []).filter(v => v.status === 'WAITING'));
      }

      // === LOGIC CHO NURSE ===
      else if (user.role === 'NURSE') {
        const [apptRes, visitRes, bedRes] = await Promise.all([
          api.get('/appointments/today').catch(() => ({ data: [] })),
          api.get('/visits?status=WAITING').catch(() => ({ data: [] })),
          api.get('/beds/map').catch(() => ({ data: [] }))
        ]);
        setStats(prev => ({ ...prev, newAppointments: (apptRes.data || []).filter(a => a.status === 'PENDING').length }));
        setWaitingList(visitRes.data || []);
        
        let totalBeds = 0, availableBeds = 0;
        (bedRes.data || []).forEach(dept => dept.beds.forEach(b => { totalBeds++; if(b.status === 'AVAILABLE') availableBeds++; }));
        setBedStats({ total: totalBeds, available: availableBeds, percent: totalBeds ? Math.round((availableBeds/totalBeds)*100) : 0 });
      }

      // === LOGIC CHO TECHNICIAN ===
      else if (user.role === 'TECHNICIAN') {
        const serviceRes = await api.get('/service-requests?status=PENDING');
        setPendingServices(serviceRes.data);
      }

      // === LOGIC CHO PATIENT ===
      else if (user.role === 'PATIENT' && user.insurance_card) {
        const searchRes = await api.get(`/patients?search=${user.insurance_card}`);
        if (searchRes.data?.[0]) {
          const historyRes = await api.get(`/patients/${searchRes.data[0].patient_id}/history`);
          setMyHistory(historyRes.data);
        }
      }

    } catch (error) {
      console.error("Dashboard Error:", error);
    } finally {
      setLoading(false);
    }
  }, [user.role, user.insurance_card]);

  // Auto-refresh 60s
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);


  // ====================== PHẦN RENDER GIAO DIỆN ======================

  // Header chung
  const renderHeader = () => (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Xin chào, {user.username}!</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold text-xs">{user.role}</span>
          <span>|</span>
          <span className="flex items-center gap-1 font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded"> 🕒 {currentTime.toLocaleTimeString('vi-VN', { hour12: false })}
          </span>
        </div>
      </div>
      {/* Quick Actions cho Admin/Staff */}
      {['ADMIN', 'DOCTOR', 'NURSE'].includes(user.role) && (
        <div className="flex gap-2">
          {user.role !== 'DOCTOR' && (
             <button onClick={() => navigate('/reception')} className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 shadow-sm text-sm">+ Tiếp nhận</button>
          )}
          <button onClick={() => navigate('/booking')} className="bg-indigo-600 text-white px-3 py-2 rounded hover:bg-indigo-700 shadow-sm text-sm">+ Đặt lịch</button>
          {user.role === 'ADMIN' && (
             <button onClick={() => navigate('/inventory/import')} className="bg-emerald-600 text-white px-3 py-2 rounded hover:bg-emerald-700 shadow-sm text-sm">+ Nhập kho</button>
          )}
        </div>
      )}
    </div>
  );

  // 1. GIAO DIỆN ADMIN (GIỮ NGUYÊN PHASE 2 - FULL TÍNH NĂNG)
  if (user.role === 'ADMIN') {
    return (
      <div className="pb-10 space-y-6">
        {renderHeader()}
        
        {/* PHẦN 1: 4 CARDS THỐNG KÊ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Bệnh nhân hôm nay" value={stats.patientsToday} color="blue" />
          <StatCard title="Doanh thu ngày" value={formatCurrency(stats.revenueToday)} color="green" />
          <StatCard title="Lịch hẹn chờ duyệt" value={stats.newAppointments} color="yellow" onClick={() => navigate('/booking')} />
          <StatCard title="Cảnh báo kho" value={stats.lowStockCount} color="red" onClick={() => navigate('/inventory/alerts')} />
        </div>

        {/* PHẦN 2: BIỂU ĐỒ (DOANH THU & TRẠNG THÁI) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Doanh thu 7 ngày - Chiếm 2 phần */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Xu hướng doanh thu (7 ngày)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevAdmin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(val) => new Intl.NumberFormat('vi-VN', { notation: "compact" }).format(val)}/>
                  <Tooltip formatter={(val) => formatCurrency(val)} />
                  <Area type="monotone" dataKey="revenue" stroke="#10B981" fillOpacity={1} fill="url(#colorRevAdmin)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trạng thái khám - Chiếm 1 phần */}
          <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-center">
            <h3 className="text-lg font-bold text-gray-800 mb-2 w-full text-left">Tình trạng khám</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={visitStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {visitStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* PHẦN 3: CHI TIẾT (TOP THUỐC & CẢNH BÁO) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Thuốc */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Top 5 Thuốc tiêu thụ</h3>
            <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart layout="vertical" data={topMedicines} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                   <XAxis type="number" hide />
                   <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                   <Tooltip />
                   <Bar dataKey="sold_quantity" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
          </div>

          {/* Cảnh báo & Giường */}
          <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Công suất giường bệnh</h3>
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">Nội trú</span>
                 </div>
                 <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-bold text-blue-600">{bedStats.percent}%</span>
                    <span className="text-gray-500 mb-1">khả dụng</span>
                 </div>
                 <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${bedStats.percent}%` }}></div>
                 </div>
                 <p className="text-sm text-gray-500">Trống <strong>{bedStats.available}</strong> / {bedStats.total}</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-red-100">
                 <h3 className="text-lg font-bold text-red-600 mb-3">⚠️ Cảnh báo Hết hạn</h3>
                 <div className="max-h-40 overflow-y-auto space-y-2">
                    {expiryAlerts.length > 0 ? expiryAlerts.map(item => (
                        <div key={item.id} className="flex justify-between p-2 bg-red-50 rounded text-sm">
                           <span>{item.name}</span>
                           <span className="text-red-600 font-bold">{formatDate(item.expiry_date)}</span>
                        </div>
                    )) : <p className="text-green-600 text-sm">Không có cảnh báo.</p>}
                 </div>
              </div>
          </div>
        </div>

        {/* PHẦN 4: BẢNG DỮ LIỆU */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <AppointmentTable appointments={appointments} />
           <WaitlistTable waitingList={waitingList} />
        </div>
      </div>
    );
  }

  // 2. GIAO DIỆN DOCTOR (TẬP TRUNG CHUYÊN MÔN)
  if (user.role === 'DOCTOR') {
    return (
      <div className="pb-10">
        {renderHeader()}
        
        {/* Widget Bệnh nhân đang khám */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-600 mb-6">
           <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
             🩺 Bệnh nhân đang khám ({myPatients.length})
           </h3>
           {myPatients.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {myPatients.map(p => (
                 <div key={p.visit_id} className="border p-4 rounded hover:shadow-md bg-blue-50 cursor-pointer" onClick={() => navigate('/doctor')}>
                    <p className="font-bold text-lg">#{p.patient_id}</p>
                    <p className="text-gray-600 text-sm truncate">{p.chief_complaint}</p>
                    <button className="mt-2 text-xs bg-blue-600 text-white px-2 py-1 rounded">Vào khám ngay</button>
                 </div>
               ))}
             </div>
           ) : <p className="text-gray-500 italic">Hiện chưa có bệnh nhân nào trong phòng khám.</p>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <WaitlistTable waitingList={waitingList} title="Hàng đợi bên ngoài" />
           <AppointmentTable appointments={appointments} />
        </div>
      </div>
    );
  }

  // 3. GIAO DIỆN NURSE (TIẾP ĐÓN & NỘI TRÚ)
  if (user.role === 'NURSE') {
    return (
      <div className="pb-10">
        {renderHeader()}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
           <StatCard title="Lịch hẹn mới" value={stats.newAppointments} color="yellow" onClick={() => navigate('/booking')} />
           <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-purple-500">
              <p className="text-sm text-gray-500">Giường trống</p>
              <h3 className="text-2xl font-bold text-purple-700">{bedStats.available}/{bedStats.total}</h3>
           </div>
        </div>
        <WaitlistTable waitingList={waitingList} title="Danh sách chờ tiếp nhận" />
      </div>
    );
  }

  // 4. GIAO DIỆN TECHNICIAN (NHIỆM VỤ)
  if (user.role === 'TECHNICIAN') {
    return (
      <div className="pb-10">
        {renderHeader()}
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-purple-600">
           <h3 className="text-xl font-bold text-gray-800 mb-4">🧪 Yêu cầu xét nghiệm ({pendingServices.length})</h3>
           <div className="space-y-3">
             {pendingServices.length > 0 ? pendingServices.map(req => (
               <div key={req.request_id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-purple-50 border border-gray-200">
                 <div>
                   <p className="font-bold text-purple-700">{req.service_name}</p>
                   <p className="text-sm text-gray-600">Lượt khám #{req.visit_id}</p>
                 </div>
                 <button className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700">Thực hiện</button>
               </div>
             )) : <p className="text-center py-10 text-gray-400">Không có yêu cầu nào.</p>}
           </div>
        </div>
      </div>
    );
  }

  // 5. GIAO DIỆN PATIENT (HỒ SƠ CÁ NHÂN)
  if (user.role === 'PATIENT') {
    return (
      <div className="pb-10 max-w-4xl mx-auto">
         {renderHeader()}
         <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-green-500 to-teal-500 p-6 text-white">
               <h2 className="text-2xl font-bold">Hồ sơ sức khỏe</h2>
               <p className="opacity-90">Lịch sử khám chữa bệnh của bạn</p>
            </div>
            <div className="p-6">
               {myHistory ? (
                  <div>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-center">
                        <div className="bg-gray-50 p-3 rounded"><p className="text-xs text-gray-500">HỌ TÊN</p><p className="font-bold">{myHistory.full_name}</p></div>
                        <div className="bg-gray-50 p-3 rounded"><p className="text-xs text-gray-500">BHYT</p><p className="font-bold text-blue-600">{myHistory.insurance_card || '--'}</p></div>
                        <div className="bg-gray-50 p-3 rounded"><p className="text-xs text-gray-500">SỐ LẦN KHÁM</p><p className="font-bold text-green-600">{myHistory.visits?.length || 0}</p></div>
                     </div>
                     <h3 className="font-bold text-gray-700 mb-3 border-b pb-2">Lịch sử khám gần đây</h3>
                     <div className="space-y-4">
                        {myHistory.visits?.length > 0 ? myHistory.visits.map((v, idx) => (
                           <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                              <div>
                                 <p className="font-bold text-gray-800">{new Date(v.visit_date).toLocaleDateString('vi-VN')}</p>
                                 <p className="text-sm text-gray-600">{v.diagnosis || 'Chưa có chẩn đoán'}</p>
                              </div>
                              <span className="px-3 py-1 bg-white border rounded text-xs font-semibold text-gray-500">{v.status}</span>
                           </div>
                        )) : <p className="text-gray-500">Chưa có lịch sử khám.</p>}
                     </div>
                  </div>
               ) : <p className="text-center py-8">Đang tải hồ sơ...</p>}
            </div>
         </div>
      </div>
    );
  }

  if (loading) return <div className="p-10 text-center animate-pulse text-gray-500">Đang khởi tạo Dashboard...</div>;
  return null;
};

// --- COMPONENT CON (Để code gọn gàng) ---

const StatCard = ({ title, value, color, onClick }) => (
  <div onClick={onClick} className={`bg-white p-5 rounded-lg shadow-sm border-l-4 border-${color}-500 ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}>
     <p className="text-sm text-gray-500 mb-1">{title}</p>
     <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
  </div>
);

const AppointmentTable = ({ appointments }) => (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
    <div className="p-4 border-b bg-gray-50 flex justify-between"><h3 className="font-bold text-gray-700">Lịch hẹn hôm nay</h3></div>
    <table className="w-full text-sm text-left">
       <thead className="bg-gray-100 text-gray-600 text-xs uppercase"><tr><th className="px-4 py-3">Giờ</th><th className="px-4 py-3">Bệnh nhân</th><th className="px-4 py-3">TT</th></tr></thead>
       <tbody>
          {appointments.length > 0 ? appointments.map(a => (
             <tr key={a.appointment_id} className="hover:bg-gray-50 border-b">
                <td className="px-4 py-3 font-medium">{a.start_time.substring(0, 5)}</td>
                <td className="px-4 py-3">{a.patient_name || `#${a.patient_id}`}</td>
                <td className="px-4 py-3"><span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">{a.status}</span></td>
             </tr>
          )) : <tr><td colSpan="3" className="p-4 text-center text-gray-400">Không có lịch hẹn</td></tr>}
       </tbody>
    </table>
  </div>
);

const WaitlistTable = ({ waitingList, title = "Hàng đợi khám" }) => (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
    <div className="p-4 border-b bg-gray-50 flex justify-between"><h3 className="font-bold text-gray-700">{title}</h3></div>
    <table className="w-full text-sm text-left">
       <thead className="bg-gray-100 text-gray-600 text-xs uppercase"><tr><th className="px-4 py-3">Mức độ</th><th className="px-4 py-3">ID</th><th className="px-4 py-3">Vấn đề</th></tr></thead>
       <tbody>
          {waitingList.length > 0 ? waitingList.map(v => (
             <tr key={v.visit_id} className="hover:bg-gray-50 border-b">
                <td className="px-4 py-3 font-bold">
                   {v.priority === 'EMERGENCY' ? <span className="text-red-600 animate-pulse">CẤP CỨU</span> : v.priority === 'HIGH' ? <span className="text-orange-500">Cao</span> : <span className="text-green-600">Thường</span>}
                </td>
                <td className="px-4 py-3">#{v.patient_id}</td>
                <td className="px-4 py-3 truncate max-w-[120px]">{v.chief_complaint}</td>
             </tr>
          )) : <tr><td colSpan="3" className="p-4 text-center text-gray-400">Hàng đợi trống</td></tr>}
       </tbody>
    </table>
  </div>
);

export default Dashboard;