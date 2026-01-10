# TÀI LIỆU DỰ ÁN HỆ THỐNG QUẢN LÝ BỆNH VIỆN

## 📋 MỤC LỤC
1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Cấu trúc dự án](#2-cấu-trúc-dự-án)
3. [Công nghệ sử dụng](#3-công-nghệ-sử-dụng)
4. [Cơ sở dữ liệu](#4-cơ-sở-dữ-liệu)
5. [Chức năng hệ thống](#5-chức-năng-hệ-thống)
6. [Hướng dẫn cài đặt](#6-hướng-dẫn-cài-đặt)

---

## 1. TỔNG QUAN DỰ ÁN

### 📌 Tên dự án
**Hospital Management System (Hệ thống Quản lý Bệnh viện)**

### 📄 Mô tả
Hệ thống quản lý bệnh viện toàn diện, hỗ trợ quản lý bệnh nhân, lịch hẹn, khám bệnh, kê đơn thuốc, thanh toán, quản lý kho thuốc, quản lý nội trú, và báo cáo thống kê.

### 🎯 Mục tiêu
- Tự động hóa quy trình quản lý bệnh viện
- Quản lý hồ sơ bệnh án điện tử
- Tối ưu hóa quy trình khám chữa bệnh
- Quản lý kho thuốc và vật tư y tế
- Hỗ trợ đặt lịch hẹn trực tuyến
- Theo dõi bệnh nhân nội trú
- Báo cáo và thống kê dữ liệu

---

## 2. CẤU TRÚC DỰ ÁN

```
hospital_manager/
│
├── hospital-backend/           # Backend API (Python FastAPI)
│   ├── main.py                # File chính chứa API endpoints
│   ├── models.py              # Định nghĩa các models database
│   ├── schemas.py             # Pydantic schemas cho validation
│   ├── database.py            # Cấu hình kết nối database
│   ├── security.py            # Xử lý authentication & authorization
│   ├── __pycache__/           # Python cache files
│   └── uploads/               # Thư mục lưu file upload
│
├── hospital-frontend/          # Frontend (React + Vite)
│   ├── public/                # Static files
│   ├── src/
│   │   ├── assets/            # Images, icons, etc.
│   │   ├── components/        # React components
│   │   │   ├── MainLayout.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── ServiceRequestManager.jsx
│   │   ├── pages/             # Các trang chính
│   │   │   ├── AdminReport.jsx
│   │   │   ├── AdminUsers.jsx
│   │   │   ├── AppointmentManager.jsx
│   │   │   ├── Booking.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── DoctorRoom.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── InpatientDetail.jsx
│   │   │   ├── InpatientList.jsx
│   │   │   ├── InpatientMap.jsx
│   │   │   ├── InventoryAlerts.jsx
│   │   │   ├── InventoryImport.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── PatientDetail.jsx
│   │   │   ├── Patients.jsx
│   │   │   ├── Payment.jsx
│   │   │   ├── Pharmacy.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Reception.jsx
│   │   │   ├── Register.jsx
│   │   │   └── TechnicianDashboard.jsx
│   │   ├── services/          # API services
│   │   │   └── api.js
│   │   ├── utils/             # Utility functions
│   │   │   └── roleGuard.js
│   │   ├── App.jsx            # Root component
│   │   ├── App.css            # App styles
│   │   ├── main.jsx           # Entry point
│   │   └── index.css          # Global styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── eslint.config.js
│
├── package.json               # Root package.json
└── README.md
```

---

## 3. CÔNG NGHỆ SỬ DỤNG

### 🔧 Backend (Python)

#### Ngôn ngữ lập trình
- **Python** (Version 3.x)

#### Framework và thư viện chính
- **FastAPI** - Framework web hiện đại, nhanh (hiệu suất cao)
- **SQLAlchemy** - ORM (Object-Relational Mapping)
- **PyMySQL** - Driver kết nối MySQL
- **Pydantic** - Data validation và settings management
- **FastAPI-Mail** - Gửi email (reset password, thông báo)
- **python-jose** - JWT token authentication
- **passlib[bcrypt]** - Mã hóa mật khẩu
- **Pandas** - Xử lý và xuất báo cáo Excel

### 🎨 Frontend (JavaScript/React)

#### Ngôn ngữ lập trình
- **JavaScript (ES6+)** / **JSX**

#### Framework và thư viện chính
- **React** (v19.2.0) - Thư viện UI component-based
- **Vite** (v7.2.4) - Build tool và dev server nhanh
- **React Router DOM** (v7.11.0) - Client-side routing
- **Axios** (v1.13.2) - HTTP client cho API calls
- **Tailwind CSS** (v3.4.19) - Utility-first CSS framework
- **Recharts** (v3.6.0) - Thư viện biểu đồ
- **React DatePicker** (v9.1.0) - Date picker component
- **date-fns** (v4.1.0) - Thư viện xử lý ngày tháng
- **Lucide React** - Icon library

#### Build Tools & DevDependencies
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

---

## 4. CƠ SỞ DỮ LIỆU

### 🗄️ Database Management System
- **MySQL** (hoặc MariaDB)

### 📊 Cấu hình kết nối
```python
Database: hospital_db
Host: localhost
User: root
Password: 123456
Port: 3306 (default)
```

### 📋 Các bảng chính (Tables)

#### 1. **Users** - Quản lý người dùng
- user_id (PK)
- username, password
- full_name, email, phone, address
- role: ADMIN, DOCTOR, NURSE, PATIENT, TECHNICIAN
- reset_token, reset_token_exp (cho reset password)
- created_at

#### 2. **Patients** - Hồ sơ bệnh nhân
- patient_id (PK)
- full_name, dob, gender, phone
- insurance_card, cccd, email, address
- emergency_contact
- blood_type, height, weight
- allergies, medical_history
- is_active, created_at
- account_id (FK → Users)

#### 3. **Visits** - Lượt khám bệnh
- visit_id (PK)
- patient_id (FK → Patients)
- doctor_id (FK → Users)
- visit_date, diagnosis
- status: WAITING, IN_PROGRESS, COMPLETED, PAID
- chief_complaint (lý do khám)
- pulse, temperature, blood_pressure, respiratory_rate
- priority: NORMAL, HIGH, EMERGENCY
- clinical_symptoms, icd10, advice, follow_up_date

#### 4. **Medicines** - Kho thuốc
- medicine_id (PK)
- name, active_ingredient, category, unit, dosage
- price, import_price, stock_quantity
- expiry_date, batch_number, manufacturer
- usage_instruction, created_at

#### 5. **Prescriptions** - Đơn thuốc
- prescription_id (PK)
- visit_id (FK → Visits)
- medicine_id (FK → Medicines)
- quantity, note
- dosage_morning, dosage_noon, dosage_afternoon, dosage_evening
- usage_instruction

#### 6. **Invoices** - Hóa đơn thanh toán
- invoice_id (PK)
- visit_id (FK → Visits)
- payment_time
- medicine_total, exam_fee, procedure_fee
- insurance_percent, final_amount
- payment_method: CASH, TRANSFER, CARD

#### 7. **DoctorSchedules** - Lịch làm việc bác sĩ
- schedule_id (PK)
- doctor_id (FK → Users)
- day_of_week (0-6: CN-T7)
- shift_start, shift_end
- is_active

#### 8. **Appointments** - Lịch hẹn
- appointment_id (PK)
- patient_id (FK → Patients)
- doctor_id (FK → Users)
- appointment_date, start_time, end_time
- reason
- status: PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW
- created_at

#### 9. **Services** - Dịch vụ cận lâm sàng
- service_id (PK)
- name, type (LAB, IMAGING, OTHER)
- price, description, is_active

#### 10. **ServiceRequests** - Yêu cầu dịch vụ
- request_id (PK)
- visit_id (FK → Visits)
- service_id (FK → Services)
- doctor_id (FK → Users)
- quantity, status: PENDING, COMPLETED, CANCELLED
- created_at

#### 11. **ServiceResults** - Kết quả dịch vụ
- result_id (PK)
- request_id (FK → ServiceRequests)
- technician_id (FK → Users)
- result_data, image_url, conclusion
- performed_at

#### 12. **Departments** - Khoa/Phòng
- department_id (PK)
- name, location

#### 13. **Rooms** - Phòng bệnh
- room_id (PK)
- department_id (FK → Departments)
- room_number, type (STANDARD, VIP, ISOLATION)
- base_price

#### 14. **Beds** - Giường bệnh
- bed_id (PK)
- room_id (FK → Rooms)
- bed_number
- status: AVAILABLE, OCCUPIED, MAINTENANCE, CLEANING

#### 15. **InpatientRecords** - Hồ sơ nội trú
- inpatient_id (PK)
- patient_id (FK → Patients)
- treating_doctor_id (FK → Users)
- admission_date, discharge_date
- initial_diagnosis
- status: ACTIVE, DISCHARGED, TRANSFERRED

#### 16. **BedAllocations** - Phân bổ giường
- allocation_id (PK)
- inpatient_id (FK → InpatientRecords)
- bed_id (FK → Beds)
- check_in_time, check_out_time
- price_per_day

#### 17. **DailyOrders** - Y lệnh hàng ngày
- order_id (PK)
- inpatient_id (FK → InpatientRecords)
- doctor_id (FK → Users)
- date, progress_note, doctor_instruction
- nurse_notes, vitals (JSON)

#### 18. **Suppliers** - Nhà cung cấp
- supplier_id (PK)
- name, contact_person, email, phone
- address, tax_code

#### 19. **MedicalSupplies** - Vật tư y tế
- supply_id (PK)
- name, code, category (CONSUMABLE, EQUIPMENT)
- unit, price, stock_quantity, min_stock_level

#### 20. **ImportReceipts** - Phiếu nhập kho
- receipt_id (PK)
- supplier_id (FK → Suppliers)
- created_by (FK → Users)
- import_date, total_amount
- status: DRAFT, COMPLETED, CANCELLED
- note

#### 21. **ImportDetails** - Chi tiết nhập kho
- detail_id (PK)
- receipt_id (FK → ImportReceipts)
- item_type (MEDICINE, SUPPLY)
- item_id, quantity, import_price
- batch_number, expiry_date

---

## 5. CHỨC NĂNG HỆ THỐNG

### 🔐 Xác thực & Phân quyền
- ✅ **Đăng nhập/Đăng ký** (Login/Register)
- ✅ **Quên mật khẩu** (Forgot Password) - Gửi OTP qua email
- ✅ **Đặt lại mật khẩu** (Reset Password)
- ✅ **Phân quyền theo vai trò** (Role-based Access Control)
  - ADMIN: Quản trị hệ thống
  - DOCTOR: Bác sĩ khám bệnh
  - NURSE: Y tá hỗ trợ
  - PATIENT: Bệnh nhân
  - TECHNICIAN: Kỹ thuật viên xét nghiệm/chẩn đoán hình ảnh

### 👥 Quản lý người dùng (Admin)
- ✅ **Tạo tài khoản người dùng mới**
- ✅ **Xem danh sách người dùng**
- ✅ **Cập nhật thông tin người dùng**
- ✅ **Xem và chỉnh sửa hồ sơ cá nhân**

### 🏥 Quản lý bệnh nhân (Patient Management)
- ✅ **Thêm bệnh nhân mới** - Nhập đầy đủ thông tin
- ✅ **Xem danh sách bệnh nhân** - Tìm kiếm, lọc
- ✅ **Xem chi tiết hồ sơ bệnh án** - Lịch sử khám, đơn thuốc
- ✅ **Cập nhật thông tin bệnh nhân**
- ✅ **Quản lý hồ sơ sức khỏe** - Tiền sử bệnh, dị ứng, nhóm máu

### 📅 Quản lý lịch hẹn (Appointment Management)
- ✅ **Đặt lịch hẹn** (Booking) - Chọn bác sĩ, ngày giờ
- ✅ **Xem lịch hẹn** - Theo ngày, bác sĩ
- ✅ **Xác nhận/Hủy lịch hẹn**
- ✅ **Quản lý lịch làm việc bác sĩ**
- ✅ **Chuyển lịch hẹn thành lượt khám**

### 🩺 Quản lý khám bệnh (Medical Examination)
- ✅ **Tiếp nhận bệnh nhân** (Reception) - Tạo lượt khám
- ✅ **Phòng khám bác sĩ** (Doctor Room)
  - Xem danh sách bệnh nhân chờ khám
  - Nhập triệu chứng lâm sàng, sinh hiệu
  - Chẩn đoán bệnh (ICD-10)
  - Kê đơn thuốc
  - Chỉ định dịch vụ cận lâm sàng
  - Lời khuyên và hẹn tái khám
- ✅ **Quản lý trạng thái lượt khám**
  - WAITING: Chờ khám
  - IN_PROGRESS: Đang khám
  - COMPLETED: Hoàn thành khám
  - PAID: Đã thanh toán

### 💊 Quản lý kho thuốc (Pharmacy Management)
- ✅ **Thêm thuốc mới** - Thông tin chi tiết
- ✅ **Xem danh sách thuốc** - Tìm kiếm, lọc
- ✅ **Cập nhật tồn kho**
- ✅ **Cảnh báo thuốc sắp hết hạn** (Expiry Alert)
- ✅ **Cảnh báo thuốc sắp hết tồn kho** (Low Stock Alert)
- ✅ **Xuất thuốc theo đơn**
- ✅ **Nhập kho thuốc** (Import)
- ✅ **Quản lý nhà cung cấp**
- ✅ **Lịch sử nhập/xuất thuốc**

### 🧪 Quản lý dịch vụ cận lâm sàng (Service Management)
- ✅ **Quản lý danh mục dịch vụ**
  - Xét nghiệm (LAB)
  - Chẩn đoán hình ảnh (IMAGING)
  - Khác (OTHER)
- ✅ **Yêu cầu dịch vụ** từ bác sĩ
- ✅ **Quản lý yêu cầu** - Pending, Completed, Cancelled
- ✅ **Nhập kết quả** (Technician Dashboard)
- ✅ **Xem kết quả xét nghiệm/chẩn đoán**

### 💰 Quản lý thanh toán (Payment Management)
- ✅ **Tính toán hóa đơn tự động**
  - Phí khám (Exam Fee)
  - Tiền thuốc (Medicine Total)
  - Chi phí dịch vụ (Procedure Fee)
  - Giảm trừ bảo hiểm (Insurance)
- ✅ **Thanh toán** - Tiền mặt, chuyển khoản, thẻ
- ✅ **In hóa đơn**
- ✅ **Lịch sử thanh toán**

### 🏨 Quản lý nội trú (Inpatient Management)
- ✅ **Nhập viện** - Tạo hồ sơ nội trú
- ✅ **Phân bổ giường bệnh**
- ✅ **Xem bản đồ giường** (Bed Map)
- ✅ **Quản lý y lệnh hàng ngày**
- ✅ **Ghi chép tiến triển bệnh**
- ✅ **Theo dõi sinh hiệu**
- ✅ **Xuất viện**
- ✅ **Chuyển khoa/chuyển giường**

### 📊 Báo cáo & Thống kê (Reports & Analytics)
- ✅ **Dashboard tổng quan**
  - Số lượng bệnh nhân
  - Doanh thu
  - Lượt khám trong ngày
  - Tình trạng giường bệnh
- ✅ **Báo cáo doanh thu** - Theo ngày, tuần, tháng
- ✅ **Báo cáo bệnh nhân** - Thống kê theo tuổi, giới tính
- ✅ **Báo cáo thuốc** - Xuất nhập tồn
- ✅ **Xuất báo cáo Excel** - Pandas

### 🔔 Thông báo & Cảnh báo (Notifications & Alerts)
- ✅ **Cảnh báo thuốc hết hạn**
- ✅ **Cảnh báo thuốc sắp hết tồn**
- ✅ **Cảnh báo vật tư y tế thiếu**
- ✅ **Thông báo lịch hẹn** (qua email)

### 📱 Tính năng khác
- ✅ **Responsive Design** - Tương thích mobile
- ✅ **Tìm kiếm & Lọc** - Trên tất cả các module
- ✅ **Phân trang** - Xử lý dữ liệu lớn
- ✅ **Upload file** - Ảnh, tài liệu
- ✅ **Dark Mode Support** (có thể mở rộng)

---

## 6. HƯỚNG DẪN CÀI ĐẶT

### 📋 Yêu cầu hệ thống

#### Backend
- Python 3.8+
- MySQL 8.0+ hoặc MariaDB 10.5+
- pip (Python package manager)

#### Frontend
- Node.js 16+
- npm hoặc yarn

### 🚀 Cài đặt Backend

1. **Di chuyển vào thư mục backend:**
```bash
cd hospital-backend
```

2. **Tạo virtual environment (khuyến nghị):**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# hoặc
venv\Scripts\activate  # Windows
```

3. **Cài đặt dependencies:**
```bash
pip install fastapi uvicorn sqlalchemy pymysql python-jose[cryptography] passlib[bcrypt] python-multipart fastapi-mail pydantic[email] pandas openpyxl
```

4. **Cấu hình database:**
   - Tạo database MySQL:
   ```sql
   CREATE DATABASE hospital_db;
   ```
   - Cập nhật thông tin kết nối trong `database.py`:
   ```python
   SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:123456@localhost/hospital_db"
   ```

5. **Chạy migration (tạo tables):**
```python
# Trong Python console hoặc tạo file init_db.py:
from database import engine, Base
import models

Base.metadata.create_all(bind=engine)
```

6. **Chạy server:**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Server sẽ chạy tại: http://localhost:8000
API Docs (Swagger UI): http://localhost:8000/docs

### 🎨 Cài đặt Frontend

1. **Di chuyển vào thư mục frontend:**
```bash
cd hospital-frontend
```

2. **Cài đặt dependencies:**
```bash
npm install
```

3. **Cấu hình API endpoint:**
   - Cập nhật URL API trong `src/services/api.js`:
   ```javascript
   const API_URL = "http://localhost:8000";
   ```

4. **Chạy development server:**
```bash
npm run dev
```

Frontend sẽ chạy tại: http://localhost:5173

### 🔧 Cấu hình Email (cho chức năng quên mật khẩu)

Cập nhật thông tin email trong `main.py`:
```python
conf = ConnectionConfig(
    MAIL_USERNAME="your-email@gmail.com",
    MAIL_PASSWORD="your-app-password",
    MAIL_FROM="your-email@gmail.com",
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)
```

### 📦 Build Production

#### Backend
```bash
# Cài đặt gunicorn (production server)
pip install gunicorn

# Chạy với gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

#### Frontend
```bash
npm run build
```
File build sẽ được tạo trong thư mục `dist/`

---

## 📞 LIÊN HỆ & HỖ TRỢ

### Repository
- GitHub: TuyenPV2004/Hospital-Management-System

### Phiên bản
- Backend: 1.0.0
- Frontend: 0.0.0

### Ngày cập nhật
- Tháng 1/2026

---

## 📝 GHI CHÚ

### Các điểm cần lưu ý:
1. **Bảo mật**: Hệ thống sử dụng JWT token và bcrypt để bảo mật
2. **CORS**: Cần cấu hình CORS trong FastAPI cho production
3. **Backup**: Nên có kế hoạch backup database định kỳ
4. **Scale**: Có thể mở rộng với Redis cache, message queue
5. **Testing**: Nên bổ sung unit tests và integration tests

### Tính năng có thể mở rộng:
- [ ] Tích hợp thanh toán online (VNPay, MoMo)
- [ ] Tích hợp video call cho tư vấn từ xa
- [ ] Mobile app (React Native)
- [ ] Tích hợp AI cho chẩn đoán hỗ trợ
- [ ] Quản lý block chain cho hồ sơ bệnh án
- [ ] Tích hợp thiết bị đo sinh hiệu IoT

---

**© 2026 Hospital Management System - All Rights Reserved**

