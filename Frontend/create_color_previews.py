import os
from PIL import Image, ImageDraw, ImageFont

def draw_theme_preview(filename, theme_name, primary_color, accent_color, bg_color="#0f172a", card_bg="#1e293b", text_color="#ffffff", subtitle="Tech & Electronics"):
    width, height = 900, 480
    img = Image.new("RGB", (width, height), bg_color)
    draw = ImageDraw.Draw(img)

    # Try loading system font, fallback to default
    try:
        font_title = ImageFont.truetype("arial.ttf", 32)
        font_header = ImageFont.truetype("arial.ttf", 22)
        font_sub = ImageFont.truetype("arial.ttf", 16)
        font_btn = ImageFont.truetype("arial.ttf", 18)
    except:
        font_title = font_header = font_sub = font_btn = ImageFont.load_default()

    # Navbar Container
    draw.rounded_rectangle([30, 25, width-30, 95], radius=16, fill=card_bg, outline="#334155", width=2)
    
    # Logo Box
    draw.rounded_rectangle([50, 40, 95, 80], radius=12, fill=primary_color)
    draw.text((110, 45), "Nova", fill="#ffffff", font=font_title)
    draw.text((190, 45), "Cart", fill=accent_color, font=font_title)

    # Cart Button in Navbar
    draw.rounded_rectangle([width-160, 40, width-50, 80], radius=12, fill=primary_color)
    draw.text((width-140, 50), "Cart (3)", fill="#ffffff", font=font_btn)

    # Main Card
    draw.rounded_rectangle([30, 120, width-30, height-30], radius=20, fill=card_bg, outline="#334155", width=2)

    # Theme Title
    draw.text((60, 150), f"NovaCart Theme: {theme_name}", fill="#ffffff", font=font_title)
    draw.text((60, 195), f"Category: {subtitle} Storefront", fill="#94a3b8", font=font_sub)

    # Product Card Mockup Inside
    draw.rounded_rectangle([60, 240, 360, 410], radius=16, fill="#0f172a", outline=primary_color, width=2)
    draw.text((80, 265), "MacBook Pro 16\" M3", fill="#ffffff", font=font_header)
    draw.text((80, 300), "$2,499.00 EGP", fill=accent_color, font=font_title)

    # Primary Action Button
    draw.rounded_rectangle([80, 345, 340, 395], radius=12, fill=primary_color)
    draw.text((140, 358), "Add To Cart", fill="#ffffff" if primary_color != "#f59e0b" else "#0f172a", font=font_btn)

    # Feature List
    draw.rounded_rectangle([390, 240, width-60, 410], radius=16, fill="#0f172a", outline="#334155", width=1)
    draw.text((410, 265), "Theme Color Characteristics:", fill="#ffffff", font=font_header)
    draw.text((410, 305), f"• Primary Accent: {primary_color}", fill=accent_color, font=font_sub)
    draw.text((410, 335), f"• Highlight Accent: {accent_color}", fill=accent_color, font=font_sub)
    draw.text((410, 365), "• Status Badges: Free Express Shipping & Taxes Included", fill="#34d399", font=font_sub)

    out_dir = r"C:\Users\zas\.gemini\antigravity\brain\86e482f2-4d63-46ea-ae2d-41273c595d4f"
    out_path = os.path.join(out_dir, filename)
    img.save(out_path, quality=95)
    print(f"Generated: {out_path}")

draw_theme_preview("preview_electric_indigo.jpg", "Electric Indigo / Violet", "#4f46e5", "#818cf8", subtitle="Tech & Electronics (Recommended)")
draw_theme_preview("preview_royal_blue.jpg", "Royal Ocean Blue", "#2563eb", "#60a5fa", subtitle="Modern Retail")
draw_theme_preview("preview_amber_gold.jpg", "Warm Obsidian Gold", "#f59e0b", "#fbbf24", subtitle="Luxury & High-End")
draw_theme_preview("preview_emerald_green.jpg", "Original Emerald Green", "#059669", "#34d399", subtitle="Grocery & Fresh Produce")
