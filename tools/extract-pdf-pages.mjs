import * as mupdf from "mupdf";
import fs from "fs";
import path from "path";

const SRC = "D:\\Bbabiker Siddig ARTEST\\Blue Happy Birthday Instagram Post.pdf";
const OUT_DIR = path.join(import.meta.dirname, "..", "..", "pdf-pages"); // scratch area outside project
fs.mkdirSync(OUT_DIR, { recursive: true });

const doc = mupdf.Document.openDocument(fs.readFileSync(SRC), "application/pdf");
const n = doc.countPages();
console.log("pages:", n);

const DPI = 300;
const zoom = DPI / 72;
const matrix = mupdf.Matrix.scale(zoom, zoom);

for (let i = 0; i < n; i++) {
  const page = doc.loadPage(i);
  const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false, true);
  const png = pixmap.asPNG();
  const outPath = path.join(OUT_DIR, `page-${String(i + 1).padStart(2, "0")}.png`);
  fs.writeFileSync(outPath, png);
  console.log("wrote", outPath);
}
