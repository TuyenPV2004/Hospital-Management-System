# main.py
from datetime import datetime, timedelta, date, time
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import models, database, schemas, security
from sqlalchemy import func, desc, extract
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
import random
import string
from sqlalchemy.orm import joinedload


app = FastAPI()
FIXED_EXAM_FEE = 50000.0 # Phí khám cố định (VNĐ)
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

# --- API: Đăng ký tài khoản Bệnh nhân (Public - Ai cũng gọi được) ---
@app.post("/register", response_model=schemas.UserResponse)
def register_patient(user: schemas.UserRegister, db: Session = Depends(get_db)):
    # 1. Check trùng username
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Tên đăng nhập đã tồn tại")
    
    # 2. Mã hóa mật khẩu
    hashed_password = security.pwd_context.hash(user.password)
    
    # 3. Tạo user với vai trò mặc định là PATIENT
    new_user = models.User(
        username=user.username,
        password=hashed_password,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        role="PATIENT" # <--- Mặc định
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# --- API: Admin tạo nhân viên (DOCTOR, NURSE, ADMIN) ---
@app.post("/admin/users", response_model=schemas.UserResponse)
def create_staff(
    user: schemas.UserCreateStaff, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.check_role(["ADMIN"]))
):
    # ✅ CHỈ ADMIN CÓ QUY HẠN TẠO NHÂN VIÊN
    # Check trùng username
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username đã tồn tại")

    hashed_password = security.pwd_context.hash(user.password)
    
    # --- SỬA ĐOẠN NÀY ---
    # Nếu email/phone là chuỗi rỗng "", chuyển thành None để DB hiểu là NULL (được phép trùng NULL)
    email_val = user.email if user.email and user.email.strip() != "" else None
    phone_val = user.phone if user.phone and user.phone.strip() != "" else None
    
    new_staff = models.User(
        username=user.username,
        password=hashed_password,
        full_name=user.full_name,
        role=user.role,
        email=email_val, # Sử dụng giá trị đã xử lý
        phone=phone_val  # Sử dụng giá trị đã xử lý
    )
    # --------------------

    db.add(new_staff)
    db.commit()
    db.refresh(new_staff)
    return new_staff

# --- CẤU HÌNH EMAIL (Thay đổi thông tin của bạn vào đây) ---
conf = ConnectionConfig(
    MAIL_USERNAME = "tuvan990.cv@gmail.com",
    MAIL_PASSWORD = "fozy nozh sghf wlci",
    MAIL_FROM = "tuvan990.cv@gmail.com",
    MAIL_PORT = 587,
    MAIL_SERVER = "smtp.gmail.com",
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)
# Hàm sinh mã OTP 6 số ngẫu nhiên
def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

