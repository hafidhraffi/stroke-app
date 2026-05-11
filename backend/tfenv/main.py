from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from auth import admin_required, create_access_token, doctor_required, get_current_user, hash_password, verify_password
import schemas
from database import Base, engine, get_db
from sqlalchemy.orm import Session
import io
import numpy as np
from services import produce_heatmap
from fastapi.middleware.cors import CORSMiddleware
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications.resnet50 import preprocess_input
from models import User, Logs
from sqlalchemy.orm import joinedload
import httpx

Base.metadata.create_all(bind=engine)
app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

resnet50model = load_model("best_resnet50.h5")

@app.post("/predict", response_model=schemas.Predict)
async def predict(
    ct_img: UploadFile = File(...),
    _=Depends(doctor_required)
):
    class_names = ['Bleeding', 'Ischemia', 'Normal']
    ct_img_bytes = await ct_img.read()
    ct_img_pil = image.load_img(io.BytesIO(ct_img_bytes), target_size=(224, 224))
    ct_img_array = image.img_to_array(ct_img_pil)
    preprocessed_ct_img_array = preprocess_input(ct_img_array)
    preprocessed_ct_img_array = np.expand_dims(preprocessed_ct_img_array, axis=0)
    predictions = resnet50model.predict(preprocessed_ct_img_array)
    confidence = np.max(predictions[0])
    predicted_class_index = np.argmax(predictions[0])
    predicted_class = class_names[predicted_class_index]
    gradcam_img = produce_heatmap(resnet50model, preprocessed_ct_img_array, predicted_class_index, ct_img_array)

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8001/predict",
            files={
                "ct_img": ("ct_image.png", ct_img_bytes, "image/png")
            }
        )

    if response.status_code != 200:
        raise Exception("PyTorch service failed")

    data = response.json()

    return schemas.Predict(
        pred_resnet18=data["pred_resnet18"],
        pred_resnet50=predicted_class,
        pred_customresnet=data["pred_customresnet"],
        confidence_resnet18=data["confidence_resnet18"],
        confidence_resnet50=confidence,
        confidence_customresnet=data["confidence_customresnet"],
        gradcam_resnet18=data["gradcam_resnet18"],
        gradcam_resnet50=gradcam_img,
        gradcam_customresnet=data["gradcam_customresnet"]
    )


@app.post("/register")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    new_user = User(
        email=user.email,
        username=user.username,
        realname=user.realname,
        hashed_password=hash_password(user.password),
        role="user"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "user account created"}


@app.post("/admin/create-admin")
def create_admin(user: schemas.UserCreate, _=Depends(admin_required), db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    new_user = User(
        email=user.email,
        username=user.username,
        realname=user.realname,
        hashed_password=hash_password(user.password),
        role="admin"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "admin account created"}


@app.post("/admin/create-doctor")
def create_doctor(user: schemas.UserCreate, _=Depends(admin_required), db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    new_user = User(
        email=user.email,
        username=user.username,
        realname=user.realname,
        hashed_password=hash_password(user.password),
        role="doctor"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "doctor account created"}


@app.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({
        "sub": db_user.email,
        "user_id": db_user.id,
        "role": db_user.role
    })
    return {
        "name": db_user.realname,
        "access_token": token,
        "token_type": "bearer"
    }


@app.get("/logs", response_model=list[schemas.LogRead])
def get_logs(user=Depends(get_current_user), db: Session = Depends(get_db)):
    role = user["role"]

    if role == "user":
        logs = db.query(Logs).options(joinedload(Logs.patient), joinedload(Logs.doctor)).filter(Logs.patient_id == user["user_id"]).all()
    elif role == "doctor":
        logs = db.query(Logs).options(joinedload(Logs.patient), joinedload(Logs.doctor)).filter(Logs.doctor_id == user["user_id"]).all()
    elif role == "admin":
        logs = db.query(Logs).options(joinedload(Logs.patient), joinedload(Logs.doctor)).all()
    else:
        raise HTTPException(status_code=403, detail="Invalid role")
    
    return [
    {
        **log.__dict__,
        "patient_name": log.patient.realname,
        "doctor_name": log.doctor.realname
    }
    for log in logs
]


@app.post("/save-result")
def save_result(log_data: schemas.LogCreate, _=Depends(doctor_required), db: Session = Depends(get_db)):
    log_object = Logs(
        doctor_id=log_data.doctor_id,
        patient_id=log_data.patient_id,
        ct_img=log_data.ct_img,
        pred_resnet18=log_data.pred_resnet18,
        pred_resnet50=log_data.pred_resnet50,
        pred_customresnet=log_data.pred_customresnet,
        gradcam_resnet18=log_data.gradcam_resnet18,
        gradcam_resnet50=log_data.gradcam_resnet50,
        gradcam_customresnet=log_data.gradcam_customresnet,
        diagnose=log_data.diagnose,
        description=log_data.description
    )
    db.add(log_object)
    db.commit()
    db.refresh(log_object)
    return {
        "message": "result has been saved"
    }


@app.get("/profile", response_model=schemas.UserRead)
def get_profile(user = Depends(get_current_user), db: Session = Depends(get_db)):
    user_data = db.query(User).filter(User.id == user["user_id"]).first()
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    return user_data


@app.get("/doctor/get_users", response_model=list[schemas.UserRead])
def get_users_for_doctor(_=Depends(doctor_required), db: Session = Depends(get_db)):
    users = db.query(User).filter(User.role == "user").all()
    return users


@app.get("/admin/get_users", response_model=list[schemas.UserRead])
def get_users_for_admin(_=Depends(admin_required), db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users