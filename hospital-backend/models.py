# models.py
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, DateTime, Text, DECIMAL, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from sqlalchemy import Time, Date, Boolean
from sqlalchemy import JSON

# Bảng Users
class User(Base):
    __tablename__ = "Users"

    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    password = Column(String(255))
    full_name = Column(String(100))
    # Cập nhật Enum role
    role = Column(Enum('ADMIN', 'DOCTOR', 'NURSE', 'PATIENT', 'TECHNICIAN'))
    # Thêm cột mới
    email = Column(String(100), unique=True, nullable=True)
    phone = Column(String(15), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    reset_token = Column(String(10), nullable=True)   # Lưu mã OTP
    reset_token_exp = Column(DateTime, nullable=True) # Lưu thời gian hết hạn

# Bảng Patients
class Patient(Base):
    __tablename__ = "Patients"

    patient_id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    dob = Column(DateTime)
    gender = Column(Enum('Nam', 'Nu', 'Khac'))
    phone = Column(String(15))
    insurance_card = Column(String(20), unique=True)
    
    # --- CÁC TRƯỜNG MỚI (Đã kiểm tra OK) ---
    cccd = Column(String(20), unique=True)
    email = Column(String(100))
    address = Column(Text) 
    address_detail = Column(String(255)) 
    emergency_contact = Column(String(255))
    
    blood_type = Column(String(5))
    height = Column(Float) # Đã import Float
    weight = Column(Float) # Đã import Float
    allergies = Column(Text)       
    medical_history = Column(Text) 
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Quan hệ 1-n: Một bệnh nhân có nhiều lượt khám
    visits = relationship("Visit", back_populates="patient")

# Bảng Medicines (Kho thuốc)
class Medicine(Base):
    __tablename__ = "Medicines"

    medicine_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False) 
    active_ingredient = Column(String(255))    
    category = Column(String(100))             
    unit = Column(String(20), nullable=False)
    dosage = Column(String(50))                
    
    price = Column(DECIMAL(10, 2), nullable=False)       
    import_price = Column(DECIMAL(10, 2), default=0)     
    
    stock_quantity = Column(Integer, default=0)
    
    expiry_date = Column(DateTime)             
    batch_number = Column(String(50))          
    manufacturer = Column(String(100))         
    usage_instruction = Column(Text)           
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Bảng Visits (Lượt khám)
class Visit(Base):
    __tablename__ = "Visits"

    visit_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("Patients.patient_id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("Users.user_id"), nullable=True) 
    visit_date = Column(DateTime(timezone=True), server_default=func.now())
    diagnosis = Column(Text, nullable=True)
    status = Column(Enum('WAITING', 'IN_PROGRESS', 'COMPLETED', 'PAID'), default='WAITING')
    chief_complaint = Column(Text)
    pulse = Column(Integer)
    temperature = Column(DECIMAL(4, 1))
    blood_pressure = Column(String(20))
    respiratory_rate = Column(Integer)
    priority = Column(Enum('NORMAL', 'HIGH', 'EMERGENCY'), default='NORMAL')
    clinical_symptoms = Column(Text)
    icd10 = Column(String(50))
    advice = Column(Text)
    follow_up_date = Column(DateTime)

    # --- ĐÃ SỬA: Mở comment dòng này để fix lỗi InvalidRequestError ---
    patient = relationship("Patient", back_populates="visits")
 
# Bảng Prescriptions (Đơn thuốc)    
class Prescription(Base):
    __tablename__ = "Prescriptions"

    prescription_id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("Visits.visit_id"), nullable=False)
    medicine_id = Column(Integer, ForeignKey("Medicines.medicine_id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    note = Column(String(255), nullable=True)
    dosage_morning = Column(String(10))
    dosage_noon = Column(String(10))
    dosage_afternoon = Column(String(10))
    dosage_evening = Column(String(10))
    usage_instruction = Column(String(255))

# Bảng Invoices (Hóa đơn)
class Invoice(Base):
    __tablename__ = "Invoices"
    
    invoice_id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("Visits.visit_id"), unique=True)
    payment_time = Column(DateTime(timezone=True), server_default=func.now())
    
    # --- CÁC TRƯỜNG MỚI ---
    medicine_total = Column(DECIMAL(15, 2))
    exam_fee = Column(DECIMAL(15, 2))
    procedure_fee = Column(DECIMAL(15, 2))
    insurance_percent = Column(Integer)
    final_amount = Column(DECIMAL(15, 2))
    payment_method = Column(Enum('CASH', 'TRANSFER', 'CARD'))
    
    # Quan hệ
    visit = relationship("Visit")
    
# 1. Bảng Lịch làm việc của Bác sĩ
class DoctorSchedule(Base):
    __tablename__ = "DoctorSchedules"

    schedule_id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("Users.user_id"), nullable=False)
    # 0: CN, 1: T2, ..., 6: T7
    day_of_week = Column(Integer, nullable=False) 
    shift_start = Column(Time, nullable=False) # VD: 08:00
    shift_end = Column(Time, nullable=False)   # VD: 17:00
    is_active = Column(Boolean, default=True)

    # Quan hệ
    doctor = relationship("User")

