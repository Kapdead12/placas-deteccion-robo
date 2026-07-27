"""
Prueba /detect del ml-service contra TODO el test set real (data/processed/images/test).

Uso:
    1. Levantar el servicio: uvicorn app.main:app --reload  (desde ml-service/, con el venv activo)
    2. En otra terminal, con el mismo venv activo:
         pip install requests   (si no lo tenés ya)
         python test_detect_batch.py

IMPORTANTE — qué mide y qué NO mide este script:
El dataset (data/raw/annotations/*.xml y data/processed/labels/*) solo tiene
bounding boxes de la placa (formato Pascal VOC / YOLO), no el texto real de
cada placa. Sin ese ground truth no hay forma de calcular precisión de OCR
("¿leyó ABC123 correctamente?") de forma automática.

Lo que este script SÍ puede medir es la TASA DE LECTURA (yield): de cuántas
imágenes el pipeline produjo un bbox y/o un texto con formato válido de
placa. Eso NO es accuracy — un texto con formato válido puede seguir siendo
una lectura incorrecta (ej. leyó "ABC123" cuando la placa real dice
"ABD128"). Para reportar precisión real hay que:
  1. Tomar una muestra (ver `placas_leidas.csv` que este script genera),
  2. Comparar a mano cada `placa_leida` contra la imagen original,
  3. Calcular el % de coincidencias correctas sobre esa muestra.
"""

import csv
import sys
from pathlib import Path

import requests

ML_SERVICE_URL = "http://localhost:8000"
TEST_DIR = Path(r"C:\KAPA-2025\VIco\Placas-Deteccion-Robo\ml-service\data\processed\images\test")
SALIDA_CSV = Path(__file__).parent / "placas_leidas.csv"


def main() -> None:
    if not TEST_DIR.exists():
        print(f"No se encontró el directorio: {TEST_DIR}")
        sys.exit(1)

    imagenes = sorted(TEST_DIR.glob("*.png"))
    if not imagenes:
        print("No se encontraron imágenes .png en el test set.")
        sys.exit(1)

    total = len(imagenes)
    con_bbox = 0
    con_texto_formato_valido = 0
    confs_deteccion = []
    confs_ocr = []
    tiempos_ms = []
    fallidas = []
    lecturas = []  # para el CSV de verificación manual

    print(f"Probando {total} imágenes contra {ML_SERVICE_URL}/detect ...\n")

    for i, img_path in enumerate(imagenes, start=1):
        try:
            with open(img_path, "rb") as f:
                resp = requests.post(
                    f"{ML_SERVICE_URL}/detect",
                    files={"file": (img_path.name, f, "image/png")},
                    timeout=30,
                )
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            fallidas.append((img_path.name, str(e)))
            print(f"[{i}/{total}] {img_path.name}: ERROR -> {e}")
            continue

        tiempos_ms.append(data["tiempo_procesamiento_ms"])

        if data["placa"] is not None:
            con_bbox += 1
            confs_deteccion.append(data["confianza_deteccion"])
            con_texto_formato_valido += 1
            confs_ocr.append(data["confianza_ocr"])
            lecturas.append((img_path.name, data["placa"], data["confianza_ocr"]))
            print(
                f"[{i}/{total}] {img_path.name}: placa_leida='{data['placa']}' "
                f"conf_det={data['confianza_deteccion']:.3f} conf_ocr={data['confianza_ocr']:.3f} "
                "(formato válido, NO verificado contra la placa real)"
            )
        elif data["bbox"] is not None:
            # Se detectó el bbox pero no se pudo leer texto con formato válido
            con_bbox += 1
            confs_deteccion.append(data["confianza_deteccion"])
            print(f"[{i}/{total}] {img_path.name}: bbox detectado pero SIN texto de formato válido")
        else:
            print(f"[{i}/{total}] {img_path.name}: SIN detección")

    if lecturas:
        with open(SALIDA_CSV, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["imagen", "placa_leida", "confianza_ocr"])
            writer.writerows(lecturas)

    print("\n" + "=" * 60)
    print("RESUMEN")
    print("=" * 60)
    print(
        "ADVERTENCIA: estas cifras son TASA DE LECTURA (yield), no accuracy.\n"
        "El dataset no tiene ground truth de texto de placa (solo bboxes), así\n"
        "que no se puede validar automáticamente si cada lectura es correcta.\n"
        f"Revisar manualmente una muestra de '{SALIDA_CSV.name}' para estimar precisión real.\n"
    )
    print(f"Total imágenes probadas:               {total}")
    print(f"Con bbox detectado:                     {con_bbox} ({100*con_bbox/total:.1f}%)")
    print(
        f"Con texto de formato válido de placa:   {con_texto_formato_valido} "
        f"({100*con_texto_formato_valido/total:.1f}%) — formato valido no es lo mismo que lectura correcta"
    )
    if confs_deteccion:
        print(f"Confianza detección promedio:           {sum(confs_deteccion)/len(confs_deteccion):.3f}")
        print(f"Confianza detección mínima:             {min(confs_deteccion):.3f}")
    if confs_ocr:
        print(f"Confianza OCR promedio:                 {sum(confs_ocr)/len(confs_ocr):.3f}")
    if tiempos_ms:
        print(f"Tiempo promedio (ms):                   {sum(tiempos_ms)/len(tiempos_ms):.1f}")
    if fallidas:
        print(f"\nImágenes con error de conexión/procesamiento: {len(fallidas)}")
        for nombre, err in fallidas:
            print(f"  - {nombre}: {err}")
    if lecturas:
        print(f"\nLecturas exportadas para verificación manual en: {SALIDA_CSV}")


if __name__ == "__main__":
    main()
