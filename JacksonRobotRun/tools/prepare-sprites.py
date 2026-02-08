#!/usr/bin/env python3
"""
Jackson Robot Run - Sprite Preparation Tool

Opens a web page where you can upload Jackson's photos.
Automatically removes backgrounds, crops, resizes, and saves
game-ready sprites to public/assets/sprites/jackson/.

Usage:
    cd JacksonRobotRun
    python3 tools/prepare-sprites.py

Then open http://localhost:8090 in your browser.
"""

import os
import io
import json
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow not installed. Run: pip3 install Pillow")
    sys.exit(1)

try:
    from rembg import remove
    HAS_REMBG = True
except ImportError:
    HAS_REMBG = False
    print("WARNING: rembg not installed. Background removal disabled.")
    print("         Install with: pip3 install rembg")

# Output directory
SCRIPT_DIR = Path(__file__).parent.parent
OUTPUT_DIR = SCRIPT_DIR / "public" / "assets" / "sprites" / "jackson"

# Sprite specifications
SPRITES = {
    "run":   {"filename": "run.png",   "width": 128, "height": 192, "label": "Running Pose"},
    "jump":  {"filename": "jump.png",  "width": 128, "height": 192, "label": "Jump Pose"},
    "slide": {"filename": "slide.png", "width": 160, "height": 96,  "label": "Slide / Crouch Pose"},
}

