import { mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const sourceDirectory = path.join(process.cwd(), 'public', 'journey-photos');
const optimizedDirectory = path.join(sourceDirectory, 'optimized');
const supportedImage = /\.(?:avif|gif|jpe?g|png|webp)$/i;

await mkdir(optimizedDirectory, { recursive: true });
for (const entry of await readdir(optimizedDirectory, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.webp')) {
    await rm(path.join(optimizedDirectory, entry.name));
  }
}

let optimizedCount = 0;
let skippedCount = 0;
for (const entry of await readdir(sourceDirectory, { withFileTypes: true })) {
  if (!entry.isFile() || entry.name.startsWith('.') || !supportedImage.test(entry.name)) continue;

  const inputPath = path.join(sourceDirectory, entry.name);
  const outputPath = path.join(optimizedDirectory, `${entry.name}.webp`);
  try {
    await sharp(inputPath, { animated: entry.name.toLowerCase().endsWith('.gif') })
      .rotate()
      .resize({ width: 2200, height: 2200, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toFile(outputPath);
    optimizedCount++;
  } catch (error) {
    await rm(outputPath, { force: true });
    skippedCount++;
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Skipped ${entry.name}: ${message}`);
  }
}

console.log(`Optimized ${optimizedCount} journey photo(s), skipped ${skippedCount}.`);
