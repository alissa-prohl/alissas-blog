import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OUTPUT_DIR = path.resolve("img");
const RAW_DIR = path.resolve("img/raw");

// Supported extensions for optimization
const SUPPORTED_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

function isImageFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return SUPPORTED_EXTS.has(ext);
}

function shouldProcess(srcPath, destPath) {
  if (!fs.existsSync(destPath)) return true;
  const srcStat = fs.statSync(srcPath);
  const destStat = fs.statSync(destPath);
  return srcStat.mtimeMs > destStat.mtimeMs;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function optimizeFile(filePath, isRaw = false) {
  const ext = path.extname(filePath);
  const baseName = path.basename(filePath, ext);

  const srcStat = fs.statSync(filePath);
  const image = sharp(filePath);
  const metadata = await image.metadata();

  let processedAny = false;

  // Single clean WebP version (max 1200px width, high quality compression)
  const targetDir = isRaw ? OUTPUT_DIR : path.dirname(filePath);
  const defaultWebpPath = path.join(targetDir, `${baseName}.webp`);
  if (shouldProcess(filePath, defaultWebpPath)) {
    const pipeline = sharp(filePath).rotate();
    pipeline.resize({ width: 1200, withoutEnlargement: true });
    await pipeline
      .webp({ quality: 82, effort: 4 })
      .toFile(defaultWebpPath);

    const destStat = fs.statSync(defaultWebpPath);
    const saved = Math.round((1 - destStat.size / srcStat.size) * 100);
    console.log(`  ✓ ${path.basename(filePath)} (${formatBytes(srcStat.size)}) -> ${baseName}.webp (${formatBytes(destStat.size)}, ${saved >= 0 ? `-${saved}%` : `+${Math.abs(saved)}%`})`);
    processedAny = true;
  }

  return processedAny;
}

function scanImagesRecursively(dir) {
  let list = [];
  if (!fs.existsSync(dir)) return list;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "raw" || entry.name.startsWith(".")) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      list = list.concat(scanImagesRecursively(fullPath));
    } else if (entry.isFile() && isImageFile(entry.name) && !entry.name.endsWith(".webp")) {
      list.push(fullPath);
    }
  }
  return list;
}

export async function optimizeAll() {
  const startTime = Date.now();
  console.log(`[${new Date().toLocaleTimeString()}] Optimizing images...`);

  // Ensure directories exist
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });

  let count = 0;

  // Process img/raw/ if any files exist there
  const rawFiles = fs.readdirSync(RAW_DIR);
  for (const file of rawFiles) {
    if (isImageFile(file)) {
      const changed = await optimizeFile(path.join(RAW_DIR, file), true);
      if (changed) count++;
    }
  }

  // Also process original png/jpg in img/ and all subdirectories
  const imgFiles = scanImagesRecursively(OUTPUT_DIR);
  for (const fullPath of imgFiles) {
    const changed = await optimizeFile(fullPath, false);
    if (changed) count++;
  }

  const elapsed = Date.now() - startTime;
  if (count === 0) {
    console.log(`[${new Date().toLocaleTimeString()}] All images are up to date (${elapsed}ms)`);
  } else {
    console.log(`[${new Date().toLocaleTimeString()}] Optimized image(s) in ${elapsed}ms`);
  }
}

async function main() {
  await optimizeAll();

  if (process.argv.includes("--watch")) {
    console.log("Watching img/ and img/raw/ for new or modified images...");
    let debounceTimer = null;
    const watchHandler = (eventType, filename) => {
      if (filename && isImageFile(filename) && !filename.endsWith(".webp")) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          console.log(`Image change detected: ${filename}`);
          optimizeAll().catch(console.error);
        }, 150);
      }
    };

    fs.watch(OUTPUT_DIR, watchHandler);
    fs.watch(RAW_DIR, watchHandler);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve("optimize-images.js")) {
  main().catch((err) => {
    console.error("Image optimization failed:", err);
    process.exit(1);
  });
}
