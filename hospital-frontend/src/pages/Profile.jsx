import { useState, useEffect } from 'react';
import api from '../services/api';

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', content: '' });
  
  // Dữ liệu hiển thị (gốc)
  const [profile, setProfile] = useState(null);

  // Form dữ liệu để edit
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    address: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/me');
      setProfile(response.data);
      setFormData(prev => ({
        ...prev,
        username: response.data.username,
        email: response.data.email || '',
        phone: response.data.phone || '',
        address: response.data.address || ''
      }));
    } catch (error) {
      console.error("Lỗi tải profile", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', content: '' });

    // Validate mật khẩu
    if (formData.new_password && formData.new_password !== formData.confirm_password) {
      setMessage({ type: 'error', content: 'Mật khẩu mới không khớp!' });
      return;
    }

    try {
      // Chuẩn bị payload (loại bỏ confirm_password)
      const payload = {
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        current_password: formData.current_password || null,
        new_password: formData.new_password || null
      };

      const res = await api.put('/users/me', payload);
      setMessage({ type: 'success', content: 'Cập nhật hồ sơ thành công!' });
      
      // Reset trường mật khẩu sau khi lưu
      setFormData(prev => ({
        ...prev,
        username: res.data.username, // Update lại nếu đổi username
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));
      
    } catch (error) {
      const msg = error.response?.data?.detail || 'Có lỗi xảy ra khi cập nhật';
      setMessage({ type: 'error', content: msg });
    }
  };

  if (loading) return <div className="p-8 text-center">Đang tải thông tin...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-600 p-4 text-white">
          <h2 className="text-2xl font-bold">Hồ sơ cá nhân</h2>
          <p>Quản lý thông tin tài khoản và bảo mật</p>
        </div>

        <div className="p-6">
          {message.content && (
            <div className={`p-3 mb-4 rounded ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message.content}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* CỘT TRÁI: THÔNG TIN CỐ ĐỊNH (READ-ONLY) */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Thông tin định danh</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Họ và tên</label>
                <input 
                  type="text" 
                  value={profile?.full_name || ''} 
                  disabled 
                  className="mt-1 block w-full bg-gray-100 border-gray-300 rounded-md shadow-sm p-2 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Vai trò</label>
                <span className="inline-block mt-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {profile?.role}
                </span>
              </div>

              {/* Chỉ hiện nếu có thông tin patient_info (thường là User Role Patient) */}
              {profile?.patient_info && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Số CCCD</label>
                    <input 
                      type="text" 
                      value={profile.patient_info.cccd || 'Chưa cập nhật'} 
                      disabled 
                      className="mt-1 block w-full bg-gray-100 border-gray-300 rounded-md shadow-sm p-2 text-gray-600 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">Mã số BHYT</label>
                    <input 
                      type="text" 
                      value={profile.patient_info.insurance_card || 'Không có'} 
                      disabled 
                      className="mt-1 block w-full bg-gray-100 border-gray-300 rounded-md shadow-sm p-2 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                </>
              )}
            </div>

            {/* CỘT PHẢI: THÔNG TIN CÓ THỂ SỬA (EDITABLE) */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Cập nhật thông tin</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tên đăng nhập</label>
                <input 
                  type="text" 
                  name="username"
                  value={formData.username} 
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email} 
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                <input 
                  type="text" 
                  name="phone"
                  value={formData.phone} 
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                <textarea 
                  name="address"
                  value={formData.address} 
                  onChange={handleChange}
                  rows="2"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-gray-200 mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Đổi mật khẩu (Bỏ trống nếu không đổi)</h4>
                <div className="space-y-3">
                  <input 
                    type="password" 
                    name="current_password"
                    placeholder="Mật khẩu hiện tại"
                    value={formData.current_password} 
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="password" 
                      name="new_password"
                      placeholder="Mật khẩu mới"
                      value={formData.new_password} 
                      onChange={handleChange}
                      className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                    />
                    <input 
                      type="password" 
                      name="confirm_password"
                      placeholder="Xác nhận MK mới"
                      value={formData.confirm_password} 
                      onChange={handleChange}
                      className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition duration-150"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;