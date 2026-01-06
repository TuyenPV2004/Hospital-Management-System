# models.py
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, DateTime, Text, DECIMAL, Float
from sqlalchemy.orm import relationship
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

# Bảng Invoices (Hóa đơn)
class Invoice(Base):
    __tablename__ = "Invoices"

    invoice_id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("Visits.visit_id"), unique=True)
    total_amount = Column(DECIMAL(15, 2), nullable=False)
    payment_time = Column(DateTime(timezone=True), server_default=func.now())