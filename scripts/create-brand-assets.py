"""Render original DayBalance vector geometry into Expo launcher assets."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "brand"
OUT.mkdir(parents=True, exist_ok=True)
SCALE = 4
SIZE = 1024
BACKGROUND = "#95532F"
CREAM = "#FAEFE1"

def artwork(color):
    image = Image.new("RGBA", (SIZE * SCALE, SIZE * SCALE))
    draw = ImageDraw.Draw(image)
    def box(values): return tuple(round(v * SCALE) for v in values)
    draw.pieslice(box((352, 246, 672, 566)), 180, 360, fill=color)
    draw.rounded_rectangle(box((286, 438, 738, 474)), radius=18 * SCALE, fill=color)
    points = [(402, 562), (486, 642), (638, 550)]
    draw.line([box(p) for p in points], fill=color, width=46 * SCALE, joint="curve")
    for x, y in points:
        draw.ellipse(box((x - 23, y - 23, x + 23, y + 23)), fill=color)
    return image.resize((SIZE, SIZE), Image.Resampling.LANCZOS)

foreground = artwork(CREAM)
foreground.save(OUT / "adaptive-foreground.png")
artwork("white").save(OUT / "adaptive-monochrome.png")
icon = Image.new("RGBA", (SIZE, SIZE), BACKGROUND)
icon.alpha_composite(foreground)
icon.convert("RGB").save(OUT / "icon.png")
icon.convert("RGB").resize((64, 64), Image.Resampling.LANCZOS).save(OUT / "favicon.png")
svg = '''<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
<rect width="1024" height="1024" fill="#95532F"/>
<path d="M352 406 A160 160 0 0 1 672 406 Z" fill="#FAEFE1"/>
<path d="M304 456 H720" fill="none" stroke="#FAEFE1" stroke-width="36" stroke-linecap="round"/>
<path d="M402 562 L486 642 L638 550" fill="none" stroke="#FAEFE1" stroke-width="46" stroke-linecap="round" stroke-linejoin="round"/>
</svg>'''
(OUT / "logo.svg").write_text(svg, encoding="utf-8")
for name in ["icon.png", "adaptive-foreground.png", "adaptive-monochrome.png", "favicon.png"]:
    with Image.open(OUT / name) as check:
        check.verify()
print("Created and verified DayBalance launcher assets")