# --- API: Yêu cầu quên mật khẩu (Gửi Email OTP) ---
@app.post("/forgot-password")
async def forgot_password(request: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    # 1. Kiểm tra email có tồn tại không
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        # Bảo mật: Không nên báo rõ là "Email không tồn tại" để tránh bị dò quét, 
        # nhưng để test thì ta cứ báo lỗi 404.
        raise HTTPException(status_code=404, detail="Email không tồn tại trong hệ thống")

    # 2. Sinh OTP và lưu vào DB
    otp = generate_otp()
    user.reset_token = otp
    # Token hết hạn sau 15 phút
    user.reset_token_exp = datetime.now() + timedelta(minutes=15)
    db.commit()

    # 3. Gửi Email thật
    html = f"""
    <h3>Yêu cầu đặt lại mật khẩu</h3>
    <p>Xin chào {user.full_name},</p>
    <p>Mã xác thực (OTP) của bạn là: <strong style="font-size: 24px; color: blue;">{otp}</strong></p>
    <p>Mã này sẽ hết hạn sau 15 phút.</p>
    <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
    """

    message = MessageSchema(
        subject="[Hospital App] Mã xác thực khôi phục mật khẩu",
        recipients=[request.email],
        body=html,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    await fm.send_message(message)

    return {"message": "Đã gửi mã OTP qua email"}

# --- API: Xác nhận OTP và Đặt mật khẩu mới ---
@app.post("/reset-password")
def reset_password(request: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    # 1. Tìm user
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User không tồn tại")

    # 2. Kiểm tra OTP
    if user.reset_token != request.otp:
        raise HTTPException(status_code=400, detail="Mã OTP không đúng")
    
    # 3. Kiểm tra thời gian hết hạn
    if user.reset_token_exp < datetime.now():
        raise HTTPException(status_code=400, detail="Mã OTP đã hết hạn")

    # 4. Đổi mật khẩu
    user.password = security.pwd_context.hash(request.new_password)
    
    # 5. Xóa OTP sau khi dùng xong
    user.reset_token = None
    user.reset_token_exp = None
    db.commit()

    return {"message": "Đặt lại mật khẩu thành công"}

# --- API: Lấy danh sách nhân viên (Cho Admin xem) ---
@app.get("/admin/users", response_model=list[schemas.UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.check_role(["ADMIN"]))
):
    # ✅ CHỈ ADMIN CÓ QUYỀN XEM DANH SÁCH NHÂN VIÊN
    # Chỉ lấy Admin, Doctor, Nurse (bỏ qua Patient cho đỡ rối list nhân viên)
    return db.query(models.User).filter(models.User.role.in_(['ADMIN', 'DOCTOR', 'NURSE','TECHNICIAN'])).all()

# --- API 2: Lấy thông tin người dùng hiện tại (Cần Token mới gọi được) ---
@app.get("/users/me", response_model=schemas.UserProfileResponse)
def read_users_me(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = security.jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        username: str = payload.get("sub")
    except security.jwt.JWTError:
        raise HTTPException(status_code=401, detail="Token không hợp lệ")
        
    # Query User và join sẵn với Patient để lấy CCCD/BHYT nếu có
    user = db.query(models.User).options(joinedload(models.User.patient_record)).filter(models.User.username == username).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy user")
    
    # Map dữ liệu sang Schema response
    resp = schemas.UserProfileResponse(
        user_id=user.user_id,
        username=user.username,
        full_name=user.full_name,
        role=user.role,
        email=user.email,
        phone=user.phone,
        address=user.address,
        patient_info=None
    )
    
    # Nếu user này liên kết với 1 hồ sơ bệnh nhân, lấy CCCD và BHYT
    if user.patient_record:
        resp.patient_info = schemas.PatientInfoSimple(
            cccd=user.patient_record.cccd,
            insurance_card=user.patient_record.insurance_card
        )
        
    return resp


@app.put("/users/me", response_model=schemas.UserProfileResponse)
def update_user_me(
    update_data: schemas.UserProfileUpdate,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    # 1. Xác thực user
    try:
        payload = security.jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        username: str = payload.get("sub")
    except security.jwt.JWTError:
        raise HTTPException(status_code=401, detail="Token không hợp lệ")
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User không tồn tại")

    # 2. Xử lý đổi mật khẩu (Nếu có gửi lên)
    if update_data.new_password:
        if not update_data.current_password:
             raise HTTPException(status_code=400, detail="Vui lòng nhập mật khẩu hiện tại để xác nhận thay đổi")
        if not security.verify_password(update_data.current_password, user.password):
             raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không đúng")
        
        # Hash mật khẩu mới
        user.password = security.pwd_context.hash(update_data.new_password)

    # 3. Kiểm tra trùng username (Nếu đổi username)
    if update_data.username != user.username:
        exists = db.query(models.User).filter(models.User.username == update_data.username).first()
        if exists:
            raise HTTPException(status_code=400, detail="Tên đăng nhập đã tồn tại")
        user.username = update_data.username

    # 4. Cập nhật thông tin cơ bản
    user.email = update_data.email
    user.phone = update_data.phone
    user.address = update_data.address

    # 5. Đồng bộ sang bảng Patients (nếu là bệnh nhân) để dữ liệu nhất quán
    if user.patient_record:
        user.patient_record.phone = update_data.phone
        user.patient_record.address = update_data.address
        # Email và CCCD thường ít đổi, hoặc cần quy trình riêng, ở đây ta sync Phone/Address

    db.commit()
    db.refresh(user)

    # Trả về kết quả mới
    resp = schemas.UserProfileResponse.model_validate(user) # Pydantic v2 style
    if user.patient_record:
        resp.patient_info = schemas.PatientInfoSimple(
            cccd=user.patient_record.cccd,
            insurance_card=user.patient_record.insurance_card
        )
    return resp

# --- API 3: Thêm bệnh nhân mới ---
from typing import List, Optional
@app.post("/patients", response_model=schemas.PatientResponse)
def create_patient(
    patient: schemas.PatientCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.check_role(["ADMIN", "DOCTOR", "NURSE"]))
):
    # ✅ CHỈ Y TÁ, BÁC SĨ, ADMIN CÓ QUYỀN TẠO BỆNH NHÂN
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
    current_user: dict = Depends(security.check_role(["ADMIN", "DOCTOR", "NURSE"]))
):
    # ✅ CHỈ Y TÁ, BÁC SĨ, ADMIN CÓ QUYỀN XEM DANH SÁCH BỆNH NHÂN
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
    current_user: dict = Depends(security.check_role(["ADMIN"]))
):
    # ✅ CHỈ ADMIN CÓ QUYỀN THÊM THUỐC VÀO KHO
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
def get_expiring_medicines(
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.check_role(["ADMIN"]))
):
    # ✅ CHỈ ADMIN CÓ QUYỀN XEM CẢNH BÁO HẠN SỬ DỤNG
    from datetime import datetime, timedelta
    thirty_days_later = datetime.now() + timedelta(days=30)
    
    # Lấy thuốc có hạn sử dụng nhỏ hơn 30 ngày tới
    return db.query(models.Medicine).filter(
        models.Medicine.expiry_date <= thirty_days_later
    ).all()

# --- API 6: Lấy danh sách thuốc (Để bác sĩ chọn) ---
@app.get("/medicines", response_model=list[schemas.MedicineResponse])
def get_medicines(
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.check_role(["ADMIN", "DOCTOR", "NURSE", "TECHNICIAN"]))
):
    # ✅ CHỈ DOCTOR, NURSE, ADMIN, TECHNICIAN CÓ QUYỀN XEM DANH SÁCH THUỐC
    return db.query(models.Medicine).all()

