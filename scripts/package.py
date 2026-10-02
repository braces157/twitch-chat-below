"""Validate and package the extension using only Python's standard library."""

import json
from pathlib import Path
import struct
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parent.parent
manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8-sig"))
assert manifest["manifest_version"] == 3, "Manifest V3 is required"
files = {"manifest.json", "popup.html", "popup.css", "popup.js", "PRIVACY.md"}
files.add(manifest["action"]["default_popup"])
for script in manifest["content_scripts"]:
    files.update(script.get("js", []))
    files.update(script.get("css", []))
for icons in (manifest["icons"], manifest["action"]["default_icon"]):
    for size, filename in icons.items():
        image = (ROOT / filename).read_bytes()
        assert image[:8] == b"\x89PNG\r\n\x1a\n", f"Invalid PNG: {filename}"
        dimensions = struct.unpack(">II", image[16:24])
        assert dimensions == (int(size), int(size)), f"Wrong icon size: {filename}"
        files.add(filename)
for filename in sorted(files):
    path = (ROOT / filename).resolve()
    assert path.is_relative_to(ROOT) and path.is_file(), f"Missing or unsafe file: {filename}"
    if path.suffix == ".js":
        subprocess.run(["node", "--check", str(path)], check=True)

output = ROOT / "dist" / f"twitch-chat-below-v{manifest['version']}.zip"
output.parent.mkdir(exist_ok=True)
with ZipFile(output, "w", compression=ZIP_DEFLATED) as archive:
    for filename in sorted(files):
        archive.write(ROOT / filename, filename)
with ZipFile(output) as archive:
    assert archive.testzip() is None, "ZIP integrity check failed"
    assert set(archive.namelist()) == files, "ZIP contents do not match the package"
print(f"Validated {len(files)} files; created {output.name} ({output.stat().st_size:,} bytes)")
