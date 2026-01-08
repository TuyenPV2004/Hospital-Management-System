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
        
# --- NỘI TRÚ ---
class BedBase(BaseModel):
    bed_id: int
    bed_number: str
    status: str
    room_number: Optional[str] = None # Map từ Room sang
    price: Optional[float] = None     # Map từ Room sang
    
class BedMapResponse(BaseModel):
    department_name: str
    beds: List[BedBase]

# Schema Nhập viện
class AdmissionCreate(BaseModel):
    patient_id: int
    bed_id: int
    initial_diagnosis: str
    treating_doctor_id: Optional[int] = None

class InpatientResponse(BaseModel):
    inpatient_id: int
    patient_name: str
    bed_number: Optional[str]
    status: str
    admission_date: datetime
    class Config:
        from_attributes = True


# --- KHO & VẬT TƯ ---
class SupplierBase(BaseModel):
    name: str
    contact_person: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    address: Optional[str]

class MedicalSupplyCreate(BaseModel):
    name: str
    code: str
    category: str = 'CONSUMABLE'
    unit: str
    price: float
    min_stock_level: int = 10

# --- NHẬP KHO ---
class ImportDetailCreate(BaseModel):
    item_type: str # MEDICINE / SUPPLY
    item_id: int
    quantity: int
    import_price: float
    batch_number: str
    expiry_date: date

class ImportReceiptCreate(BaseModel):
    supplier_id: int
    note: Optional[str] = None
    # Có thể gửi kèm danh sách details luôn nếu muốn
    details: List[ImportDetailCreate] = []

class ImportReceiptResponse(BaseModel):
    receipt_id: int
    supplier_id: int
    total_amount: float
    status: str
    import_date: datetime
    # supplier_name: Optional[str] # Map tên nếu cần
    class Config:
        from_attributes = True

# Schema Cảnh báo
class InventoryAlert(BaseModel):
    id: int
    name: str
    type: str # MEDICINE / SUPPLY
    stock: int
    min_stock: int
    expiry_date: Optional[date]
    alert_type: str # EXPIRY / LOW_STOCK             

class UserProfileUpdate(BaseModel):
    username: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    # Mật khẩu là tùy chọn, nếu không đổi thì để null
    current_password: Optional[str] = None
    new_password: Optional[str] = None

class PatientInfoSimple(BaseModel):
    cccd: Optional[str] = None
    insurance_card: Optional[str] = None

class UserProfileResponse(BaseModel):
    user_id: int
    username: str
    full_name: str
    role: str
    email: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    
    # Thông tin riêng cho Patient (Read-only)
    patient_info: Optional[PatientInfoSimple] = None

    class Config:
        from_attributes = True
# schemas.py

# 1. Schema UPDATE Bệnh nhân (Cho phép field nào được sửa thì khai báo ở đây)
class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    blood_type: Optional[str] = None
    allergies: Optional[str] = None
    medical_history: Optional[str] = None
    # Không cho sửa CCCD và BHYT ở đây (logic nghiệp vụ)

# 2. Schema HIỂN THỊ CHI TIẾT LỊCH SỬ (History Enhanced)
# Chúng ta tái sử dụng PrescriptionResponse và ServiceRequestResponse đã có, 
# hoặc tạo bản rút gọn nếu cần.

# Schema con: Thuốc trong lịch sử
class PrescriptionHistoryItem(BaseModel):
    medicine_name: str # Map từ Medicine.name
    quantity: int
    usage_instruction: Optional[str]
    dosage_morning: Optional[str]
    dosage_noon: Optional[str]
    dosage_afternoon: Optional[str]
    dosage_evening: Optional[str]

    class Config:
        from_attributes = True

# Schema con: Dịch vụ trong lịch sử
class ServiceRequestHistoryItem(BaseModel):
    service_name: str # Map từ Service.name
    status: str
    result_conclusion: Optional[str] = None # Map từ ServiceResult.conclusion

    class Config:
        from_attributes = True

# Schema cha: Chi tiết 1 lượt khám trong lịch sử
class VisitHistoryDetail(BaseModel):
    visit_id: int
    visit_date: datetime
    doctor_name: Optional[str] = None # Sẽ map thủ công hoặc qua relation
    diagnosis: Optional[str]
    status: str
    chief_complaint: Optional[str]
    
    # DANH SÁCH CON (Nested)
    prescriptions: List[PrescriptionHistoryItem] = []
    service_requests: List[ServiceRequestHistoryItem] = []

    class Config:
        from_attributes = True

# Schema trả về cho API Get Detail Patient
class PatientDetailResponse(PatientResponse):
    pass # Tạm thời giống PatientResponse, có thể mở rộng sau

# --- BỔ SUNG VÀO schemas.py ---

# 1. Schemas cho Lịch làm việc (Schedule)
class ScheduleUpdate(BaseModel):
    shift_start: Optional[str] = None
    shift_end: Optional[str] = None
    is_active: Optional[bool] = None

class DoctorScheduleFullResponse(ScheduleResponse):
    doctor_name: str # Thêm tên bác sĩ để hiển thị cho Admin
    specialization: Optional[str] = None

# 2. Schemas cho Lịch hẹn (Appointment)
class AppointmentUpdate(BaseModel):
    appointment_date: Optional[date] = None
    start_time: Optional[str] = None # Định dạng "HH:MM"
    reason: Optional[str] = None
    status: Optional[str] = None

class AppointmentDetailResponse(AppointmentResponse):
    # Kế thừa từ AppointmentResponse đã có các field cơ bản
    # Bổ sung thông tin chi tiết user
    doctor_full_name: Optional[str] = None
    patient_full_name: Optional[str] = None
    patient_phone: Optional[str] = None