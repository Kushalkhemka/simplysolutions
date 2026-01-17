#!/usr/bin/env python3
"""Script to remove background from category icons."""

from rembg import remove
from PIL import Image
import os

# Icons to process
icons_dir = "/Users/kushalkhemka/Desktop/ECOM/simplysolutions/public/assets/icons"
icons = ["windows.png", "office.png", "antivirus.png", "design.png", "utilities.png", "games.png"]

for icon_name in icons:
    icon_path = os.path.join(icons_dir, icon_name)
    if os.path.exists(icon_path):
        print(f"Processing {icon_name}...")
        
        # Open image
        input_image = Image.open(icon_path)
        
        # Remove background
        output_image = remove(input_image)
        
        # Save as PNG with transparency
        output_image.save(icon_path, "PNG")
        print(f"  ✓ Saved {icon_name} with transparent background")
    else:
        print(f"  ✗ {icon_name} not found")

print("\nDone! All icons now have transparent backgrounds.")
