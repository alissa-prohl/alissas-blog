import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import sharp from "sharp";

const OUTPUT_DIR = path.resolve("img");
const RAW_DIR = path.resolve("img/raw");

// Geschützte Systemdateien (z. B. Icons), die niemals gelöscht werden dürfen
const PROTECTED_FILES = new Set([
  "backpack.png",
  "backpack.webp",
  "guitar.png",
  "guitar.webp",
  "programmer.png",
  "programmer.webp",
]);

// Unterstützte Bild- und Videoformate
const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".heic", ".heif"]);
const VIDEO_EXTS = new Set([".mov"]);

function isImageFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return IMAGE_EXTS.has(ext);
}

function isVideoFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return VIDEO_EXTS.has(ext);
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

/**
 * Optimiert ein Bild in .webp und löscht anschließend das Original automatisch
 */
async function optimizeImageFile(filePath, isRaw = false) {
  const ext = path.extname(filePath);
  const baseName = path.basename(filePath, ext);
  const extLower = ext.toLowerCase();

  const srcStat = fs.statSync(filePath);
  const targetDir = isRaw ? OUTPUT_DIR : path.dirname(filePath);
  const defaultWebpPath = path.join(targetDir, `${baseName}.webp`);

  let processedAny = false;

  if (shouldProcess(filePath, defaultWebpPath)) {
    let sourceForSharp = filePath;
    let tempJpgPath = null;

    // HEIC-Dateien von Apple vorab über macOS sips dekodieren, falls sharp sie nicht direkt lesen kann
    if (extLower === ".heic" || extLower === ".heif") {
      tempJpgPath = path.join(targetDir, `__temp_${baseName}.jpg`);
      try {
        execSync(`sips -s format jpeg "${filePath}" --out "${tempJpgPath}"`, { stdio: "ignore" });
        sourceForSharp = tempJpgPath;
      } catch {
        sourceForSharp = filePath;
      }
    }

    try {
      const pipeline = sharp(sourceForSharp).rotate();
      pipeline.resize({ width: 1200, withoutEnlargement: true });
      await pipeline.webp({ quality: 82, effort: 4 }).toFile(defaultWebpPath);

      const destStat = fs.statSync(defaultWebpPath);
      const saved = Math.round((1 - destStat.size / srcStat.size) * 100);
      console.log(
        `  ✓ ${path.basename(filePath)} (${formatBytes(srcStat.size)}) -> ${baseName}.webp (${formatBytes(destStat.size)}, ${saved >= 0 ? `-${saved}%` : `+${Math.abs(saved)}%`})`
      );
      processedAny = true;
    } finally {
      if (tempJpgPath && fs.existsSync(tempJpgPath)) {
        fs.unlinkSync(tempJpgPath);
      }
    }
  }

  // AUTOMATISCHE BEREINIGUNG: Sobald die WebP-Datei existiert und intakt ist, Original löschen
  if (
    fs.existsSync(defaultWebpPath) &&
    fs.statSync(defaultWebpPath).size > 0 &&
    !PROTECTED_FILES.has(path.basename(filePath)) &&
    filePath !== defaultWebpPath
  ) {
    fs.unlinkSync(filePath);
    console.log(`    🗑️ Original gelöscht: ${path.basename(filePath)}`);
  }

  return processedAny;
}

/**
 * Konvertiert .mov Videos in Web-kompatibles MP4 und löscht das .mov Original
 */
function optimizeVideoFile(filePath) {
  const ext = path.extname(filePath);
  const baseName = path.basename(filePath, ext);
  const targetDir = path.dirname(filePath);
  const mp4Path = path.join(targetDir, `${baseName}.mp4`);

  if (!fs.existsSync(mp4Path) || fs.statSync(mp4Path).size === 0) {
    console.log(`  🎬 Konvertiere Video ${path.basename(filePath)} -> ${baseName}.mp4...`);
    try {
      execSync(`avconvert --preset Preset1280x720 --source "${filePath}" --output "${mp4Path}" --replace`, {
        stdio: "inherit",
      });
    } catch (e) {
      console.error(`Fehler bei Videokonvertierung von ${filePath}:`, e.message);
      return false;
    }
  }

  if (fs.existsSync(mp4Path) && fs.statSync(mp4Path).size > 0) {
    fs.unlinkSync(filePath);
    console.log(`    🗑️ Original-Video gelöscht: ${path.basename(filePath)}`);
    return true;
  }

  return false;
}

function scanMediaRecursively(dir) {
  let images = [];
  let videos = [];
  if (!fs.existsSync(dir)) return { images, videos };

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "raw" || entry.name.startsWith(".")) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = scanMediaRecursively(fullPath);
      images = images.concat(sub.images);
      videos = videos.concat(sub.videos);
    } else if (entry.isFile()) {
      if (isImageFile(entry.name) && !entry.name.endsWith(".webp")) {
        images.push(fullPath);
      } else if (isVideoFile(entry.name)) {
        videos.push(fullPath);
      }
    }
  }
  return { images, videos };
}

export async function optimizeAll() {
  const startTime = Date.now();
  console.log(`[${new Date().toLocaleTimeString()}] Optimizing images & videos...`);

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });

  let count = 0;

  // 1. Process img/raw/ if any files exist
  const rawFiles = fs.readdirSync(RAW_DIR);
  for (const file of rawFiles) {
    if (isImageFile(file)) {
      const changed = await optimizeImageFile(path.join(RAW_DIR, file), true);
      if (changed) count++;
    }
  }

  // 2. Process all images & videos in img/ subdirectories
  const { images, videos } = scanMediaRecursively(OUTPUT_DIR);

  for (const fullPath of images) {
    const changed = await optimizeImageFile(fullPath, false);
    if (changed) count++;
  }

  for (const videoPath of videos) {
    const changed = optimizeVideoFile(videoPath);
    if (changed) count++;
  }

  const elapsed = Date.now() - startTime;
  if (count === 0) {
    console.log(`[${new Date().toLocaleTimeString()}] All media up to date (${elapsed}ms)`);
  } else {
    console.log(`[${new Date().toLocaleTimeString()}] Processed media in ${elapsed}ms`);
  }
}

async function main() {
  await optimizeAll();

  if (process.argv.includes("--watch")) {
    console.log("Watching img/ and img/raw/ for new or modified media...");
    let debounceTimer = null;
    const watchHandler = (eventType, filename) => {
      if (filename && (isImageFile(filename) || isVideoFile(filename)) && !filename.endsWith(".webp") && !filename.endsWith(".mp4")) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          console.log(`Media change detected: ${filename}`);
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
    console.error("Media optimization failed:", err);
    process.exit(1);
  });
}