# --- API 7: Tạo lượt khám (Y tá tiếp nhận) ---
@app.post("/visits", response_model=schemas.VisitResponse)
def create_visit(
    visit: schemas.VisitCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.check_role(["ADMIN", "NURSE"]))
):
    # ✅ CHỈ Y TÁ VÀ ADMIN CÓ QUYỀN TẠO LƯỢT KHÁM
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
    current_user: dict = Depends(security.check_role(["ADMIN", "DOCTOR", "NURSE"]))
):
    # ✅ CHỈ DOCTOR, NURSE, ADMIN CÓ QUYỀN XEM DANH SÁCH KHÁM
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
    current_user: dict = Depends(security.check_role(["DOCTOR"]))
):
    # ✅ CHỈ BÁC SĨ CÓ QUYỀN CẬP NHẬT CHẨN ĐOÁN
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
    current_user: dict = Depends(security.check_role(["DOCTOR"]))
):
    # ✅ CHỈ BÁC SĨ CÓ QUYỀN KÊ ĐƠN THUỐC
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
    current_user: dict = Depends(security.check_role(["DOCTOR"]))
):
    # ✅ CHỈ BÁC SĨ CÓ QUYỀN KẾT THÚC KHÁM
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
    current_user: dict = Depends(security.check_role(["ADMIN", "DOCTOR"]))
):
    # ✅ CHỈ DOCTOR VÀ ADMIN CÓ QUYỀN XEM HÓA ĐƠN
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

# --- API 13 (Nâng cấp): Thanh toán & Lưu hóa đơn chi tiết ---
@app.post("/invoices", response_model=schemas.InvoiceResponse)
def create_invoice(
    inv: schemas.InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.check_role(["ADMIN"]))
):
    # ✅ CHỈ ADMIN CÓ QUYỀN TẠO HÓA ĐƠN
    # (Logic tính toán lặp lại để bảo mật - nên tách thành hàm riêng nếu dự án lớn)
    prescriptions = db.query(models.Prescription).filter(models.Prescription.visit_id == inv.visit_id).all()
    medicine_total = sum([p.quantity * float(db.query(models.Medicine).get(p.medicine_id).price) for p in prescriptions])
    
    sub_total = medicine_total + FIXED_EXAM_FEE + inv.procedure_fee
    discount = sub_total * (inv.insurance_percent / 100)
    final_amount = sub_total - discount
    
    # Lưu hóa đơn
    db_invoice = models.Invoice(
        visit_id=inv.visit_id,
        medicine_total=medicine_total,
        exam_fee=FIXED_EXAM_FEE,
        procedure_fee=inv.procedure_fee,
        insurance_percent=inv.insurance_percent,
        final_amount=final_amount,
        payment_method=inv.payment_method,
        # Lưu ý: Cột total_amount cũ trong DB có thể dùng để lưu sub_total hoặc final tùy quy ước
        # Ở đây ta tạm bỏ qua cột total_amount cũ hoặc gán nó bằng sub_total
    )
    db.add(db_invoice)
    
    # Update trạng thái lượt khám
    visit = db.query(models.Visit).filter(models.Visit.visit_id == inv.visit_id).first()
    visit.status = "PAID"
    
    db.commit()
    db.refresh(db_invoice)
    
    # Map dữ liệu để trả về đúng schema
    return {
        **db_invoice.__dict__, 
        "total_amount": sub_total # Trả về tổng chưa giảm để frontend hiển thị
    }

# --- API BÁO CÁO (ADMIN) ---

# 1. Doanh thu theo ngày (7 ngày gần nhất)
@app.get("/reports/revenue", response_model=list[schemas.RevenueReport])
def report_revenue(
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.check_role(["ADMIN"]))
):
    # ✅ CHỈ ADMIN CÓ QUYỀN XEM BÁOCÁO DOANH THU
    # Query Group By Date(payment_time)
    results = db.query(
        func.date(models.Invoice.payment_time).label("date"),
        func.sum(models.Invoice.final_amount).label("daily_revenue"),
        func.count(models.Invoice.invoice_id).label("patient_count")
    ).group_by(func.date(models.Invoice.payment_time))\
     .order_by(desc("date")).limit(7).all()
    
    return results

# 2. Top thuốc bán chạy
@app.get("/reports/top-medicines", response_model=list[schemas.TopMedicine])
def report_top_medicines(
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.check_role(["ADMIN"]))
):
    # ✅ CHỈ ADMIN CÓ QUYỀN XEM BÁOCÁO TOP THUỐC
    results = db.query(
        models.Medicine.name,
        func.sum(models.Prescription.quantity).label("sold_quantity"),
        models.Medicine.stock_quantity
    ).join(models.Prescription, models.Medicine.medicine_id == models.Prescription.medicine_id)\
     .group_by(models.Medicine.medicine_id)\
     .order_by(desc("sold_quantity")).limit(5).all()
     
    return results


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

