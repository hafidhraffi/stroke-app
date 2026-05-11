import torch
import numpy as np
import cv2
import torchvision.transforms as transforms
import torch.nn as nn
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
from pytorch_grad_cam.utils.image import show_cam_on_image
import torch.nn.functional as F
import base64

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def accuracy(outputs, labels):
    _, preds = torch.max(outputs, dim=1)
    return torch.tensor(torch.sum(preds == labels).item() / len(preds))

def ConvBlock(in_channels, out_channels, pool=False):
    layers = [nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1),
             nn.BatchNorm2d(out_channels),
             nn.ReLU(inplace=True)]
    if pool:
        layers.append(nn.MaxPool2d(4))
    return nn.Sequential(*layers)

def to_device(data, device):
    """Move tensor(s) to chosen device"""
    if isinstance(data, (list,tuple)):
        return [to_device(x, device) for x in data]
    return data.to(device, non_blocking=True)

class ImageClassificationBase(nn.Module):
    
    def training_step(self, batch):
        images, labels = batch 
        #images, labels = images.to(DEVICE), labels.to(DEVICE) # move to GPU
        out = self(images)                  # Generate predictions
        loss = F.cross_entropy(out, labels) # Calculate loss
        return loss
    
    def validation_step(self, batch):
        images, labels = batch 
        #images, labels = images.to(DEVICE), labels.to(DEVICE) # move to GPU
        out = self(images)                    # Generate predictions
        loss = F.cross_entropy(out, labels)   # Calculate loss
        acc = accuracy(out, labels)           # Calculate accuracy
        return {'val_loss': loss.detach(), 'val_acc': acc}
        
    def validation_epoch_end(self, outputs):
        batch_losses = [x['val_loss'] for x in outputs]
        epoch_loss = torch.stack(batch_losses).mean()   # Combine losses
        batch_accs = [x['val_acc'] for x in outputs]
        epoch_acc = torch.stack(batch_accs).mean()      # Combine accuracies
        return {'val_loss': epoch_loss.item(), 'val_acc': epoch_acc.item()}
    
    def epoch_end(self, epoch, result):
        print("Epoch [{}], train_loss: {:.4f}, val_loss: {:.4f}, val_acc: {:.4f}".format(
            epoch, result['train_loss'], result['val_loss'], result['val_acc']))

class CNN_NeuralNet(ImageClassificationBase):
    def __init__(self, in_channels, num_diseases):
        super().__init__()
        
        self.conv1 = ConvBlock(in_channels, 64)
        self.conv2 = ConvBlock(64, 128, pool=True) 
        self.res1 = nn.Sequential(ConvBlock(128, 128), ConvBlock(128, 128))
        
        self.conv3 = ConvBlock(128, 256, pool=True)
        self.res2 = nn.Sequential(ConvBlock(256, 256), ConvBlock(256, 256))
        
        self.conv4 = ConvBlock(256, 512, pool=True)
        #self.conv5 = ConvBlock(256, 256, pool=True)
        #self.conv6 = ConvBlock(256, 512, pool=True)
        #self.conv7 = ConvBlock(512, 512, pool=True)
        
        self.res3 = nn.Sequential(ConvBlock(512, 512), ConvBlock(512, 512))

        # self.classifier = nn.Sequential(nn.MaxPool2d(4),
        #                                nn.Flatten(),
        #                                nn.Linear(512, num_diseases))
        
        self.classifier = nn.Sequential(
                nn.AdaptiveAvgPool2d((1, 1)),  # Safe replacement
                nn.Flatten(),
                nn.Linear(512, num_diseases)
        )
        
    def forward(self, x): # x is the loaded batch
        out = self.conv1(x)
        out = self.conv2(out)
        out = self.res1(out) + out
        out = self.conv3(out)
        out = self.res2(out) + out
        out = self.conv4(out)
        #out = self.conv5(out)
        #out = self.conv6(out)
        #out = self.conv7(out)
        out = self.res3(out) + out
        out = self.classifier(out)
        
        return out

class_names = ["Normal", "Bleeding", "Ischemia"]
customresnetmodel = to_device(CNN_NeuralNet(3, 3), device)
customresnetmodel.load_state_dict(torch.load('customresnet.pth'))
customresnetmodel.eval()
customresnetmodel.to(device)
target_layers = [customresnetmodel.res3[1][0]]

transform = transforms.Compose([
    transforms.Resize((384, 384)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

def customresnetPredict(img):
    tensor = transform(img).unsqueeze(0).to(device)
    with torch.no_grad():
        output = customresnetmodel(tensor)
        probs = F.softmax(output, dim=1)
        pred_idx = probs.argmax(dim=1).item()
        conf = probs[0, pred_idx].item()
    heatmap_base64 = customresnetGradcam(img, tensor, pred_idx)
    return class_names[pred_idx], conf, heatmap_base64

def customresnetGradcam(img, tensor, pred_idx):
    with GradCAM(model=customresnetmodel, target_layers=target_layers) as cam:
        rgb_img = np.array(img.resize((384, 384))) / 255.0
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