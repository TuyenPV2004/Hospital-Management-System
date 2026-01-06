# database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Chuỗi kết nối: mysql+pymysql://<user>:<password>@<host>/<db_name>
# Hãy thay 'root' và '123456' bằng user/pass thực tế của bạn
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:123456@localhost/hospital_db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Hàm để lấy session kết nối database (dùng trong các API sau này)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()