# schemas.py
import datetime
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime, time
from typing import List

# Schema dùng cho form Đăng ký (Bệnh nhân)
class UserRegister(BaseModel):
    username: str
    password: str
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None

# Schema dùng cho Admin tạo nhân viên (Có chọn Role)
class UserCreateStaff(UserRegister):
    role: str # ADMIN, DOCTOR, NURSE

# Schema hiển thị User
class UserResponse(BaseModel):
    user_id: int
    username: str
    full_name: str
    role: str
    email: Optional[str]
    phone: Optional[str]
    class Config:
        from_attributes = True

# Dữ liệu gửi lên khi Đăng nhập
class LoginRequest(BaseModel):
    username: str
    password: str

# Dữ liệu Token trả về sau khi đăng nhập thành công
class Token(BaseModel):
    access_token: str
    token_type: str
    
class ForgotPasswordRequest(BaseModel):
    email: str

# Bước 2: Đổi mật khẩu mới
class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str

# --- SCHEMAS CHO BỆNH NHÂN (PATIENT) ---
class PatientBase(BaseModel):
    full_name: str
    dob: date
    gender: str
    phone: Optional[str] = None
    insurance_card: Optional[str] = None
    # --- MỚI ---
    cccd: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    blood_type: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    allergies: Optional[str] = None       # Quan trọng
    medical_history: Optional[str] = None

class PatientCreate(PatientBase):
    pass

# Schema hiển thị lịch sử khám (Dùng cho Bác sĩ xem)
class VisitHistoryItem(BaseModel):
    visit_id: int
    visit_date: datetime
    diagnosis: Optional[str]
    status: str
    class Config:
        from_attributes = True

class PatientResponse(PatientBase):
    patient_id: int
    created_at: datetime
    # Thêm danh sách lịch sử khám (Optional vì ở màn hình danh sách không cần load hết)
    visits: Optional[list[VisitHistoryItem]] = [] 

    class Config:
        from_attributes = True


# --- SCHEMAS CHO THUỐC (MEDICINE) ---
class MedicineBase(BaseModel):
    name: str
    active_ingredient: Optional[str] = None
    category: Optional[str] = None
    unit: str
    dosage: Optional[str] = None
    price: float        # Giá bán
    import_price: float # Giá nhập
    stock_quantity: int
    expiry_date: Optional[date] = None # YYYY-MM-DD
    batch_number: Optional[str] = None
    manufacturer: Optional[str] = None
    usage_instruction: Optional[str] = None

class MedicineCreate(MedicineBase):
    pass

class MedicineResponse(MedicineBase):
    medicine_id: int
    created_at: datetime
    class Config:
        from_attributes = True

# --- SCHEMAS CHO LƯỢT KHÁM (VISIT) ---
# schemas.py

# Dữ liệu Y tá gửi lên khi tạo lượt khám
class VisitCreate(BaseModel):
    patient_id: int
    doctor_id: Optional[int] = None
    # --- MỚI ---
    chief_complaint: str # Bắt buộc phải có lý do khám
    pulse: Optional[int] = None
    temperature: Optional[float] = None
    blood_pressure: Optional[str] = None
    respiratory_rate: Optional[int] = None
    priority: str = 'NORMAL' # Mặc định là Thường

# Dữ liệu trả về cho Bác sĩ xem
class VisitResponse(BaseModel):
    visit_id: int
    patient_id: int
    doctor_id: Optional[int]
    visit_date: datetime
    status: str
    diagnosis: Optional[str]
    # --- MỚI ---
    chief_complaint: Optional[str]
    pulse: Optional[int]
    temperature: Optional[float]
    blood_pressure: Optional[str]
    respiratory_rate: Optional[int]
    priority: Optional[str]

    class Config:
        from_attributes = True


# Dữ liệu cập nhật chẩn đoán
class VisitUpdate(BaseModel):
    diagnosis: str
    # --- MỚI ---
    clinical_symptoms: Optional[str] = None
    icd10: Optional[str] = None
    advice: Optional[str] = None
    follow_up_date: Optional[date] = None

# Dữ liệu kê đơn thuốc
class PrescriptionCreate(BaseModel):
    visit_id: int
    medicine_id: int
    quantity: int
    # --- MỚI (Chi tiết liều) ---
    dosage_morning: str = "0"
    dosage_noon: str = "0"
    dosage_afternoon: str = "0"
    dosage_evening: str = "0"
    usage_instruction: str = "Uống sau ăn"
    note: Optional[str] = None