# 2. Bảng Lịch hẹn (Booking)
class Appointment(Base):
    __tablename__ = "Appointments"

    appointment_id = Column(Integer, primary_key=True, index=True)
    # Liên kết với hồ sơ bệnh án (để sau này convert sang Visit)
    patient_id = Column(Integer, ForeignKey("Patients.patient_id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("Users.user_id"), nullable=False)
    
    appointment_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False) # VD: 09:30
    end_time = Column(Time, nullable=False)   # VD: 10:00 (thường +30p)
    
    reason = Column(Text)
    # Trạng thái: PENDING (Chờ), CONFIRMED (Đã xác nhận), CANCELLED, COMPLETED (Đã khám), NO_SHOW (Bùng kèo)
    status = Column(Enum('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'), default='PENDING')
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Quan hệ
    patient = relationship("Patient")
    doctor = relationship("User")
    
    
class Service(Base):
    __tablename__ = "Services"
    service_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    type = Column(Enum('LAB', 'IMAGING', 'OTHER'), nullable=False)
    price = Column(DECIMAL(10, 2), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)

class ServiceRequest(Base):
    __tablename__ = "ServiceRequests"
    request_id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("Visits.visit_id"))
    service_id = Column(Integer, ForeignKey("Services.service_id"))
    doctor_id = Column(Integer, ForeignKey("Users.user_id"))
    quantity = Column(Integer, default=1)
    status = Column(Enum('PENDING', 'COMPLETED', 'CANCELLED'), default='PENDING')
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Quan hệ
    service = relationship("Service")
    visit = relationship("Visit")
    doctor = relationship("User")
    # Quan hệ 1-1 với kết quả (một phiếu yêu cầu có 1 kết quả)
    result = relationship("ServiceResult", back_populates="request", uselist=False)

class ServiceResult(Base):
    __tablename__ = "ServiceResults"
    result_id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("ServiceRequests.request_id"))
    technician_id = Column(Integer, ForeignKey("Users.user_id"))
    result_data = Column(Text)
    image_url = Column(String(500))
    conclusion = Column(Text)
    performed_at = Column(DateTime(timezone=True), server_default=func.now())

    request = relationship("ServiceRequest", back_populates="result")
    technician = relationship("User")
    
# --- MÔ HÌNH CHO QUẢN LÝ NỘI TRÚ (INPATIENT MANAGEMENT) ---
class Department(Base):
    __tablename__ = "Departments"
    department_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    location = Column(String(255))
    rooms = relationship("Room", back_populates="department")

class Room(Base):
    __tablename__ = "Rooms"
    room_id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("Departments.department_id"))
    room_number = Column(String(20))
    type = Column(Enum('STANDARD', 'VIP', 'ISOLATION'))
    base_price = Column(DECIMAL(15,2))
    
    department = relationship("Department", back_populates="rooms")
    beds = relationship("Bed", back_populates="room")

class Bed(Base):
    __tablename__ = "Beds"
    bed_id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("Rooms.room_id"))
    bed_number = Column(String(20))
    status = Column(Enum('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'CLEANING'))
    
    room = relationship("Room", back_populates="beds")

class InpatientRecord(Base):
    __tablename__ = "InpatientRecords"
    inpatient_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("Patients.patient_id"))
    treating_doctor_id = Column(Integer, ForeignKey("Users.user_id"))
    admission_date = Column(DateTime(timezone=True), server_default=func.now())
    discharge_date = Column(DateTime(timezone=True), nullable=True)
    initial_diagnosis = Column(Text)
    status = Column(Enum('ACTIVE', 'DISCHARGED', 'TRANSFERRED'), default='ACTIVE')
    
    patient = relationship("Patient")
    doctor = relationship("User")
    allocations = relationship("BedAllocation", back_populates="inpatient_record")
    daily_orders = relationship("DailyOrder", back_populates="inpatient_record")

class BedAllocation(Base):
    __tablename__ = "BedAllocations"
    allocation_id = Column(Integer, primary_key=True, index=True)
    inpatient_id = Column(Integer, ForeignKey("InpatientRecords.inpatient_id"))
    bed_id = Column(Integer, ForeignKey("Beds.bed_id"))
    check_in_time = Column(DateTime(timezone=True), server_default=func.now())
    check_out_time = Column(DateTime(timezone=True), nullable=True)
    price_per_day = Column(DECIMAL(15,2))
    
    inpatient_record = relationship("InpatientRecord", back_populates="allocations")
    bed = relationship("Bed")

class DailyOrder(Base):
    __tablename__ = "DailyOrders"
    order_id = Column(Integer, primary_key=True, index=True)
    inpatient_id = Column(Integer, ForeignKey("InpatientRecords.inpatient_id"))
    doctor_id = Column(Integer, ForeignKey("Users.user_id"))
    date = Column(Date)
    progress_note = Column(Text)
    doctor_instruction = Column(Text)
    nurse_notes = Column(Text)
    vitals = Column(JSON) # Lưu JSON sinh hiệu
    
    inpatient_record = relationship("InpatientRecord", back_populates="daily_orders")
    doctor = relationship("User")