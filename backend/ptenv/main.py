from fastapi import FastAPI, File, UploadFile
from PIL import Image
from io import BytesIO
import resnet18
import customresnet

app = FastAPI()

class_names = ["Normal", "Bleeding", "Ischemia"]

@app.post("/predict")
async def predict(
    ct_img: UploadFile = File(...)
):
    ct_img_bytes = await ct_img.read()
    ct_img_pil = Image.open(BytesIO(ct_img_bytes)).convert("RGB")
    pred_resnet18, confidence_resnet18, gradcam_resnet18 = resnet18.resnet18Predict(ct_img_pil)
    pred_customresnet, confidence_customresnet, gradcam_customresnet = customresnet.customresnetPredict(ct_img_pil)
    return {
        "pred_resnet18": pred_resnet18,
        "confidence_resnet18": confidence_resnet18,
        "gradcam_resnet18": gradcam_resnet18,
        "pred_customresnet": pred_customresnet,
        "confidence_customresnet": confidence_customresnet,
        "gradcam_customresnet": gradcam_customresnet,
    }