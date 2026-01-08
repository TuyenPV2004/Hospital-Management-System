// src/components/MainLayout.jsx
import Navbar from './Navbar';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar /> {/* Đây là Sidebar duy nhất (Hospital Manager mới) */}
      
      {/* md:ml-64 để đẩy nội dung sang phải, tránh bị Sidebar che */}
      <main className="transition-all duration-300 md:ml-64 p-4 pt-20 md:p-8">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;