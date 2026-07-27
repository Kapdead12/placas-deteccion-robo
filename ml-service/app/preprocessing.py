import cv2
import numpy as np


def preprocess_for_ocr(crop_bgr: np.ndarray) -> np.ndarray:
    """
    Preprocesamiento del recorte de la placa antes de pasarlo a EasyOCR.

    Documentado en 02_preprocessing.ipynb (punto 4 del PDF - Ingeniería de Características):
      1. Escala de grises
      2. Umbralización adaptativa (mejora el contraste del texto sobre el fondo,
         más robusta que un threshold fijo ante distintas condiciones de luz)
      3. Corrección de inclinación (deskew) simple, si el recorte viene rotado
    """
    gray = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2GRAY)

    thresh = cv2.adaptiveThreshold(
        gray,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=31,
        C=15,
    )

    return _deskew(thresh)


def _deskew(image: np.ndarray) -> np.ndarray:
    """Corrige una leve inclinación de la placa usando los píxeles de texto detectados."""
    # np.where(image < 255) devuelve (fila, columna) = (y, x), pero
    # cv2.minAreaRect espera puntos (x, y). Sin el [::-1] el ángulo salía
    # calculado sobre coordenadas transpuestas (rotación de ~90° de más).
    coords = np.column_stack(np.where(image < 255)[::-1])
    if coords.shape[0] < 10:
        return image  # muy pocos píxeles de texto, no vale la pena corregir

    (_, (w, h), angle) = cv2.minAreaRect(coords)

    # Desde OpenCV 4.5, minAreaRect devuelve el ángulo en [0, 90) y puede
    # asignar el lado más largo del rectángulo indistintamente a "w" o "h".
    # La lógica clásica (pensada para OpenCV viejo, ángulos en (-90, 0])
    # asume que el lado ancho es "w" — si quedó invertido, corrige con un
    # texto horizontal real (sin inclinación) terminaba "corrigiendo" con
    # una rotación de ~90°. Normalizamos: si el lado corto quedó como "w",
    # el ángulo real está desfasado 90°.
    if w < h:
        angle -= 90

    # Ahora angle queda en (-90, 0]; nos quedamos con la corrección mínima
    if angle < -45:
        angle += 90

    # Inclinación mínima: no rotar (evita introducir ruido)
    if abs(angle) < 1.0:
        return image

    (h, w) = image.shape[:2]
    center = (w // 2, h // 2)
    rot_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(
        image, rot_matrix, (w, h),
        flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE,
    )
    return rotated
