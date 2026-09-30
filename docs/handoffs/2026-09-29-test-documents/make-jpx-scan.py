"""Makes a PDF that is only a JPEG 2000 picture of a page, with no text layer (30 Sep 2026).

    python make-jpx-scan.py page.png out.pdf

Acrobat's "ClearScan" and many scanners' "compact PDF" store a page as JPEG 2000 or JBIG2, which
pdf.js can only draw with its wasm decoders. generate.cjs calls this after it has drawn the page;
it needs Pillow with JPEG 2000 support and is skipped, with a message, when that is missing.
"""

import io
import sys

from PIL import Image

png_path, out_path = sys.argv[1], sys.argv[2]
image = Image.open(png_path).convert("RGB")
width, height = image.size

jpx = io.BytesIO()
image.save(jpx, format="JPEG2000", quality_mode="rates", quality_layers=[25])
jpx_bytes = jpx.getvalue()

# A4 in points; the picture fills the page.
page_w, page_h = 595, 842
content = f"q {page_w} 0 0 {page_h} 0 0 cm /Im0 Do Q".encode("ascii")

objects = [
    b"<< /Type /Catalog /Pages 2 0 R >>",
    b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    (
        f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {page_w} {page_h}] "
        "/Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>"
    ).encode("ascii"),
    b"<< /Length " + str(len(content)).encode("ascii") + b" >>\nstream\n" + content + b"\nendstream",
    (
        f"<< /Type /XObject /Subtype /Image /Width {width} /Height {height} "
        f"/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /JPXDecode /Length {len(jpx_bytes)} >>\n"
    ).encode("ascii")
    + b"stream\n"
    + jpx_bytes
    + b"\nendstream",
]

out = bytearray(b"%PDF-1.5\n")
offsets = []
for number, body in enumerate(objects, start=1):
    offsets.append(len(out))
    out += f"{number} 0 obj\n".encode("ascii") + body + b"\nendobj\n"
xref_at = len(out)
out += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode("ascii")
for offset in offsets:
    out += f"{offset:010d} 00000 n \n".encode("ascii")
out += (
    f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_at}\n%%EOF\n"
).encode("ascii")

with open(out_path, "wb") as handle:
    handle.write(out)
