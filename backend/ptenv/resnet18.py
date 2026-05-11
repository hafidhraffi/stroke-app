import torchvision.transforms as transforms
import torchvision.models as models
import torch.nn.functional as F
import torch.nn as nn
import torch
import numpy as np
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
from pytorch_grad_cam.utils.image import show_cam_on_image
import cv2
import base64

class_names = ["Normal", "Bleeding", "Ischemia"]
resnet18model = models.resnet18(pretrained=True)
num_features = resnet18model.fc.in_features
resnet18model.fc = nn.Linear(num_features, 3)
device = "cuda" if torch.cuda.is_available() else "cpu"
resnet18model.load_state_dict(torch.load('resnet18.pth', map_location=device))
resnet18model.eval()
resnet18model.to(device)
target_layers = [resnet18model.layer4[1].conv2]

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

def resnet18Predict(img):
    tensor = transform(img).unsqueeze(0).to(device)
    with torch.no_grad():
        output = resnet18model(tensor)
        probs = F.softmax(output, dim=1)
        pred_idx = probs.argmax(dim=1).item()
        conf = probs[0, pred_idx].item()
    heatmap_base64 = resnet18Gradcam(img, tensor, pred_idx)
    return class_names[pred_idx], conf, heatmap_base64

def resnet18Gradcam(img, tensor, pred_idx):
    with GradCAM(model=resnet18model, target_layers=target_layers) as cam:
        rgb_img = np.array(img.resize((224, 224))) / 255.0
        targets = [ClassifierOutputTarget(pred_idx)]
        grayscale_cam = cam(input_tensor=tensor, targets=targets)[0]
        visualization = show_cam_on_image(rgb_img, grayscale_cam, use_rgb=True)
    
    if visualization.dtype != np.uint8:
        visualization = (visualization * 255).astype("uint8")
    
    visualization = cv2.cvtColor(visualization, cv2.COLOR_RGB2BGR)
    _, encoded_heatmap = cv2.imencode(".png", visualization)
    heatmap_bytes = encoded_heatmap.tobytes()
    heatmap_base64 = base64.b64encode(heatmap_bytes).decode("utf-8")
    return heatmap_base64