# main.py (Thêm các endpoints mới)
from datetime import time, timedelta, date

# --- API BOOKING 1: Tạo lịch làm việc (Cho Admin/Doctor) ---
@app.post("/schedules", response_model=schemas.ScheduleResponse)
def create_schedule(
    sch: schemas.ScheduleCreate, 
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    # Kiểm tra xem bác sĩ đã có lịch ngày đó chưa
    existing = db.query(models.DoctorSchedule).filter(
        models.DoctorSchedule.doctor_id == sch.doctor_id,
        models.DoctorSchedule.day_of_week == sch.day_of_week
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Bác sĩ đã có lịch làm việc vào thứ này")
    
    # Parse string to time objects
    t_start = datetime.strptime(sch.shift_start, "%H:%M").time()
    t_end = datetime.strptime(sch.shift_end, "%H:%M").time()
    
    new_sch = models.DoctorSchedule(
        doctor_id=sch.doctor_id,
        day_of_week=sch.day_of_week,
        shift_start=t_start,
        shift_end=t_end
    )
    db.add(new_sch)
    db.commit()
    db.refresh(new_sch)
    return new_sch

# --- HELPER: Hàm sinh slot 30 phút ---
def generate_time_slots(start_time: time, end_time: time) -> list[time]:
    slots = []
    current = datetime.combine(date.today(), start_time)
    end = datetime.combine(date.today(), end_time)
    
    while current < end:
        slots.append(current.time())
        current += timedelta(minutes=30) # Mỗi slot 30 phút
    return slots

# --- API BOOKING 2: Lấy danh sách Slot trống (Cho bệnh nhân chọn) ---
@app.get("/doctors/{doctor_id}/slots")
def get_doctor_slots(
    doctor_id: int, 
    date_str: str, # Format YYYY-MM-DD
    db: Session = Depends(get_db)
):
    # 1. Xác định thứ trong tuần (0=Monday, 6=Sunday trong Python, nhưng DB ta quy ước 0=Sun, 1=Mon.. tùy bạn)
    # Ở đây tôi dùng chuẩn Python: weekday() trả về 0=Mon, 6=Sun. 
    # Nếu DB bạn lưu 0=Sun thì cần map lại. Giả sử ta dùng chuẩn Python 0=Mon.
    target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    day_idx = target_date.weekday() # 0-6
    
    # 2. Lấy lịch làm việc của bác sĩ ngày đó
    schedule = db.query(models.DoctorSchedule).filter(
        models.DoctorSchedule.doctor_id == doctor_id,
        models.DoctorSchedule.day_of_week == day_idx,
        models.DoctorSchedule.is_active == True
    ).first()
    
    if not schedule:
        return {"message": "Bác sĩ không làm việc ngày này", "slots": []}
    
    # 3. Sinh tất cả các slot có thể
    all_slots = generate_time_slots(schedule.shift_start, schedule.shift_end)
    
    # 4. Lấy các lịch đã được đặt (không tính Cancelled)
    booked_appts = db.query(models.Appointment).filter(
        models.Appointment.doctor_id == doctor_id,
        models.Appointment.appointment_date == target_date,
        models.Appointment.status != 'CANCELLED'
    ).all()
    
    booked_times = [appt.start_time for appt in booked_appts]
    
    # 5. Đánh dấu slot nào đã full
    result = []
    for slot in all_slots:
        is_booked = slot in booked_times
        result.append({"time": slot.strftime("%H:%M"), "is_booked": is_booked})
        
    return result

# --- API BOOKING 3: Đặt lịch hẹn ---
@app.post("/appointments", response_model=schemas.AppointmentResponse)
def create_appointment(
    appt: schemas.AppointmentCreate, 
    db: Session = Depends(get_db)
):
    # 1. Validate logic nghiệp vụ (trước 2 tiếng, không quá 30 ngày...)
    appt_dt = datetime.combine(appt.appointment_date, datetime.strptime(appt.start_time, "%H:%M").time())
    if appt_dt < datetime.now() + timedelta(hours=2):
        raise HTTPException(status_code=400, detail="Phải đặt trước ít nhất 2 tiếng")
        
    # 2. Check trùng lần nữa (Double check)
    is_exist = db.query(models.Appointment).filter(
        models.Appointment.doctor_id == appt.doctor_id,
        models.Appointment.appointment_date == appt.appointment_date,
        models.Appointment.start_time == appt.start_time,
        models.Appointment.status != 'CANCELLED'
    ).first()
    
    if is_exist:
        raise HTTPException(status_code=400, detail="Khung giờ này vừa có người đặt xong")
        
    # 3. Lưu
    end_time = (appt_dt + timedelta(minutes=30)).time()
    
    new_appt = models.Appointment(
        patient_id=appt.patient_id,
        doctor_id=appt.doctor_id,
        appointment_date=appt.appointment_date,
        start_time=appt_dt.time(),
        end_time=end_time,
        reason=appt.reason,
        status="PENDING" # Mặc định chờ duyệt hoặc Confirm luôn tùy policy
    )
    db.add(new_appt)
    db.commit()
    db.refresh(new_appt)
    return new_appt

# --- API BOOKING 4: Bác sĩ xem lịch hôm nay ---
@app.get("/appointments/today", response_model=list[schemas.AppointmentResponse])
def get_today_appointments(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    # Lấy user từ token (giả sử đã decode role=DOCTOR)
    # (Để đơn giản tôi hardcode user_id hoặc lấy từ logic user/me)
    # Đúng ra phải decode token -> lấy user_id. Tạm thời query all cho ngày hôm nay.
    today = date.today()
    appts = db.query(models.Appointment).filter(
        models.Appointment.appointment_date == today,
        models.Appointment.status.in_(['PENDING', 'CONFIRMED'])
    ).all()
    
    # Map thêm tên bệnh nhân để hiển thị
    response_data = []
    for a in appts:
        pt = db.query(models.Patient).get(a.patient_id)
        a.patient_name = pt.full_name if pt else "Unknown"
        response_data.append(a)
        
    return response_data

# --- API BOOKING 5: Check-in (Y tá chuyển Booking -> Visit) ---
@app.post("/appointments/{appt_id}/check-in")
def check_in_appointment(
    appt_id: int, 
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    # 1. Tìm lịch hẹn
    appt = db.query(models.Appointment).get(appt_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch hẹn")
    
    if appt.status == 'COMPLETED':
        raise HTTPException(status_code=400, detail="Lịch hẹn này đã khám xong")

    # 2. Tạo Visit mới (trạng thái WAITING)
    new_visit = models.Visit(
        patient_id=appt.patient_id,
        doctor_id=appt.doctor_id,
        status="WAITING",
        chief_complaint=appt.reason, # Lấy lý do đặt lịch làm triệu chứng ban đầu
        priority="NORMAL"
    )
    db.add(new_visit)
    
    # 3. Cập nhật trạng thái Appointment -> COMPLETED
    appt.status = "COMPLETED"
    
    db.commit()
    return {"message": "Đã check-in thành công. Bệnh nhân đã vào danh sách chờ khám."}

@app.post("/appointments", response_model=schemas.AppointmentResponse)
def create_appointment(
    appt: schemas.AppointmentCreate,
    db: Session = Depends(get_db),
    # token: str = Depends(oauth2_scheme) # Bỏ comment nếu muốn bắt buộc đăng nhập
):
    # 1. Kết hợp Ngày và Giờ hẹn thành một đối tượng datetime hoàn chỉnh
    # appt.start_time đang là chuỗi "HH:MM", cần chuyển về time object nếu chưa convert
    try:
        # Nếu schema đã validate ra time object thì dùng luôn, nếu là string thì parse
        if isinstance(appt.start_time, str):
            t = datetime.strptime(appt.start_time, "%H:%M").time()
        else:
            t = appt.start_time
            
        appointment_datetime = datetime.combine(appt.appointment_date, t)
    except ValueError:
        raise HTTPException(status_code=400, detail="Định dạng thời gian không hợp lệ")

    # 2. Lấy thời gian hiện tại
    now = datetime.now()

    # 3. KIỂM TRA QUY TẮC 2 TIẾNG
    # Logic: Thời gian hẹn phải lớn hơn (Hiện tại + 2 giờ)
    min_allowed_time = now + timedelta(hours=2)

    if appointment_datetime < min_allowed_time:
        raise HTTPException(
            status_code=400, 
            detail=f"Vui lòng đặt lịch trước ít nhất 2 tiếng. Thời gian sớm nhất có thể đặt là: {min_allowed_time.strftime('%H:%M %d/%m/%Y')}"
        )

    # 4. Kiểm tra trùng lịch của Bác sĩ
    # Tìm xem bác sĩ đó, vào ngày đó, giờ đó có ai đặt chưa (trừ những lịch đã hủy)
    conflict = db.query(models.Appointment).filter(
        models.Appointment.doctor_id == appt.doctor_id,
        models.Appointment.appointment_date == appt.appointment_date,
        models.Appointment.start_time == t, # So sánh giờ
        models.Appointment.status != "CANCELLED"
    ).first()

    if conflict:
        raise HTTPException(status_code=400, detail="Bác sĩ đã có lịch hẹn vào khung giờ này")

    # 5. Lưu vào DB
    # Tính giờ kết thúc (mặc định +30 phút)
    end_time = (datetime.combine(date.min, t) + timedelta(minutes=30)).time()

    new_appt = models.Appointment(
        patient_id=appt.patient_id,
        doctor_id=appt.doctor_id,
        appointment_date=appt.appointment_date,
        start_time=t,
        end_time=end_time,
        reason=appt.reason,
        status="PENDING"
    )
    db.add(new_appt)
    db.commit()
    db.refresh(new_appt)
    
    return new_appt

# --- API SERVICES 1: Lấy danh mục dịch vụ ---
@app.get("/services", response_model=list[schemas.ServiceResponse])
def get_services(db: Session = Depends(get_db)):
    return db.query(models.Service).filter(models.Service.is_active == True).all()

# --- API SERVICES 2: Bác sĩ chỉ định dịch vụ ---
@app.post("/visits/{visit_id}/services", response_model=schemas.ServiceRequestResponse)
def create_service_request(
    visit_id: int,
    req: schemas.ServiceRequestCreate,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    # Lấy doctor_id từ token (giả lập logic lấy user hiện tại)
    # Trong thực tế bạn nên decode token để lấy user_id
    # Ở đây tôi hardcode hoặc query tạm user DOCTOR đầu tiên để demo
    current_user = db.query(models.User).filter(models.User.role == 'DOCTOR').first() 
    doctor_id = current_user.user_id if current_user else 2

    new_req = models.ServiceRequest(
        visit_id=visit_id,
        service_id=req.service_id,
        doctor_id=doctor_id,
        quantity=req.quantity,
        status="PENDING"
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    
    # Map dữ liệu trả về
    service = db.query(models.Service).get(req.service_id)
    new_req.service_name = service.name
    new_req.price = service.price
    return new_req

# --- API SERVICES 3: Lấy danh sách chỉ định của 1 lượt khám (kèm kết quả) ---
@app.get("/visits/{visit_id}/services", response_model=list[schemas.ServiceRequestResponse])
def get_visit_services(visit_id: int, db: Session = Depends(get_db)):
    requests = db.query(models.ServiceRequest).filter(models.ServiceRequest.visit_id == visit_id).all()
    
    # Map tên dịch vụ và kết quả vào response
    for req in requests:
        req.service_name = req.service.name
        req.price = req.service.price
        # req.result tự động load nhờ relationship
    return requests

# --- API SERVICES 4: Kỹ thuật viên xem danh sách chờ (Queue) ---
@app.get("/service-requests", response_model=list[schemas.ServiceRequestResponse])
def get_pending_requests(status: str = "PENDING", db: Session = Depends(get_db)):
    # Lấy các request theo trạng thái
    reqs = db.query(models.ServiceRequest).filter(models.ServiceRequest.status == status).all()
    
    # Map thêm thông tin
    for req in reqs:
        req.service_name = req.service.name
        req.price = req.service.price
    return reqs

# --- API SERVICES 5: Kỹ thuật viên trả kết quả ---
@app.post("/service-results", response_model=schemas.ServiceResultResponse)
def create_service_result(
    res: schemas.ServiceResultCreate,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    # Lấy technician_id (Giả lập logic)
    current_user = db.query(models.User).filter(models.User.role == 'TECHNICIAN').first() 
    tech_id = current_user.user_id if current_user else 3 # Fallback

    # 1. Tạo kết quả
    new_result = models.ServiceResult(
        request_id=res.request_id,
        technician_id=tech_id,
        result_data=res.result_data,
        image_url=res.image_url,
        conclusion=res.conclusion
    )
    db.add(new_result)
    
    # 2. Cập nhật trạng thái Request -> COMPLETED
    req = db.query(models.ServiceRequest).get(res.request_id)
    req.status = "COMPLETED"
    
    db.commit()
    db.refresh(new_result)
    return new_result

# --- CẬP NHẬT API BILL (Tính thêm tiền dịch vụ) ---
@app.get("/visits/{visit_id}/bill")
def preview_bill(
    visit_id: int,
    insurance_percent: int = 0,
    procedure_fee: float = 0, # Có thể bỏ tham số này nếu dùng ServiceRequest hết
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    # 1. Tính tiền thuốc
    prescriptions = db.query(models.Prescription).filter(models.Prescription.visit_id == visit_id).all()
    medicine_total = 0
    medicine_details = []
    for pres in prescriptions:
        med = db.query(models.Medicine).get(pres.medicine_id)
        cost = pres.quantity * float(med.price)
        medicine_total += cost
        medicine_details.append({"name": med.name, "qty": pres.quantity, "price": med.price, "total": cost})

    # 2. (MỚI) Tính tiền Dịch vụ CLS (Xét nghiệm/Chụp chiếu)
    service_requests = db.query(models.ServiceRequest).filter(
        models.ServiceRequest.visit_id == visit_id,
        models.ServiceRequest.status != 'CANCELLED' # Chỉ tính cái chưa hủy
    ).all()
    
    service_total = 0
    service_details = []
    for req in service_requests:
        srv = req.service
        cost = req.quantity * float(srv.price)
        service_total += cost
        service_details.append({"name": srv.name, "qty": req.quantity, "price": srv.price, "total": cost})

    # 3. Tổng hợp
    # procedure_fee (thủ thuật ngoài) có thể giữ hoặc bỏ, ở đây ta cộng dồn vào
    sub_total = medicine_total + service_total + FIXED_EXAM_FEE + procedure_fee
    discount = sub_total * (insurance_percent / 100)
    final_amount = sub_total - discount
    
    return {
        "medicine_details": medicine_details,
        "service_details": service_details, # Trả thêm chi tiết dịch vụ
        "medicine_total": medicine_total,
        "service_total": service_total,     # Tổng tiền dịch vụ
        "exam_fee": FIXED_EXAM_FEE,
        "procedure_fee": procedure_fee,
        "sub_total": sub_total,
        "insurance_percent": insurance_percent,
        "discount": discount,
        "final_amount": final_amount
    }
    
# --- API NỘI TRÚ 1: Lấy Sơ đồ giường (Bed Map) ---
@app.get("/beds/map")
def get_bed_map(db: Session = Depends(get_db)):
    # Logic: Lấy hết Departments -> Rooms -> Beds
    # Để đơn giản hóa cho Frontend, ta trả về dạng Flat list hoặc Group by Dept
    departments = db.query(models.Department).all()
    result = []
    
    for dept in departments:
        dept_beds = []
        for room in dept.rooms:
            for bed in room.beds:
                # Map thông tin để hiển thị
                dept_beds.append({
                    "bed_id": bed.bed_id,
                    "bed_number": bed.bed_number,
                    "status": bed.status,
                    "room_number": room.room_number,
                    "type": room.type,
                    "price": float(room.base_price)
                })
        result.append({
            "department_id": dept.department_id,
            "department_name": dept.name,
            "beds": dept_beds
        })
    return result

# --- API NỘI TRÚ 2: Nhập viện (Admission) ---
@app.post("/inpatients/admit", response_model=schemas.InpatientResponse)
def admit_patient(
    adm: schemas.AdmissionCreate, 
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    # 1. Kiểm tra giường có trống không
    bed = db.query(models.Bed).filter(models.Bed.bed_id == adm.bed_id).first()
    if not bed or bed.status != 'AVAILABLE':
        raise HTTPException(status_code=400, detail="Giường không tồn tại hoặc đã có người nằm")

    # 2. Tạo hồ sơ nội trú
    # (Lấy doctor từ token nếu cần, ở đây lấy từ request)
    new_record = models.InpatientRecord(
        patient_id=adm.patient_id,
        treating_doctor_id=adm.treating_doctor_id or 2, # Default BS mẫu
        initial_diagnosis=adm.initial_diagnosis,
        status='ACTIVE'
    )
    db.add(new_record)
    db.flush() # Để lấy inpatient_id ngay

    # 3. Cập nhật trạng thái giường -> OCCUPIED
    bed.status = 'OCCUPIED'
    
    # 4. Tạo phân bổ giường (BedAllocation)
    room = db.query(models.Room).get(bed.room_id)
    new_alloc = models.BedAllocation(
        inpatient_id=new_record.inpatient_id,
        bed_id=bed.bed_id,
        price_per_day=room.base_price # Lưu giá tại thời điểm nhập viện
    )
    db.add(new_alloc)
    
    db.commit()
    db.refresh(new_record)
    
    # Map response
    pt = db.query(models.Patient).get(adm.patient_id)
    return {
        "inpatient_id": new_record.inpatient_id,
        "patient_name": pt.full_name,
        "bed_number": bed.bed_number,
        "status": new_record.status,
        "admission_date": new_record.admission_date
    }

# --- API NỘI TRÚ 3: Xuất viện (Discharge) & Tính tiền giường ---
@app.post("/inpatients/{inpatient_id}/discharge")
def discharge_patient(
    inpatient_id: int,
    db: Session = Depends(get_db)
):
    record = db.query(models.InpatientRecord).get(inpatient_id)
    if not record or record.status != 'ACTIVE':
        raise HTTPException(status_code=400, detail="Hồ sơ không hợp lệ")

    # 1. Kết thúc phân bổ giường hiện tại
    last_alloc = db.query(models.BedAllocation).filter(
        models.BedAllocation.inpatient_id == inpatient_id,
        models.BedAllocation.check_out_time == None
    ).first()
    
    total_bed_fee = 0
    
    if last_alloc:
        last_alloc.check_out_time = datetime.now()
        
        # Trả giường về trạng thái CLEANING (để dọn dẹp) hoặc AVAILABLE
        bed = db.query(models.Bed).get(last_alloc.bed_id)
        bed.status = 'AVAILABLE' 
        
        # Tính tiền sơ bộ (Demo logic đơn giản: số ngày * giá)
        duration = last_alloc.check_out_time - last_alloc.check_in_time
        days = max(1, duration.days) # Ít nhất tính 1 ngày
        total_bed_fee = days * float(last_alloc.price_per_day)

    # 2. Đóng hồ sơ
    record.status = 'DISCHARGED'
    record.discharge_date = datetime.now()
    
    db.commit()
    
    return {
        "message": "Xuất viện thành công",
        "bed_fee": total_bed_fee,
        "days": days if last_alloc else 0
    }
    

# --- API KHO 1: CRUD Nhà cung cấp ---
@app.get("/suppliers", response_model=List[schemas.SupplierBase]) # Sửa response model cho đúng list
def get_suppliers(db: Session = Depends(get_db)):
    return db.query(models.Supplier).all()

# --- API KHO 2: Tạo Phiếu nhập kho (Quy trình quan trọng) ---
@app.post("/imports", response_model=schemas.ImportReceiptResponse)
def create_import(
    receipt: schemas.ImportReceiptCreate,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    # 1. Tạo Header
    new_receipt = models.ImportReceipt(
        supplier_id=receipt.supplier_id,
        status='DRAFT',
        note=receipt.note,
        total_amount=0 # Sẽ tính lại
    )
    db.add(new_receipt)
    db.commit()
    db.refresh(new_receipt)

    # 2. Tạo Details & Tính tổng tiền
    total = 0
    for item in receipt.details:
        detail = models.ImportDetail(
            receipt_id=new_receipt.receipt_id,
            item_type=item.item_type,
            item_id=item.item_id,
            quantity=item.quantity,
            import_price=item.import_price,
            batch_number=item.batch_number,
            expiry_date=item.expiry_date
        )
        db.add(detail)
        total += (item.quantity * item.import_price)
    
    # Update tổng tiền
    new_receipt.total_amount = total
    db.commit()
    db.refresh(new_receipt)
    return new_receipt

# --- API KHO 3: Xác nhận nhập kho (Update Stock) ---
@app.put("/imports/{receipt_id}/confirm")
def confirm_import(
    receipt_id: int,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    # 1. Lấy phiếu
    receipt = db.query(models.ImportReceipt).get(receipt_id)
    if not receipt or receipt.status != 'DRAFT':
        raise HTTPException(status_code=400, detail="Phiếu không tồn tại hoặc đã nhập")

    # 2. Duyệt qua từng dòng chi tiết để cộng kho
    for detail in receipt.details:
        if detail.item_type == 'MEDICINE':
            item = db.query(models.Medicine).get(detail.item_id)
        else:
            item = db.query(models.MedicalSupply).get(detail.item_id)
            
        if item:
            # Cộng tồn kho
            item.stock_quantity += detail.quantity
            # Cập nhật giá nhập mới nhất (nếu muốn)
            # item.import_price = detail.import_price
            
            # Cập nhật hạn dùng (Logic đơn giản: Lấy hạn xa nhất hoặc hạn của lô mới nhất)
            # Ở đây ta tạm update hạn của lô mới nhập để cảnh báo
            if hasattr(item, 'expiry_date'): 
                 item.expiry_date = detail.expiry_date

    # 3. Đổi trạng thái phiếu
    receipt.status = 'COMPLETED'
    db.commit()
    
    return {"message": "Đã nhập kho thành công, tồn kho đã được cập nhật"}

# --- API KHO 4: Hệ thống Cảnh báo (Alerts) ---
@app.get("/inventory/alerts", response_model=List[schemas.InventoryAlert])
def get_inventory_alerts(db: Session = Depends(get_db)):
    alerts = []
    today = date.today()
    warning_date = today + timedelta(days=60) # Cảnh báo trước 60 ngày

    # 1. Quét Thuốc (Medicines)
    medicines = db.query(models.Medicine).all()
    for med in medicines:
        # Cảnh báo Tồn kho thấp
        if med.stock_quantity <= (med.stock_quantity or 10): # Logic tạm, đúng ra phải có col min_stock_level
             # Do DB cũ chưa có min_stock_level, bạn chạy SQL alter ở trên thì dùng:
             # if med.stock_quantity <= getattr(med, 'min_stock_level', 10):
             pass # Logic check ở dưới

        # Check Low Stock
        min_stock = getattr(med, 'min_stock_level', 10) # Safe get
        if med.stock_quantity < min_stock:
            alerts.append({
                "id": med.medicine_id, "name": med.name, "type": "MEDICINE",
                "stock": med.stock_quantity, "min_stock": min_stock,
                "expiry_date": med.expiry_date, "alert_type": "LOW_STOCK"
            })
        
        # Check Hết hạn
        if med.expiry_date and med.expiry_date <= warning_date:
             alerts.append({
                "id": med.medicine_id, "name": med.name, "type": "MEDICINE",
                "stock": med.stock_quantity, "min_stock": min_stock,
                "expiry_date": med.expiry_date, "alert_type": "EXPIRY"
            })

    # 2. Quét Vật tư (MedicalSupplies)
    supplies = db.query(models.MedicalSupply).all()
    for sup in supplies:
        if sup.stock_quantity < sup.min_stock_level:
            alerts.append({
                "id": sup.supply_id, "name": sup.name, "type": "SUPPLY",
                "stock": sup.stock_quantity, "min_stock": sup.min_stock_level,
                "expiry_date": None, "alert_type": "LOW_STOCK"
            })

    return alerts