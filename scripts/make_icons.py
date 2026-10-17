"""Generate Royal Ace PWA icons: gold spade on dark green felt."""

from PIL import Image, ImageDraw, ImageFilter

GOLD = (215, 180, 91)
GOLD_LIGHT = (229, 199, 121)
FELT = (11, 16, 14)
FELT_EDGE = (13, 20, 17)

BASE = 1024


def rounded(draw, box, radius, fill, width):
    draw.rounded_rectangle(box, radius=radius, fill=fill, width=width)


def spade_mask(size):
    """Build a spade silhouette as an alpha mask, centered in size×size."""
    m = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(m)
    cx = size / 2
    h = size * 0.72  # spade height
    top = (size - h) / 2
    # main triangle: pointed top, wide base
    d.polygon(
        [(cx, top), (cx - h * 0.34, top + h * 0.62), (cx + h * 0.34, top + h * 0.62)],
        fill=255,
    )
    # two rounded lobes at the bottom
    r = h * 0.185
    for sx in (-1, 1):
        d.ellipse(
            [cx + sx * h * 0.165 - r, top + h * 0.60 - r, cx + sx * h * 0.165 + r, top + h * 0.60 + r],
            fill=255,
        )
    # stem
    d.polygon(
        [
            (cx - h * 0.055, top + h * 0.55),
            (cx + h * 0.055, top + h * 0.55),
            (cx + h * 0.10, top + h * 0.88),
            (cx - h * 0.10, top + h * 0.88),
        ],
        fill=255,
    )
    return m


def make_icon(rounded_border: bool) -> Image.Image:
    img = Image.new("RGBA", (BASE, BASE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    if rounded_border:
        # app icon with its own rounded corners + gold double border
        d.rounded_rectangle([8, 8, BASE - 8, BASE - 8], radius=BASE * 0.22, fill=FELT)
        d.rounded_rectangle(
            [44, 44, BASE - 44, BASE - 44],
            radius=BASE * 0.19,
            outline=GOLD,
            width=10,
        )
        d.rounded_rectangle(
            [70, 70, BASE - 70, BASE - 70],
            radius=BASE * 0.165,
            outline=(215, 180, 91, 90),
            width=4,
        )
    else:
        # full-bleed (apple-touch-icon): iOS applies its own mask
        d.rectangle([0, 0, BASE, BASE], fill=FELT)

    # spade with a soft gold body + lighter top-left sheen
    body = Image.new("RGBA", (BASE, BASE), (0, 0, 0, 0))
    mask = spade_mask(BASE)
    gold = Image.new("RGBA", (BASE, BASE), GOLD + (255,))
    body.paste(gold, (0, 0), mask)

    sheen = Image.new("L", (BASE, BASE), 0)
    sd = ImageDraw.Draw(sheen)
    sd.ellipse([-BASE * 0.35, -BASE * 0.55, BASE * 0.72, BASE * 0.45], fill=110)
    sheen = sheen.filter(ImageFilter.GaussianBlur(60))
    light = Image.new("RGBA", (BASE, BASE), GOLD_LIGHT + (255,))
    body.paste(light, (0, 0), Image.composite(sheen, Image.new("L", (BASE, BASE), 0), mask))

    img.alpha_composite(body)

    # letter "A" cut out inside the spade, dark felt color
    a = ImageDraw.Draw(img)
    cx = BASE / 2
    h = BASE * 0.72
    top = (BASE - h) / 2
    ay = top + h * 0.42
    w = h * 0.10
    lw = max(6, int(w * 0.40))
    a.line([(cx, ay - w * 1.5), (cx - w * 1.15, ay + w * 1.3)], fill=FELT_EDGE, width=lw)
    a.line([(cx, ay - w * 1.5), (cx + w * 1.15, ay + w * 1.3)], fill=FELT_EDGE, width=lw)
    a.ellipse([cx - lw / 2, ay - w * 1.5 - lw / 2, cx + lw / 2, ay - w * 1.5 + lw / 2], fill=FELT_EDGE)
    a.line([(cx - w * 0.62, ay + w * 0.35), (cx + w * 0.62, ay + w * 0.35)], fill=FELT_EDGE, width=lw)
    return img


def make_maskable(size: int) -> Image.Image:
    """Full-bleed opaque icon: content stays inside the maskable safe zone."""
    img = Image.new("RGBA", (size, size), FELT)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, size, size], fill=FELT)
    mask = spade_mask(size)
    # shrink the spade into the central ~55% safe zone
    inner = size * 0.55
    small = spade_mask(int(inner))
    small = small.resize((int(inner), int(inner)), Image.LANCZOS)
    full_mask = Image.new("L", (size, size), 0)
    off = int((size - inner) / 2)
    full_mask.paste(small, (off, off))
    full = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gold = Image.new("RGBA", (size, size), GOLD + (255,))
    full.paste(gold, (0, 0), full_mask)
    img.alpha_composite(full)
    del mask, d
    return img


def main():
    app = make_icon(rounded_border=True)
    for size, name in [(512, "icon-512.png"), (192, "icon-192.png")]:
        app.resize((size, size), Image.LANCZOS).save(f"public/{name}")
    full = make_icon(rounded_border=False)
    full.resize((180, 180), Image.LANCZOS).save("public/apple-touch-icon.png")
    make_maskable(512).save("public/icon-maskable-512.png")
    print("icons written")


if __name__ == "__main__":
    main()
