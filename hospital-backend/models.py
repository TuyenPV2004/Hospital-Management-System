# models.py
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, DateTime, Text, DECIMAL
from sqlalchemy.sql import func
from database import Base

# Bảng Users
class User(Base):
    __tablename__ = "Users"

    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    password = Column(String(255))
    full_name = Column(String(100))
    role = Column(Enum('ADMIN', 'DOCTOR', 'NURSE'))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Bảng Patients
# models.py (Cập nhật class Patient)

class Patient(Base):
    __tablename__ = "Patients"

    patient_id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    dob = Column(DateTime) # Lưu ý: Kiểm tra lại kiểu dữ liệu Date hay DateTime trong DB của bạn
    gender = Column(Enum('Nam', 'Nu', 'Khac'))
    phone = Column(String(15))
    insurance_card = Column(String(20), unique=True)
    
    # --- CÁC TRƯỜNG MỚI ---
    cccd = Column(String(20), unique=True)
    email = Column(String(100))
    address = Column(Text) # Địa chỉ cũ
    address_detail = Column(String(255)) # Địa chỉ chi tiết mới
    emergency_contact = Column(String(255))
    
    blood_type = Column(String(5))
    height = Column(Float)
    weight = Column(Float)
    allergies = Column(Text)       # Dị ứng
    medical_history = Column(Text) # Bệnh nền
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Quan hệ ngược để lấy lịch sử khám (Thêm dòng này để dễ truy vấn history)
    visits = relationship("Visit", back_populates="patient")

# Bảng Medicines (Kho thuốc)
class Medicine(Base):
    __tablename__ = "Medicines"

    medicine_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False) # Tên biệt dược
    active_ingredient = Column(String(255))    # Hoạt chất (MỚI)
    category = Column(String(100))             # Nhóm thuốc (MỚI)
    unit = Column(String(20), nullable=False)
    dosage = Column(String(50))                # Hàm lượng (MỚI)
    
    price = Column(DECIMAL(10, 2), nullable=False)       # Giá bán
    import_price = Column(DECIMAL(10, 2), default=0)     # Giá nhập (MỚI)
    
    stock_quantity = Column(Integer, default=0)
    
    expiry_date = Column(DateTime)             # Hạn sử dụng (MỚI)
    batch_number = Column(String(50))          # Số lô (MỚI)
    manufacturer = Column(String(100))         # Nhà SX (MỚI)
    usage_instruction = Column(Text)           # Cách dùng mặc định (MỚI)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Bảng Visits (Lượt khám)
class Visit(Base):
    __tablename__ = "Visits"

    visit_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("Patients.patient_id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("Users.user_id"), nullable=True) # Có thể null nếu chưa phân bác sĩ
    visit_date = Column(DateTime(timezone=True), server_default=func.now())
    diagnosis = Column(Text, nullable=True)
    status = Column(Enum('WAITING', 'IN_PROGRESS', 'COMPLETED', 'PAID'), default='WAITING')

    # Quan hệ (Optional): Để dễ truy vấn ngược lại sau này
    # patient = relationship("Patient", back_populates="visits")
 
# Bảng Prescriptions (Đơn thuốc)    
class Prescription(Base):
    __tablename__ = "Prescriptions"

    prescription_id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("Visits.visit_id"), nullable=False)
    medicine_id = Column(Integer, ForeignKey("Medicines.medicine_id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    note = Column(String(255), nullable=True)


# Bảng Invoices (Hóa đơn)
class Invoice(Base):
    __tablename__ = "Invoices"

    invoice_id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("Visits.visit_id"), unique=True)
    total_amount = Column(DECIMAL(15, 2), nullable=False)
    payment_time = Column(DateTime(timezone=True), server_default=func.now())

# Cập nhật quan hệ (Thêm vào class Prescription cũ nếu chưa có, hoặc để nguyên cũng được)
# Nhưng để tính tiền dễ, ta cần biết đơn thuốc đó giá bao nhiêu.
# Lưu ý: Ở bước trước ta đã định nghĩa Prescription, giờ ta dùng query trực tiếp cho đơn giản.