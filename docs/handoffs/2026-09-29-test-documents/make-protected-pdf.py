"""Makes a PDF that needs a password to open (30 Sep 2026), using only the standard library.

    python make-protected-pdf.py out.pdf

The user password is "secret". It is the PDF standard security handler, revision 2 (RC4, 40-bit):
old, but every reader supports it and it is the smallest thing that makes pdf.js raise its
PasswordException, which is what the on-device reader turns into "this PDF is protected". A file
with an empty user password would open without asking, so this one has a real one.
"""

import hashlib
import sys

PAD = bytes.fromhex(
    "28BF4E5E4E758A4164004E56FFFA01082E2E00B6D0683E802F0CA9FE6453697A"
)


def rc4(key: bytes, data: bytes) -> bytes:
    s = list(range(256))
    j = 0
    for i in range(256):
        j = (j + s[i] + key[i % len(key)]) % 256
        s[i], s[j] = s[j], s[i]
    out = bytearray()
    i = j = 0
    for byte in data:
        i = (i + 1) % 256
        j = (j + s[i]) % 256
        s[i], s[j] = s[j], s[i]
        out.append(byte ^ s[(s[i] + s[j]) % 256])
    return bytes(out)


def padded(password: str) -> bytes:
    return (password.encode("latin-1") + PAD)[:32]


user_pw, owner_pw = "secret", "owner-secret"
permissions = -4  # everything allowed once opened
file_id = hashlib.md5(b"appealdeck test document").digest()

# Algorithm 3: the owner entry.
owner_entry = rc4(hashlib.md5(padded(owner_pw)).digest()[:5], padded(user_pw))
# Algorithm 2: the file key, from the user password.
file_key = hashlib.md5(
    padded(user_pw) + owner_entry + (permissions & 0xFFFFFFFF).to_bytes(4, "little") + file_id
).digest()[:5]
# Algorithm 4: the user entry (revision 2).
user_entry = rc4(file_key, PAD)


def object_key(number: int) -> bytes:
    material = file_key + number.to_bytes(3, "little") + (0).to_bytes(2, "little")
    return hashlib.md5(material).digest()[: min(len(file_key) + 5, 16)]


page_text = b"BT /F1 14 Tf 72 720 Td (TEST DOCUMENT - NOT VALID. Protected invoice.) Tj ET"
contents = rc4(object_key(4), page_text)

objects = {
    1: b"<< /Type /Catalog /Pages 2 0 R >>",
    2: b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    3: b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R "
    b"/Resources << /Font << /F1 5 0 R >> >> >>",
    4: b"<< /Length " + str(len(contents)).encode() + b" >>\nstream\n" + contents + b"\nendstream",
    5: b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    6: b"<< /Filter /Standard /V 1 /R 2 /O <"
    + owner_entry.hex().encode()
    + b"> /U <"
    + user_entry.hex().encode()
    + b"> /P "
    + str(permissions).encode()
    + b" >>",
}

out = bytearray(b"%PDF-1.4\n")
offsets = {}
for number, body in objects.items():
    offsets[number] = len(out)
    out += f"{number} 0 obj\n".encode() + body + b"\nendobj\n"
xref_at = len(out)
out += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode()
for number in sorted(offsets):
    out += f"{offsets[number]:010d} 00000 n \n".encode()
hex_id = file_id.hex().encode()
out += (
    b"trailer\n<< /Size "
    + str(len(objects) + 1).encode()
    + b" /Root 1 0 R /Encrypt 6 0 R /ID [<"
    + hex_id
    + b"> <"
    + hex_id
    + b">] >>\nstartxref\n"
    + str(xref_at).encode()
    + b"\n%%EOF\n"
)

with open(sys.argv[1], "wb") as handle:
    handle.write(out)
