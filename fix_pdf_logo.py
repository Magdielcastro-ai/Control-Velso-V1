from PIL import Image, ImageEnhance
import numpy as np

def process_for_pdf(img_path, output_path):
    """Crear versión para PDF con fondo blanco y texto visible"""
    img = Image.open(img_path).convert('RGBA')
    
    # Crear fondo blanco
    white_bg = Image.new('RGBA', img.size, (255, 255, 255, 255))
    
    # Componer imagen sobre fondo blanco
    result = Image.alpha_composite(white_bg, img)
    
    # Convertir a RGB (sin transparencia)
    result = result.convert('RGB')
    
    # Guardar
    result.save(output_path, 'PNG')
    return result

# Crear versión PDF con fondo blanco (para que el texto blanco sea visible)
print('Creando logo para PDF con fondo blanco...')
pdf_img = process_for_pdf(
    '/var/folders/tz/9khj7fhn71v1bffl0kx70n7c0000gn/T/kimi-desktop-attachments/1785786643850-11-image.png',
    'public/logo-velso-pdf.png'
)

# Redimensionar para PDF
pdf_width = 280
ratio = pdf_width / pdf_img.width
pdf_size = (pdf_width, int(pdf_img.height * ratio))
pdf_img = pdf_img.resize(pdf_size, Image.LANCZOS)
pdf_img.save('public/logo-velso-pdf.png', 'PNG')
print(f'PDF logo: {pdf_img.size}')

print('Logo PDF creado con fondo blanco')
