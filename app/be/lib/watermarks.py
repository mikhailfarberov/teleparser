import cv2
import numpy as np
import os

_DILATE_KERNEL = np.array([[0, 0, 1, 0, 0],
                           [0, 0, 1, 0, 0],
                           [1, 1, 1, 1, 1],
                           [0, 0, 1, 0, 0],
                           [0, 0, 1, 0, 0]], dtype=np.uint8)

def wm_image_scale(path, orientation, height, width):
    if os.path.isfile(path + '.origin'):
        return False
    img = cv2.imread(path)
    (h, w, c) = img.shape
    # ориентация по центру не поддерживается
    result_image = None
    if orientation == 'center':
        return False
    if height > width:
        new_width = w - width
        new_height = int(height * (new_width / width))
    else:
        new_height = h - height
        new_width = int(width * (new_height / height))
    if orientation == 'top-left' or orientation == 'top-right':
        (x1,x2,y1,y2) = (int((w - new_width)/2), int((w+new_width)/2), h, (h+new_height))
    elif orientation == 'bottom-left' or orientation == 'bottom-right':
        (x1,x2,y1,y2) = (int((w - new_width)/2), int((w+new_width)/2), 0, new_height)
    
    result_image = img[y1:y2, x1:x2]
    if result_image is not None:
        os.rename(path, path + '.origin')
        cv2.imwrite(path, result_image)
        return True
    else:
        return False
    
def wm_image_cut(path, orientation, height, width):
    if os.path.isfile(path + '.origin'):
        return False
    img = cv2.imread(path)
    (h, w, c) = img.shape
    # ориентация по центру не поддерживается
    if orientation == 'center':
        return False
    result_image = None
    if height > width:
        if orientation == 'top-left' or orientation == 'bottom-left':
            result_image = img[0:h, width:w]
        elif orientation == 'top-right' or orientation == 'bottom-right':
            result_image = img[0:h, 0:(w-width)]
    else:
        if orientation == 'top-left' or orientation == 'top-right':
            result_image = img[height:h, 0:w]
        elif orientation == 'bottom-left' or orientation == 'bottom-right':
            result_image = img[0:(h-height), 0:w]
    if result_image is not None:
        os.rename(path, path + '.origin')
        cv2.imwrite(path, result_image)
        return True
    else:
        return False

def wm_image_inpaint(path, orientation, height, width):
    if os.path.isfile(path + '.origin'):
        return False
    img = cv2.imread(path)
    (h, w, c) = img.shape
    mask = np.zeros(img.shape, np.uint8)
    if orientation == 'center':
        mask[int(h/2 - height/2):int(h/2 + height/2), int(w/2 - width/2):int(w/2 + width/2)] = img[int(h/2 - height/2):int(h/2 + height/2), int(w/2 - width/2):int(w/2 + width/2)]
    elif orientation == 'top-left':
        mask[0:height, 0:width] = img[0:height, 0:width]
    elif orientation == 'bottom-left':
        mask[(h-height):height, 0:width] = img[(h-height):height, 0:width]
    elif orientation == 'top-right':
        mask[0:height, (w-width):width] = img[0:height, (w-width):width]
    elif orientation == 'bottom-right':
        mask[(h-height):height, (w-width):width] = img[(h-height):height, (w-width):width]
    else:
        return False
    
    gray = cv2.cvtColor(mask, cv2.COLOR_BGR2GRAY)
    _, mask = cv2.threshold(gray, 0, 255, cv2.THRESH_TOZERO + cv2.THRESH_OTSU)
    _, mask = cv2.threshold(mask, 127, 255, cv2.THRESH_BINARY)
    mask = cv2.dilate(mask, _DILATE_KERNEL)
    result_image = cv2.inpaint(img, mask, 20, cv2.INPAINT_TELEA)
    
    os.rename(path, path + '.origin')
    cv2.imwrite(path, result_image)
    return True
