# schemas.py
import datetime
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

# Dữ liệu trả về khi lấy thông tin User (ẩn password đi)
class UserResponse(BaseModel):
    user_id: int
    username: str
    full_name: str
    role: str

    class Config:
        from_attributes = True # Cho phép đọc dữ liệu từ ORM model

# Dữ liệu gửi lên khi Đăng nhập
class LoginRequest(BaseModel):
    username: str
    password: str

# Dữ liệu Token trả về sau khi đăng nhập thành công
class Token(BaseModel):
    access_token: str
    token_type: str

# --- schemas.py (Thêm vào cuối file) ---

# Class cơ bản chứa các trường chung
class PatientBase(BaseModel):
    full_name: str
    dob: date            # Ngày sinh (YYYY-MM-DD)
    gender: str          # Nam/Nu/Khac
    phone: Optional[str] = None
    address: Optional[str] = None
    insurance_card: Optional[str] = None

# Dùng khi tạo mới (Y tá gửi lên)
class PatientCreate(PatientBase):
    pass

# Dùng khi trả về (Server gửi về cho Frontend)
class PatientResponse(PatientBase):
    patient_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- schemas.py (Thêm vào cuối file) ---
# --- SCHEMAS CHO THUỐC (MEDICINE) ---
class MedicineBase(BaseModel):
    name: str
    unit: str
    price: float
    stock_quantity: int

class MedicineCreate(MedicineBase):
    pass

class MedicineResponse(MedicineBase):
    medicine_id: int
    class Config:
        from_attributes = True

# --- SCHEMAS CHO LƯỢT KHÁM (VISIT) ---
class VisitCreate(BaseModel):
    patient_id: int
    doctor_id: Optional[int] = None # Có thể chọn bác sĩ hoặc để trống

class VisitResponse(BaseModel):
    visit_id: int
    patient_id: int
    doctor_id: Optional[int]
    visit_date: datetime
    status: str
    diagnosis: Optional[str]

    class Config:
        from_attributes = True


# Dữ liệu cập nhật chẩn đoán
class VisitUpdate(BaseModel):
    diagnosis: str

# Dữ liệu kê đơn thuốc
class PrescriptionCreate(BaseModel):
    visit_id: int
    medicine_id: int
    quantity: int
    note: Optional[str] = "Sáng 1, Tối 1" # Gợi ý mặc định

# Dữ liệu hiển thị đơn thuốc đã kê
class PrescriptionResponse(BaseModel):
    prescription_id: int
    medicine_id: int
    quantity: int
    note: Optional[str]
    
    class Config:
        from_attributes = True


# Schema hóa đơn sau khi thanh toán
class InvoiceResponse(BaseModel):
    invoice_id: int
    visit_id: int
    total_amount: float
    payment_time: datetime
    
    class Config:
        from_attributes = True

# Schema hiển thị chi tiết tiền (Preview)
class BillDetails(BaseModel):
    visit_id: int
    medicine_cost: float
    exam_fee: float
    total: float