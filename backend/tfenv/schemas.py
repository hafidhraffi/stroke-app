from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class LogBase(BaseModel):
    doctor_id: int
    patient_id: int
    ct_img: str
    pred_resnet18: str
    pred_resnet50: str
    pred_customresnet: str
    gradcam_resnet18: str
    gradcam_resnet50: str
    gradcam_customresnet: str
    diagnose: str
    description: Optional[str] = None

class LogCreate(LogBase):
    pass

class LogRead(LogBase):
    id: int
    timestamp: datetime
    patient_name: str
    doctor_name: str

    model_config = ConfigDict(from_attributes=True)

class Predict(BaseModel):
    pred_resnet18: str
    pred_resnet50: str
    pred_customresnet: str
    confidence_resnet18: float
    confidence_resnet50: float
    confidence_customresnet: float
    gradcam_resnet18: str
    gradcam_resnet50: str
    gradcam_customresnet: str

class UserCreate(BaseModel):
    email: str
    username: str
    realname: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserRead(BaseModel):
    id: int
    email: str
    username: str
    realname: str
    role: str

    model_config = ConfigDict(from_attributes=True)