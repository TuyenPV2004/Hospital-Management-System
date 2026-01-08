// src/components/MainLayout.jsx
import Navbar from './Navbar';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* Thêm padding-top (pt-16) bằng chiều cao của Navbar để nội dung không bị che */}
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;