from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from database import Base
from sqlalchemy.orm import relationship

class Logs(Base):
    __tablename__ = "logs"
    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id"), index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), index=True)
    ct_img = Column(String)
    pred_resnet18 = Column(String)
    pred_resnet50 = Column(String)
    pred_customresnet= Column(String)
    gradcam_resnet18 = Column(String)
    gradcam_resnet50 = Column(String)
    gradcam_customresnet = Column(String)
    diagnose = Column(String)
    description = Column(String)
    timestamp = Column(DateTime, default=datetime.now)

    patient = relationship("User", foreign_keys=[patient_id])
    doctor = relationship("User", foreign_keys=[doctor_id])

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    realname = Column(String)
    hashed_password = Column(String)
    role = Column(String)