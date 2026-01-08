import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State cho Modal Edit
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      // Gọi song song: Lấy thông tin & Lấy lịch sử chi tiết
      const [infoRes, historyRes] = await Promise.all([
        api.get(`/patients/${id}`),
        api.get(`/patients/${id}/history-detail`).catch(() => ({ data: [] })) // Fallback nếu lỗi
      ]);
      
      setPatient(infoRes.data);
      setEditForm(infoRes.data); // Pre-fill form
      setHistory(historyRes.data);
    } catch (error) {
      console.error("Lỗi tải chi tiết:", error);
      alert("Không tìm thấy bệnh nhân hoặc có lỗi xảy ra");
      navigate('/patients');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý Cập nhật thông tin
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const { cccd, insurance_card, ...updateData } = editForm; // Loại bỏ các trường cấm sửa nếu cần
      await api.put(`/patients/${id}`, updateData);
      alert("Cập nhật thành công!");
      setIsEditOpen(false);
      fetchDetail(); // Refresh data
    } catch (error) {
      alert("Lỗi cập nhật: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleInputChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-gray-500">Đang tải hồ sơ bệnh án...</div>;
  if (!patient) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      
      {/* 1. HEADER & ACTIONS */}
      <div className="flex justify-between items-start">
         <button onClick={() => navigate('/patients')} className="text-gray-500 hover:text-blue-600 flex items-center gap-1">
            ← Quay lại danh sách
         </button>
         <div className="space-x-2">
            <button onClick={() => setIsEditOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition">
               ✏️ Cập nhật hồ sơ
            </button>
         </div>
      </div>

      {/* 2. PROFILE CARD */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
         <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex justify-between items-center">
            <div>
               <h1 className="text-3xl font-bold">{patient.full_name}</h1>
               <p className="opacity-90 mt-1">Mã BN: #{patient.patient_id} | {new Date(patient.dob).toLocaleDateString('vi-VN')} ({new Date().getFullYear() - new Date(patient.dob).getFullYear()} tuổi)</p>
            </div>
            <div className="text-right hidden md:block">
               <div className="text-2xl font-bold">{patient.insurance_card || 'Không BHYT'}</div>
               <div className="text-sm opacity-80">Mã thẻ BHYT</div>
            </div>
         </div>
         
         <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cột 1: Thông tin cơ bản */}
            <div className="space-y-4">
               <h3 className="font-bold text-gray-700 uppercase text-xs border-b pb-1">Thông tin liên hệ</h3>
               <InfoRow label="Điện thoại" value={patient.phone || '--'} />
               <InfoRow label="CCCD" value={patient.cccd || '--'} />
               <InfoRow label="Email" value={patient.email || '--'} />
               <InfoRow label="Địa chỉ" value={patient.address} />
            </div>

            {/* Cột 2: Chỉ số sức khỏe */}
            <div className="space-y-4">
               <h3 className="font-bold text-gray-700 uppercase text-xs border-b pb-1">Chỉ số & Khẩn cấp</h3>
               <div className="grid grid-cols-2 gap-4">
                  <InfoBox label="Nhóm máu" value={patient.blood_type || '?'} color="red" />
                  <InfoBox label="Giới tính" value={patient.gender} color="blue" />
                  <InfoBox label="Chiều cao" value={patient.height ? `${patient.height} cm` : '--'} />
                  <InfoBox label="Cân nặng" value={patient.weight ? `${patient.weight} kg` : '--'} />
               </div>
               <div className="pt-2">
                  <p className="text-xs text-gray-500">Liên hệ khẩn cấp:</p>
                  <p className="font-medium text-red-600">{patient.emergency_contact || 'Chưa cập nhật'}</p>
               </div>
            </div>

            {/* Cột 3: Tiền sử (Quan trọng) */}
            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
               <h3 className="font-bold text-red-700 uppercase text-xs mb-3 flex items-center gap-2">
                  ⚠️ Cảnh báo Y khoa
               </h3>
               <div className="space-y-3">
                  <div>
                     <p className="text-xs text-gray-500 font-bold">Dị ứng:</p>
                     <p className="text-sm text-gray-800">{patient.allergies || 'Không ghi nhận'}</p>
                  </div>
                  <div>
                     <p className="text-xs text-gray-500 font-bold">Tiền sử bệnh:</p>
                     <p className="text-sm text-gray-800">{patient.medical_history || 'Không ghi nhận'}</p>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* 3. HISTORY TIMELINE (Lịch sử chi tiết) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
         <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            🏥 Lịch sử khám bệnh ({history.length})
         </h2>

         <div className="relative border-l-2 border-gray-200 ml-4 space-y-8">
            {history.length > 0 ? history.map((visit, index) => (
               <div key={visit.visit_id} className="relative pl-8">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[9px] top-0 w-4 h-4 bg-blue-500 rounded-full border-4 border-white shadow-sm"></div>
                  
                  {/* Visit Card */}
                  <div className="bg-gray-50 rounded-lg p-4 hover:bg-white hover:shadow-md transition border border-gray-200">
                     {/* Header Lượt khám */}
                     <div className="flex flex-col md:flex-row justify-between mb-3 border-b border-gray-200 pb-2">
                        <div>
                           <span className="text-blue-700 font-bold text-lg mr-2">{new Date(visit.visit_date).toLocaleDateString('vi-VN')}</span>
                           <span className="text-gray-500 text-sm">({new Date(visit.visit_date).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})})</span>
                        </div>
                        <div className="flex gap-2 items-center mt-2 md:mt-0">
                           <span className="text-sm font-medium text-gray-600">{visit.doctor_name || 'Bác sĩ ???'}</span>
                           <span className={`text-xs px-2 py-1 rounded-full ${visit.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {visit.status}
                           </span>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Chẩn đoán */}
                        <div>
                           <p className="text-sm font-bold text-gray-700">Lý do khám:</p>
                           <p className="text-gray-800 mb-2">{visit.chief_complaint}</p>
                           <p className="text-sm font-bold text-gray-700">Chẩn đoán:</p>
                           <p className="text-gray-800 font-medium">{visit.diagnosis || 'Chưa có kết luận'}</p>
                        </div>

                        {/* Chi tiết Thuốc & Dịch vụ (Nested Data) */}
                        <div className="space-y-3 text-sm">
                           {/* Danh sách thuốc */}
                           {visit.prescriptions.length > 0 && (
                              <div className="bg-white p-3 rounded border border-blue-100">
                                 <p className="font-bold text-blue-600 mb-1">💊 Đơn thuốc:</p>
                                 <ul className="list-disc list-inside space-y-1 text-gray-700">
                                    {visit.prescriptions.map((p, idx) => (
                                       <li key={idx}>
                                          <span className="font-medium">{p.medicine_name}</span> 
                                          <span className="text-gray-500"> (x{p.quantity} {p.unit})</span> - {p.usage_instruction}
                                       </li>
                                    ))}
                                 </ul>
                              </div>
                           )}

                           {/* Danh sách dịch vụ */}
                           {visit.service_requests.length > 0 && (
                              <div className="bg-white p-3 rounded border border-purple-100">
                                 <p className="font-bold text-purple-600 mb-1">🧪 Dịch vụ/Xét nghiệm:</p>
                                 <ul className="space-y-2">
                                    {visit.service_requests.map((s, idx) => (
                                       <li key={idx} className="flex justify-between items-start border-b border-gray-50 pb-1 last:border-0">
                                          <div>
                                             <span className="font-medium text-gray-800">{s.service_name}</span>
                                             {s.result_conclusion && <p className="text-xs text-green-600 mt-0.5">KQ: {s.result_conclusion}</p>}
                                          </div>
                                          <span className="text-[10px] bg-gray-100 px-1 rounded">{s.status}</span>
                                       </li>
                                    ))}
                                 </ul>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
            )) : (
               <p className="text-gray-500 italic pl-8">Chưa có lịch sử khám bệnh nào.</p>
            )}
         </div>
      </div>

      {/* 4. MODAL EDIT (Ẩn hiện theo state) */}
      {isEditOpen && (
         <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
               <div className="p-6 border-b flex justify-between items-center">
                  <h3 className="text-xl font-bold">Cập nhật hồ sơ bệnh nhân</h3>
                  <button onClick={() => setIsEditOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
               </div>
               <form onSubmit={handleUpdate} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormInput label="Họ và tên" name="full_name" value={editForm.full_name} onChange={handleInputChange} />
                     <FormInput label="Số điện thoại" name="phone" value={editForm.phone} onChange={handleInputChange} />
                     <FormInput label="Email" name="email" value={editForm.email} onChange={handleInputChange} />
                     <FormInput label="Địa chỉ" name="address" value={editForm.address} onChange={handleInputChange} />
                     <FormInput label="Chiều cao (cm)" name="height" type="number" value={editForm.height} onChange={handleInputChange} />
                     <FormInput label="Cân nặng (kg)" name="weight" type="number" value={editForm.weight} onChange={handleInputChange} />
                     <FormInput label="Nhóm máu" name="blood_type" value={editForm.blood_type} onChange={handleInputChange} />
                     <FormInput label="LH Khẩn cấp" name="emergency_contact" value={editForm.emergency_contact} onChange={handleInputChange} />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Tiền sử dị ứng</label>
                        <textarea name="allergies" value={editForm.allergies || ''} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 h-20"></textarea>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Tiền sử bệnh lý</label>
                        <textarea name="medical_history" value={editForm.medical_history || ''} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 h-20"></textarea>
                     </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t">
                     <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200">Hủy</button>
                     <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700">Lưu thay đổi</button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};

// Component con hỗ trợ hiển thị
const InfoRow = ({ label, value }) => (
   <div className="flex justify-between border-b border-gray-100 py-2 last:border-0">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="font-medium text-gray-800 text-right">{value}</span>
   </div>
);

const InfoBox = ({ label, value, color = 'gray' }) => (
   <div className={`bg-${color}-50 p-3 rounded text-center border border-${color}-100`}>
      <p className={`text-xs text-${color}-500 uppercase font-bold`}>{label}</p>
      <p className={`font-bold text-${color}-800 text-lg`}>{value}</p>
   </div>
);

const FormInput = ({ label, type = "text", ...props }) => (
   <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} className="block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" {...props} />
   </div>
);

export default PatientDetail;