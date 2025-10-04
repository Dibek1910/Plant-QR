import qrcode
import os

# Folder to save QR codes
os.makedirs('qrcodes', exist_ok=True)

# List of plant IDs
plant_ids = [
    "PLANT001",
    "PLANT002",
    "PLANT003",
    "PLANT004",
    "PLANT005",
    "PLANT006",
    "PLANT007",
    "PLANT008",
    "PLANT009"
]

# Replace this with your deployed Angular URL
base_url = "http://192.168.1.33:4200/"

for pid in plant_ids:
    url = f"{base_url}{pid}"
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    img.save(f"qrcodes/{pid}.png")
    print(f"Generated QR code for {pid}")
