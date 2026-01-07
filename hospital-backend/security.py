# security.py
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from functools import wraps

# Cấu hình bảo mật
SECRET_KEY = "chuoi_bi_mat_cua_ban_nen_de_dai_va_kho_doan" # Thay đổi chuỗi này
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 # Token hết hạn sau 30 phút

# Công cụ mã hóa mật khẩu (Bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Cấu hình OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

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

# --- HÀM KIỂM TRA TOKEN & LẤY THÔNG TIN USER ---
def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Xác thực token và trả về thông tin người dùng
    Được sử dụng để kiểm tra token hợp lệ
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        
        if username is None or role is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token không hợp lệ"
            )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không hợp lệ hoặc hết hạn"
        )
    
    return {"username": username, "role": role}

# --- DECORATOR KIỂM TRA QUYỀN ---
def require_role(*allowed_roles):
    """
    Decorator kiểm tra quyền truy cập dựa trên role
    Sử dụng: @require_role("ADMIN") hoặc @require_role("ADMIN", "DOCTOR")
    """
    def decorator(func):
        async def wrapper(*args, token: str = Depends(oauth2_scheme), **kwargs):
            try:
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                user_role = payload.get("role")
                
                if user_role not in allowed_roles:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Quyền truy cập bị từ chối. Yêu cầu role: {', '.join(allowed_roles)}"
                    )
            except jwt.JWTError:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token không hợp lệ hoặc hết hạn"
                )
            
            return await func(*args, token=token, **kwargs)
        return wrapper
    return decorator

# --- DEPENDENCY: KIỂM TRA QUYỀN TRONG ROUTE ---
def check_role(required_roles: list):
    """
    Dependency để kiểm tra quyền trong route
    Sử dụng: depends(check_role(["ADMIN", "DOCTOR"]))
    """
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Quyền truy cập bị từ chối. Yêu cầu: {', '.join(required_roles)}"
            )
        return current_user
    return role_checker