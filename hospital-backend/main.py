# main.py
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import models, database, schemas, security
from sqlalchemy import func, desc, extract

app = FastAPI()

# Dependency để lấy DB session
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Cấu hình để Swagger UI biết chỗ nhập Token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# --- API 1: Đăng nhập (Login) ---
@app.post("/login", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), # Dùng Depends() để nhận dữ liệu từ Form Swagger
    db: Session = Depends(get_db)
):
    # Tìm user dựa trên form_data.username
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    
    # Kiểm tra mật khẩu dựa trên form_data.password
    if not user or not security.verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sai tên đăng nhập hoặc mật khẩu",
        )
    
    # Tạo Token (sub=username, role=role)
    access_token = security.create_access_token(
        data={"sub": user.username, "role": user.role}
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# --- API 2: Lấy thông tin người dùng hiện tại (Cần Token mới gọi được) ---
@app.get("/users/me", response_model=schemas.UserResponse)
def read_users_me(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    # Giải mã token để lấy username (Logic đơn giản để test)
    try:
        payload = security.jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Token không hợp lệ")
    except security.jwt.JWTError:
        raise HTTPException(status_code=401, detail="Token không hợp lệ")
        
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy user")
    return user

# --- API 3: Thêm bệnh nhân mới ---
from typing import Optional
# dependency 'token' đảm bảo phải đăng nhập mới được thêm
@app.post("/patients", response_model=schemas.PatientResponse)
def create_patient(
    patient: schemas.PatientCreate, 
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme) # Bắt buộc phải có Token
):
    # 1. Kiểm tra xem mã BHYT đã tồn tại chưa (tránh trùng lặp)
    if patient.insurance_card:
        existing_patient = db.query(models.Patient).filter(
            models.Patient.insurance_card == patient.insurance_card
        ).first()
        if existing_patient:
            raise HTTPException(status_code=400, detail="Mã BHYT đã tồn tại")

    # 2. Tạo đối tượng Patient từ dữ liệu gửi lên
    db_patient = models.Patient(
        full_name=patient.full_name,
        dob=patient.dob,
        gender=patient.gender,
        phone=patient.phone,
        address=patient.address,
        insurance_card=patient.insurance_card
    )
    
    # 3. Lưu vào Database
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient) # Lấy lại ID vừa tự động sinh ra
    return db_patient

# --- API 4: Lấy danh sách & Tìm kiếm bệnh nhân ---
@app.get("/patients", response_model=list[schemas.PatientResponse])
def get_patients(
    search: Optional[str] = None, # Tham số tìm kiếm tùy chọn (Query param)
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    # Nếu có từ khóa tìm kiếm (VD: ?search=Nguyen)
    if search:
        # Tìm theo Tên HOẶC số BHYT
        patients = db.query(models.Patient).filter(
            (models.Patient.full_name.contains(search)) | 
            (models.Patient.insurance_card.contains(search))
        ).all()
    else:
        # Nếu không tìm gì, trả về toàn bộ (cẩn thận nếu dữ liệu lớn sau này cần phân trang)
        patients = db.query(models.Patient).all()
        
    return patients


# --- API 5: Quản lý Kho thuốc (Thêm thuốc) ---
@app.post("/medicines", response_model=schemas.MedicineResponse)
def create_medicine(
    medicine: schemas.MedicineCreate, 
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    db_medicine = models.Medicine(
        name=medicine.name,
        active_ingredient=medicine.active_ingredient,
        category=medicine.category,
        unit=medicine.unit,
        dosage=medicine.dosage,
        price=medicine.price,
        import_price=medicine.import_price,
        stock_quantity=medicine.stock_quantity,
        expiry_date=medicine.expiry_date,
        batch_number=medicine.batch_number,
        manufacturer=medicine.manufacturer,
        usage_instruction=medicine.usage_instruction
    )
    db.add(db_medicine)
    db.commit()
    db.refresh(db_medicine)
    return db_medicine

# (MỚI) API cảnh báo thuốc sắp hết hạn (dưới 30 ngày)
@app.get("/medicines/expiry-alert", response_model=list[schemas.MedicineResponse])
def get_expiring_medicines(db: Session = Depends(get_db)):
    from datetime import datetime, timedelta
    thirty_days_later = datetime.now() + timedelta(days=30)
    
    # Lấy thuốc có hạn sử dụng nhỏ hơn 30 ngày tới
    return db.query(models.Medicine).filter(
        models.Medicine.expiry_date <= thirty_days_later
    ).all()

# --- API 6: Lấy danh sách thuốc (Để bác sĩ chọn) ---
@app.get("/medicines", response_model=list[schemas.MedicineResponse])
def get_medicines(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    return db.query(models.Medicine).all()

# --- API 7: Tạo lượt khám (Y tá tiếp nhận) ---
@app.post("/visits", response_model=schemas.VisitResponse)
def create_visit(
    visit: schemas.VisitCreate, 
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    # (Logic kiểm tra bệnh nhân cũ giữ nguyên...)
    
    # Tạo lượt khám với đầy đủ thông tin sinh tồn
    db_visit = models.Visit(
        patient_id=visit.patient_id,
        doctor_id=visit.doctor_id,
        status="WAITING",
        chief_complaint=visit.chief_complaint,
        pulse=visit.pulse,
        temperature=visit.temperature,
        blood_pressure=visit.blood_pressure,
        respiratory_rate=visit.respiratory_rate,
        priority=visit.priority
    )
    db.add(db_visit)
    db.commit()
    db.refresh(db_visit)
    return db_visit

# --- API 8: Lấy danh sách khám (Lọc theo trạng thái WAITING) ---
@app.get("/visits", response_model=list[schemas.VisitResponse])
def get_visits(
    status: Optional[str] = None, # Cho phép lọc ?status=WAITING
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    query = db.query(models.Visit)
    if status:
        query = query.filter(models.Visit.status == status)
    return query.all()


# --- API 9: Cập nhật chẩn đoán (Bác sĩ khám) ---
@app.put("/visits/{visit_id}/diagnosis")
def update_diagnosis(
    visit_id: int, 
    visit_update: schemas.VisitUpdate, 
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    visit = db.query(models.Visit).filter(models.Visit.visit_id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Lượt khám không tồn tại")
    
    # Cập nhật các trường mới
    visit.diagnosis = visit_update.diagnosis
    visit.clinical_symptoms = visit_update.clinical_symptoms
    visit.icd10 = visit_update.icd10
    visit.advice = visit_update.advice
    visit.follow_up_date = visit_update.follow_up_date
    
    visit.status = "IN_PROGRESS"
    db.commit()
    return {"message": "Đã lưu hồ sơ bệnh án"}

# --- API 10: Kê đơn thuốc (Logic khó nhất: Trừ kho) ---
@app.post("/prescriptions", response_model=schemas.PrescriptionResponse)
def create_prescription(
    pres: schemas.PrescriptionCreate, 
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    # (Logic kiểm tra tồn kho giữ nguyên...)
    medicine = db.query(models.Medicine).filter(models.Medicine.medicine_id == pres.medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="Thuốc không tồn tại")
    if medicine.stock_quantity < pres.quantity:
        raise HTTPException(status_code=400, detail=f"Không đủ thuốc. Kho còn {medicine.stock_quantity}")

    medicine.stock_quantity -= pres.quantity
    
    # Lưu đầy đủ thông tin liều dùng
    db_pres = models.Prescription(
        visit_id=pres.visit_id,
        medicine_id=pres.medicine_id,
        quantity=pres.quantity,
        note=pres.note,
        # MỚI
        dosage_morning=pres.dosage_morning,
        dosage_noon=pres.dosage_noon,
        dosage_afternoon=pres.dosage_afternoon,
        dosage_evening=pres.dosage_evening,
        usage_instruction=pres.usage_instruction
    )
    db.add(db_pres)
    db.commit()
    db.refresh(db_pres)
    return db_pres

# --- API 11: Kết thúc khám (Chuyển sang chờ thanh toán) ---
@app.post("/visits/{visit_id}/finish")
def finish_visit(
    visit_id: int, 
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    visit = db.query(models.Visit).filter(models.Visit.visit_id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Lượt khám không tồn tại")
        
    visit.status = "COMPLETED" # Hoặc "WAITING_PAYMENT" tùy quy ước
    db.commit()
    
    return {"message": "Đã kết thúc khám, chuyển sang thanh toán"}


# --- API 12 (Nâng cấp): Xem trước hóa đơn (Có tính BHYT) ---
@app.get("/visits/{visit_id}/bill")
def preview_bill(
    visit_id: int,
    insurance_percent: int = 0, # Nhận tham số BHYT từ URL
    procedure_fee: float = 0,   # Nhận phí thủ thuật
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    # 1. Tính tiền thuốc
    prescriptions = db.query(models.Prescription).filter(models.Prescription.visit_id == visit_id).all()
    medicine_total = 0
    details = []
    
    for pres in prescriptions:
        med = db.query(models.Medicine).filter(models.Medicine.medicine_id == pres.medicine_id).first()
        if med:
            cost = pres.quantity * float(med.price)
            medicine_total += cost
            details.append({
                "name": med.name, "qty": pres.quantity, "price": med.price, "total": cost
            })
            
    # 2. Tính toán tổng
    sub_total = medicine_total + FIXED_EXAM_FEE + procedure_fee
    discount = sub_total * (insurance_percent / 100)
    final_amount = sub_total - discount
    
    return {
        "medicine_details": details,
        "medicine_total": medicine_total,
        "exam_fee": FIXED_EXAM_FEE,
        "procedure_fee": procedure_fee,
        "sub_total": sub_total,
        "insurance_percent": insurance_percent,
        "discount": discount,
        "final_amount": final_amount
    }

# --- API 13: Thanh toán & Xuất hóa đơn ---
@app.post("/invoices", response_model=schemas.InvoiceResponse)
def create_invoice(
    visit_id: int, # Chỉ cần gửi visit_id lên
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    # 1. Kiểm tra xem đã thanh toán chưa
    existing_invoice = db.query(models.Invoice).filter(models.Invoice.visit_id == visit_id).first()
    if existing_invoice:
        raise HTTPException(status_code=400, detail="Lượt khám này đã thanh toán rồi")

    # 2. Tính toán lại tổng tiền (Logic giống hàm preview)
    prescriptions = db.query(models.Prescription).filter(models.Prescription.visit_id == visit_id).all()
    medicine_total = 0
    for pres in prescriptions:
        med = db.query(models.Medicine).filter(models.Medicine.medicine_id == pres.medicine_id).first()
        if med:
            medicine_total += (pres.quantity * float(med.price))
    
    total_amount = medicine_total + FIXED_EXAM_FEE
    
    # 3. Lưu hóa đơn
    db_invoice = models.Invoice(
        visit_id=visit_id,
        total_amount=total_amount
    )
    db.add(db_invoice)
    
    # 4. Cập nhật trạng thái lượt khám thành PAID
    visit = db.query(models.Visit).filter(models.Visit.visit_id == visit_id).first()
    if visit:
        visit.status = "PAID"
        
    db.commit()
    db.refresh(db_invoice)
    
    return db_invoice

# --- API 14: Lấy lịch sử khám của bệnh nhân ---
@app.get("/patients/{patient_id}/history", response_model=schemas.PatientResponse)
def get_patient_history(
    patient_id: int, 
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    # Query bệnh nhân và join với bảng Visits
    patient = db.query(models.Patient).filter(models.Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Bệnh nhân không tồn tại")
    
    # Lấy danh sách khám cũ (Sắp xếp mới nhất lên đầu)
    visits = db.query(models.Visit).filter(
        models.Visit.patient_id == patient_id
    ).order_by(models.Visit.visit_date.desc()).all()
    
    # Gán vào object trả về (Pydantic sẽ lo việc format JSON)
    patient.visits = visits
    return patient

# --- API 15: Lấy danh sách bác sĩ ---
@app.get("/users/doctors", response_model=list[schemas.UserResponse])
def get_doctors(db: Session = Depends(get_db)):
    return db.query(models.User).filter(models.User.role == 'DOCTOR').all()


# Tạo cầu nối Frontend và Backend (CORS)
from fastapi.middleware.cors import CORSMiddleware
# --- CẤU HÌNH CORS (Thêm đoạn này) ---
origins = [
    "http://localhost:5173", # Port mặc định của Vite (React)
    "http://localhost:3000", # Port mặc định của React Create App
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # Cho phép các nguồn này gọi API
    allow_credentials=True,
    allow_methods=["*"],   # Cho phép tất cả các method (GET, POST, PUT...)
    allow_headers=["*"],   # Cho phép tất cả header
)
# -------------------------------------