HTML_PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Jackson Robot Run - Sprite Prep</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #1a1a2e;
    color: #fff;
    min-height: 100vh;
    padding: 20px;
  }
  h1 {
    text-align: center;
    font-size: 28px;
    margin-bottom: 8px;
    color: #3498db;
  }
  .subtitle {
    text-align: center;
    color: #888;
    margin-bottom: 30px;
    font-size: 14px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    max-width: 960px;
    margin: 0 auto;
  }
  .card {
    background: #16213e;
    border-radius: 12px;
    padding: 20px;
    border: 2px solid #333;
    transition: border-color 0.3s;
  }
  .card.has-image { border-color: #27ae60; }
  .card.processing { border-color: #f39c12; }
  .card h3 {
    font-size: 18px;
    margin-bottom: 4px;
  }
  .card .dims {
    color: #666;
    font-size: 12px;
    margin-bottom: 12px;
  }
  .drop-zone {
    border: 2px dashed #444;
    border-radius: 8px;
    padding: 40px 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
    min-height: 150px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }
  .drop-zone:hover, .drop-zone.dragover {
    border-color: #3498db;
    background: rgba(52, 152, 219, 0.1);
  }
  .drop-zone input { display: none; }
  .drop-zone .icon { font-size: 36px; margin-bottom: 8px; }
  .drop-zone .text { color: #888; font-size: 14px; }
  .preview-container {
    margin-top: 12px;
    text-align: center;
  }
  .preview-container img {
    max-width: 100%;
    max-height: 200px;
    border-radius: 4px;
    background: repeating-conic-gradient(#333 0% 25%, #222 0% 50%) 50% / 16px 16px;
  }
  .status {
    margin-top: 8px;
    font-size: 13px;
    padding: 6px 10px;
    border-radius: 4px;
  }
  .status.success { background: rgba(39, 174, 96, 0.2); color: #27ae60; }
  .status.error { background: rgba(231, 76, 60, 0.2); color: #e74c3c; }
  .status.processing { background: rgba(243, 156, 18, 0.2); color: #f39c12; }
  .actions {
    text-align: center;
    margin-top: 30px;
  }
  .actions button {
    background: #27ae60;
    color: #fff;
    border: none;
    padding: 14px 40px;
    font-size: 18px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
  }
  .actions button:hover { background: #2ecc71; }
  .actions button:disabled {
    background: #555;
    cursor: not-allowed;
  }
  .done-msg {
    text-align: center;
    margin-top: 20px;
    padding: 15px;
    background: rgba(39, 174, 96, 0.15);
    border-radius: 8px;
    display: none;
  }
  .done-msg.visible { display: block; }
</style>
</head>
<body>
  <h1>Jackson Robot Run - Sprite Prep</h1>
  <p class="subtitle">Upload Jackson's photos below. Background will be removed automatically.</p>

  <div class="grid" id="grid"></div>

  <div class="actions">
    <button id="processBtn" onclick="processAll()" disabled>
      Process & Save All Sprites
    </button>
  </div>

  <div class="done-msg" id="doneMsg">
    All sprites saved! You can now run <code>npm run dev</code> and Jackson's photos will appear in the game.
  </div>

<script>
const SPRITES = {
  run:   { label: "Running Pose", dims: "128 x 192", desc: "Best running photo (fists up, dynamic)" },
  jump:  { label: "Jump Pose",    dims: "128 x 192", desc: "Fist raised high, excited expression" },
  slide: { label: "Slide Pose",   dims: "160 x 96",  desc: "Low crouch, leaning forward" },
};

const files = {};
const grid = document.getElementById('grid');

Object.entries(SPRITES).forEach(([key, info]) => {
  const card = document.createElement('div');
  card.className = 'card';
  card.id = `card-${key}`;
  card.innerHTML = `
    <h3>${info.label}</h3>
    <div class="dims">${info.dims}px &mdash; ${info.desc}</div>
    <div class="drop-zone" id="drop-${key}">
      <input type="file" accept="image/*" id="file-${key}" />
      <div class="icon">&#x1f4f7;</div>
      <div class="text">Click or drag photo here</div>
    </div>
    <div class="preview-container" id="preview-${key}"></div>
    <div class="status" id="status-${key}" style="display:none"></div>
  `;
  grid.appendChild(card);

  const dropZone = card.querySelector('.drop-zone');
  const fileInput = card.querySelector('input');

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) handleFile(key, e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) handleFile(key, fileInput.files[0]);
  });
});

function handleFile(key, file) {
  files[key] = file;
  const reader = new FileReader();
  reader.onload = e => {
    const preview = document.getElementById(`preview-${key}`);
    preview.innerHTML = `<img src="${e.target.result}" alt="${key}" />`;
    document.getElementById(`card-${key}`).classList.add('has-image');
    updateButton();
  };
  reader.readAsDataURL(file);
}

function updateButton() {
  const allSet = ['run', 'jump', 'slide'].every(k => files[k]);
  document.getElementById('processBtn').disabled = !allSet;
}

async function processAll() {
  const btn = document.getElementById('processBtn');
  btn.disabled = true;
  btn.textContent = 'Processing...';

  for (const key of ['run', 'jump', 'slide']) {
    const statusEl = document.getElementById(`status-${key}`);
    const card = document.getElementById(`card-${key}`);
    statusEl.style.display = 'block';
    statusEl.className = 'status processing';
    statusEl.textContent = 'Removing background & resizing...';
    card.classList.add('processing');

    try {
      const formData = new FormData();
      formData.append('image', files[key]);
      formData.append('type', key);

      const resp = await fetch('/upload', { method: 'POST', body: formData });
      const result = await resp.json();

      if (result.success) {
        statusEl.className = 'status success';
        statusEl.textContent = `Saved as ${result.filename}`;
        card.classList.remove('processing');
        // Show processed preview
        const preview = document.getElementById(`preview-${key}`);
        preview.innerHTML = `<img src="/preview/${key}?t=${Date.now()}" alt="${key} processed" />`;
      } else {
        statusEl.className = 'status error';
        statusEl.textContent = `Error: ${result.error}`;
        card.classList.remove('processing');
      }
    } catch (err) {
      statusEl.className = 'status error';
      statusEl.textContent = `Error: ${err.message}`;
      card.classList.remove('processing');
    }
  }

  btn.textContent = 'Process & Save All Sprites';
  btn.disabled = false;
  document.getElementById('doneMsg').classList.add('visible');
}
</script>
</body>
</html>
"""


def process_image(image_data: bytes, sprite_type: str) -> bytes:
    """Process an uploaded image: remove background, crop, resize."""
    img = Image.open(io.BytesIO(image_data)).convert("RGBA")

    # Remove background using rembg
    if HAS_REMBG:
        img_bytes = io.BytesIO()
        img.save(img_bytes, format="PNG")
        img_bytes.seek(0)
        result_bytes = remove(img_bytes.read())
        img = Image.open(io.BytesIO(result_bytes)).convert("RGBA")

    # Auto-crop to content (non-transparent pixels)
    bbox = img.getbbox()
    if bbox:
        # Add small padding
        pad = 10
        left = max(0, bbox[0] - pad)
        top = max(0, bbox[1] - pad)
        right = min(img.width, bbox[2] + pad)
        bottom = min(img.height, bbox[3] + pad)
        img = img.crop((left, top, right, bottom))

    # Resize to target dimensions
    spec = SPRITES[sprite_type]
    target_w = spec["width"]
    target_h = spec["height"]

    # Fit within target while preserving aspect ratio, then pad
    img.thumbnail((target_w, target_h), Image.LANCZOS)

    # Create transparent canvas at exact target size and center the image
    canvas = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    x_offset = (target_w - img.width) // 2
    y_offset = (target_h - img.height) // 2
    canvas.paste(img, (x_offset, y_offset))

    # Save to bytes
    out = io.BytesIO()
    canvas.save(out, format="PNG", optimize=True)
    return out.getvalue()


class SpriteHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/" or self.path == "/index.html":
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            self.wfile.write(HTML_PAGE.encode())
        elif self.path.startswith("/preview/"):
            sprite_type = self.path.split("/preview/")[1].split("?")[0]
            filepath = OUTPUT_DIR / SPRITES.get(sprite_type, {}).get("filename", "")
            if filepath.exists():
                self.send_response(200)
                self.send_header("Content-Type", "image/png")
                self.end_headers()
                self.wfile.write(filepath.read_bytes())
            else:
                self.send_response(404)
                self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path != "/upload":
            self.send_response(404)
            self.end_headers()
            return

        # Parse multipart form data
        content_type = self.headers.get("Content-Type", "")
        if "multipart/form-data" not in content_type:
            self._json_response(400, {"success": False, "error": "Expected multipart form data"})
            return

        # Extract boundary
        boundary = content_type.split("boundary=")[1].encode()
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)

        # Simple multipart parser
        parts = body.split(b"--" + boundary)
        image_data = None
        sprite_type = None

        for part in parts:
            if b"Content-Disposition" not in part:
                continue
            header_end = part.find(b"\r\n\r\n")
            if header_end == -1:
                continue
            headers = part[:header_end].decode("utf-8", errors="replace")
            data = part[header_end + 4:]
            if data.endswith(b"\r\n"):
                data = data[:-2]

            if 'name="image"' in headers:
                image_data = data
            elif 'name="type"' in headers:
                sprite_type = data.decode().strip()

        if not image_data or not sprite_type or sprite_type not in SPRITES:
            self._json_response(400, {"success": False, "error": "Missing image or invalid type"})
            return

        try:
            # Process the image
            processed = process_image(image_data, sprite_type)

            # Save to output directory
            OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
            filename = SPRITES[sprite_type]["filename"]
            output_path = OUTPUT_DIR / filename
            output_path.write_bytes(processed)

            print(f"  Saved: {output_path} ({len(processed)} bytes)")
            self._json_response(200, {"success": True, "filename": filename})
        except Exception as e:
            print(f"  Error processing {sprite_type}: {e}")
            self._json_response(500, {"success": False, "error": str(e)})

    def _json_response(self, code, data):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def log_message(self, format, *args):
        # Cleaner logging
        print(f"  [{self.command}] {self.path}")


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    port = 8090
    server = HTTPServer(("0.0.0.0", port), SpriteHandler)
    print(f"\n  Jackson Robot Run - Sprite Preparation Tool")
    print(f"  ============================================")
    print(f"  Open in your browser: http://localhost:{port}")
    print(f"  Output directory: {OUTPUT_DIR}")
    print(f"  Background removal: {'ENABLED' if HAS_REMBG else 'DISABLED'}")
    print(f"\n  Press Ctrl+C to stop.\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Server stopped.")
        server.server_close()


if __name__ == "__main__":
    main()
