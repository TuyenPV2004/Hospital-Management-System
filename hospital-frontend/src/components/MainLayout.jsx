// src/components/MainLayout.jsx
import Navbar from './Navbar';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Component */}
      <Navbar />

      {/* Main Content Area */}
      {/* md:ml-64: Đẩy nội dung sang phải 256px (bằng chiều rộng sidebar) trên màn hình Desktop */}
      {/* pt-20 md:pt-6: Padding top để tránh bị che bởi thanh mobile header (chỉ hiện trên mobile) */}
      <main className="transition-all duration-300 md:ml-64 p-4 pt-20 md:p-8">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;