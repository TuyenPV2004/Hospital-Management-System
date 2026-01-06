# security.py
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext

# Cấu hình bảo mật
SECRET_KEY = "chuoi_bi_mat_cua_ban_nen_de_dai_va_kho_doan" # Thay đổi chuỗi này
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 # Token hết hạn sau 30 phút

# Công cụ mã hóa mật khẩu (Bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hàm kiểm tra mật khẩu (so sánh pass nhập vào và pass đã mã hóa trong DB)
def verify_password(plain_password, hashed_password):
    # Vì dữ liệu mẫu SQL ban đầu mình để pass là "123456" chưa mã hóa
    # nên ta viết logic: nếu pass trong DB chưa hash thì so sánh thường
    if not hashed_password.startswith("$2b$"): 
        return plain_password == hashed_password
    return pwd_context.verify(plain_password, hashed_password)

# Hàm tạo mã thông báo (JWT Token)
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt