import numpy as np
import cv2
import base64
import tensorflow as tf

def overlay_heatmap(img, heatmap):
    img = np.clip(img, 0, 255).astype(np.uint8)
    heatmap = cv2.resize(heatmap, (img.shape[1], img.shape[0]))
    heatmap = np.uint8(255 * heatmap)
    heatmap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)
    heatmap = cv2.addWeighted(img, 1 - 0.5, heatmap, 0.5, 0)
    _, encoded_heatmap = cv2.imencode(".png", heatmap)
    heatmap_bytes = encoded_heatmap.tobytes()
    heatmap_base64 = base64.b64encode(heatmap_bytes).decode("utf-8")
    return heatmap_base64

def produce_heatmap(model, preprocessed_ct_img_array, predicted_class_index, ct_img_array):
    gradcam_array = gradcam(model, preprocessed_ct_img_array, predicted_class_index)
    gradcam_img = overlay_heatmap(ct_img_array, gradcam_array)
    return gradcam_img

def gradcam(model, img, class_idx):
    last_conv_layer_name = "conv5_block3_out"
    grad_model = tf.keras.Model(
        inputs=model.input,
        outputs=[model.get_layer(last_conv_layer_name).output, model.output]
    )
    with tf.GradientTape() as tape:
        conv_outputs, predictions = grad_model(img)
        class_channel = predictions[:, class_idx]
    grads = tape.gradient(class_channel, conv_outputs)
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
    conv_outputs = conv_outputs[0].numpy()
    pooled_grads = pooled_grads.numpy()
    for i in range(pooled_grads.shape[0]):
        conv_outputs[:, :, i] *= pooled_grads[i]
    heatmap = np.sum(conv_outputs, axis=-1)
    heatmap = np.maximum(heatmap, 0)
    if heatmap.max() > 0:
        heatmap = heatmap / heatmap.max()
    return heatmap