import { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const Patients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State quản lý Modal thêm mới (nếu cần dùng chung) hoặc thông báo
  const [message, setMessage] = useState(null);

  // Fetch danh sách bệnh nhân
  const fetchPatients = async (query = '') => {
    try {
      setLoading(true);
      const url = query ? `/patients?search=${query}` : '/patients';
      const response = await api.get(url);
      // Lọc client-side những bệnh nhân active (nếu API chưa lọc)
      const activePatients = response.data.filter(p => p.is_active !== false);
      setPatients(activePatients);
    } catch (error) {
      console.error("Lỗi tải danh sách:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Xử lý tìm kiếm (Debounce đơn giản)
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    // Gọi API tìm kiếm ngay hoặc đợi (ở đây gọi luôn cho mượt)
    fetchPatients(term);
  };

  // Xử lý Xóa mềm (Soft Delete)
  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa hồ sơ bệnh nhân này? Dữ liệu lịch sử sẽ được bảo lưu.')) {
      try {
        await api.delete(`/patients/${id}`);
        setMessage({ type: 'success', content: 'Đã xóa hồ sơ bệnh nhân thành công' });
        fetchPatients(searchTerm); // Refresh list
      } catch (error) {
        setMessage({ type: 'error', content: 'Lỗi khi xóa bệnh nhân: ' + error.response?.data?.detail });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Hồ sơ Bệnh nhân</h1>
          <p className="text-sm text-gray-500">Tra cứu, chỉnh sửa và quản lý thông tin hành chính</p>
        </div>
        <button 
          onClick={() => navigate('/reception')} // Hoặc mở Modal tạo mới
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition flex items-center gap-2"
        >
          <span>+ Thêm mới</span>
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Tìm kiếm theo Tên, SĐT, CCCD hoặc Mã BHYT..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={handleSearch}
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
      </div>

      {/* MESSAGE */}
      {message && (
        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.content}
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 uppercase font-bold text-xs">
              <tr>
                <th className="px-6 py-3">Mã BN</th>
                <th className="px-6 py-3">Họ và Tên</th>
                <th className="px-6 py-3">Ngày sinh / Giới tính</th>
                <th className="px-6 py-3">BHYT / CCCD</th>
                <th className="px-6 py-3">Liên hệ</th>
                <th className="px-6 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-500">Đang tải dữ liệu...</td></tr>
              ) : patients.length > 0 ? (
                patients.map((p) => (
                  <tr key={p.patient_id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900">#{p.patient_id}</td>
                    <td className="px-6 py-4 font-bold text-blue-600 cursor-pointer hover:underline" onClick={() => navigate(`/patients/${p.patient_id}`)}>
                      {p.full_name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{new Date(p.dob).toLocaleDateString('vi-VN')}</div>
                      <div className="text-xs text-gray-500">{p.gender}</div>
                    </td>
                    <td className="px-6 py-4">
                      {p.insurance_card ? (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-mono">{p.insurance_card}</span>
                      ) : <span className="text-gray-400 text-xs">--</span>}
                      <div className="text-xs text-gray-500 mt-1">{p.cccd || 'CCCD: --'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-medium">{p.phone}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[150px]">{p.address}</div>
                    </td>
                    <td className="px-6 py-4 text-center space-x-2">
                       <button 
                         onClick={() => navigate(`/patients/${p.patient_id}`)}
                         className="text-blue-600 hover:text-blue-800 font-medium text-xs border border-blue-200 px-3 py-1 rounded hover:bg-blue-50"
                       >
                         Chi tiết
                       </button>
                       <button 
                         onClick={() => handleDelete(p.patient_id)}
                         className="text-red-600 hover:text-red-800 font-medium text-xs border border-red-200 px-3 py-1 rounded hover:bg-red-50"
                       >
                         Xóa
                       </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="text-center py-8 text-gray-400">Không tìm thấy bệnh nhân nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Patients;