# Dữ liệu hiển thị đơn thuốc đã kê
class PrescriptionResponse(BaseModel):
    prescription_id: int
    medicine_id: int
    quantity: int
    note: Optional[str]
    dosage_morning: Optional[str]
    dosage_noon: Optional[str]
    dosage_afternoon: Optional[str]
    dosage_evening: Optional[str]
    usage_instruction: Optional[str]
    
    class Config:
        from_attributes = True

# Schema tạo hóa đơn thanh toán
class InvoiceCreate(BaseModel):
    visit_id: int
    procedure_fee: float = 0 # Thu ngân nhập thêm nếu có
    insurance_percent: int = 0 # 0%, 80%, 100%
    payment_method: str = 'CASH'

# Schema hóa đơn sau khi thanh toán
class InvoiceResponse(BaseModel):
    invoice_id: int
    visit_id: int
    medicine_total: float
    exam_fee: float
    procedure_fee: float
    insurance_percent: int
    total_amount: float # Tổng chưa giảm
    final_amount: float # Khách thực trả
    payment_method: str
    payment_time: datetime
    
    class Config:
        from_attributes = True

# Schema hiển thị chi tiết tiền (Preview)
class BillDetails(BaseModel):
    visit_id: int
    medicine_cost: float
    exam_fee: float
    total: float

# Schema cho Báo cáo (Admin)
class RevenueReport(BaseModel):
    date: date
    daily_revenue: float
    patient_count: int

class TopMedicine(BaseModel):
    name: str
    sold_quantity: int
    stock_quantity: int    
    

# --- SCHEMAS CHO LỊCH LÀM VIỆC (SCHEDULE) ---
class ScheduleCreate(BaseModel):
    doctor_id: int
    day_of_week: int # 0-6
    shift_start: str # Định dạng "HH:MM:SS" hoặc "HH:MM"
    shift_end: str

class ScheduleResponse(BaseModel):
    schedule_id: int
    doctor_id: int
    day_of_week: int
    shift_start: time
    shift_end: time
    is_active: bool
    class Config:
        from_attributes = True

# --- SCHEMAS CHO LỊCH HẸN (APPOINTMENT) ---
class AppointmentCreate(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_date: date
    start_time: str # "09:30"
    reason: str

class AppointmentResponse(BaseModel):
    appointment_id: int
    patient_id: int
    doctor_id: int
    appointment_date: date
    start_time: time
    end_time: time
    status: str
    reason: Optional[str]
    # Kèm thêm thông tin bác sĩ/bệnh nhân để hiển thị
    doctor_name: Optional[str] = None 
    patient_name: Optional[str] = None
    
    class Config:
        from_attributes = True

# Schema hiển thị Slot trống (Cho Frontend vẽ Grid)
class TimeSlot(BaseModel):
    time: str     # "08:30"
    is_booked: bool

# Schema tạo lịch hẹn cho khách vãng lai (không có patient_id)    
class AppointmentCreate(BaseModel):
    doctor_id: int
    appointment_date: date
    start_time: str
    reason: str
    
    # Cho phép patient_id null (nếu là khách mới)
    patient_id: Optional[int] = None
    
    # Trường thông tin cho khách vãng lai
    full_name: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None    
    
    
    # schemas.py (Thêm vào cuối file)

# --- SCHEMAS DỊCH VỤ ---
class ServiceBase(BaseModel):
    name: str
    type: str
    price: float
    description: Optional[str] = None

class ServiceResponse(ServiceBase):
    service_id: int
    class Config:
        from_attributes = True

# --- SCHEMAS KẾT QUẢ ---
class ServiceResultBase(BaseModel):
    result_data: Optional[str] = None
    image_url: Optional[str] = None
    conclusion: Optional[str] = None

class ServiceResultCreate(ServiceResultBase):
    request_id: int
    # technician_id sẽ lấy từ token đăng nhập

class ServiceResultResponse(ServiceResultBase):
    result_id: int
    technician_id: int
    performed_at: datetime
    class Config:
        from_attributes = True

# --- SCHEMAS YÊU CẦU (REQUEST) ---
class ServiceRequestCreate(BaseModel):
    service_id: int
    quantity: int = 1

class ServiceRequestResponse(BaseModel):
    request_id: int
    visit_id: int
    service_id: int
    doctor_id: int
    status: str
    created_at: datetime
    service_name: str # Để hiển thị tên dịch vụ cho dễ
    price: float      # Để hiển thị giá
    result: Optional[ServiceResultResponse] = None # Kèm kết quả nếu có

    class Config:
        from_attributes = True