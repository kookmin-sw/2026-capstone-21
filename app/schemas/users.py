from pydantic import BaseModel, EmailStr

from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    user_name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False, default="user")
    status = Column(String(50), nullable=False, default="active")
    
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime, 
        nullable=False, 
        server_default=func.now(), 
        onupdate=func.now()
    )