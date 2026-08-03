from PIL import Image, ImageOps
import numpy as np

# Abrir imagen original
img = Image.open('/var/folders/tz/9khj7fhn71v1bffl0kx70n7c0000gn/T/kimi-desktop-attachments/1785786643850-11-image.png').convert('RGBA')

# Crear fondo blanco
white_bg = Image.new('RGBA', img.size, (255, 255, 255, 255))

# Componer
composite = Image.alpha_composite(white_bg, img)

# Convertir a numpy array para procesamiento
data = np.array(composite)
r, g, b, a = data.T

# Detectar el fondo azul oscuro (aproximadamente rgb(15, 23, 42) o similar)
# y convertirlo a blanco
blue_background = (r < 50) & (g < 50) & (b > 20) & (b < 80)
data[..., 0][blue_background.T] = 255  # R = 255
data[..., 1][blue_background.T] = 255  # G = 255
data[..., 2][blue_background.T] = 255  # B = 255

# Para el texto blanco, invertir a oscuro
# Detectar píxeles blancos o muy claros
white_text = (r > 200) & (g > 200) & (b > 200)
data[..., 0][white_text.T] = 30   # R = 30 (oscuro)
data[..., 1][white_text.T] = 41   # G = 41 (oscuro)
data[..., 2][white_text.T] = 59   # B = 59 (oscuro)

# Guardar resultado
result = Image.fromarray(data)

# Redimensionar para PDF
pdf_width = 280
ratio = pdf_width / result.width
pdf_size = (pdf_width, int(result.height * ratio))
result = result.resize(pdf_size, Image.LANCZOS)

result.save('public/logo-velso-pdf.png', 'PNG')
print(f'PDF logo creado: {result.size}')
