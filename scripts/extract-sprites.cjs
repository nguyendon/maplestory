const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Frame configurations for each sprite
// Manually define frame positions since MapleStory sprites are irregularly placed
const spriteConfigs = {
  'orange_mushroom': {
    frames: [
      // Row 1: idle frames
      { x: 5, y: 8, w: 57, h: 65 },
      { x: 70, y: 8, w: 57, h: 65 },
      { x: 135, y: 8, w: 57, h: 65 },
      // Row 2: walk/move frames
      { x: 5, y: 85, w: 60, h: 68 },
      { x: 70, y: 85, w: 60, h: 68 },
      { x: 135, y: 85, w: 60, h: 68 },
    ],
    frameWidth: 64,
    frameHeight: 72,
    idleFrames: [0, 1, 2],
    moveFrames: [3, 4, 5],
  },
  'blue_mushroom': {
    frames: [
      { x: 5, y: 8, w: 60, h: 68 },
      { x: 72, y: 8, w: 60, h: 68 },
      { x: 140, y: 8, w: 60, h: 68 },
      { x: 5, y: 88, w: 62, h: 70 },
      { x: 72, y: 88, w: 62, h: 70 },
      { x: 140, y: 88, w: 62, h: 70 },
    ],
    frameWidth: 66,
    frameHeight: 74,
    idleFrames: [0, 1, 2],
    moveFrames: [3, 4, 5],
  },
  'horny_mushroom': {
    frames: [
      { x: 5, y: 5, w: 65, h: 58 },
      { x: 78, y: 5, w: 65, h: 58 },
      { x: 150, y: 5, w: 65, h: 58 },
      { x: 5, y: 70, w: 68, h: 55 },
      { x: 78, y: 70, w: 68, h: 55 },
      { x: 150, y: 70, w: 68, h: 55 },
    ],
    frameWidth: 72,
    frameHeight: 62,
    idleFrames: [0, 1, 2],
    moveFrames: [3, 4, 5],
  },
  'zombie_mushroom': {
    frames: [
      { x: 5, y: 5, w: 62, h: 75 },
      { x: 75, y: 5, w: 62, h: 75 },
      { x: 145, y: 5, w: 62, h: 75 },
      { x: 5, y: 90, w: 65, h: 72 },
      { x: 75, y: 90, w: 65, h: 72 },
      { x: 145, y: 90, w: 65, h: 72 },
    ],
    frameWidth: 68,
    frameHeight: 78,
    idleFrames: [0, 1, 2],
    moveFrames: [3, 4, 5],
  },
  'pig': {
    frames: [
      { x: 5, y: 5, w: 78, h: 55 },
      { x: 90, y: 5, w: 78, h: 55 },
      { x: 175, y: 5, w: 78, h: 55 },
      { x: 5, y: 70, w: 80, h: 58 },
      { x: 90, y: 70, w: 80, h: 58 },
      { x: 175, y: 70, w: 80, h: 58 },
    ],
    frameWidth: 84,
    frameHeight: 62,
    idleFrames: [0, 1, 2],
    moveFrames: [3, 4, 5],
  },
  'ribbon_pig': {
    frames: [
      { x: 5, y: 5, w: 78, h: 60 },
      { x: 90, y: 5, w: 78, h: 60 },
      { x: 175, y: 5, w: 78, h: 60 },
      { x: 5, y: 75, w: 80, h: 62 },
      { x: 90, y: 75, w: 80, h: 62 },
      { x: 175, y: 75, w: 80, h: 62 },
    ],
    frameWidth: 84,
    frameHeight: 66,
    idleFrames: [0, 1, 2],
    moveFrames: [3, 4, 5],
  },
  'snail': {
    frames: [
      { x: 5, y: 5, w: 48, h: 35 },
      { x: 58, y: 5, w: 48, h: 35 },
      { x: 112, y: 5, w: 48, h: 35 },
      { x: 5, y: 48, w: 50, h: 38 },
      { x: 58, y: 48, w: 50, h: 38 },
      { x: 112, y: 48, w: 50, h: 38 },
    ],
    frameWidth: 54,
    frameHeight: 42,
    idleFrames: [0, 1, 2],
    moveFrames: [3, 4, 5],
  },
};

const inputDir = path.join(__dirname, '../assets/sprites/monsters');
const outputDir = path.join(__dirname, '../assets/sprites/monsters/sheets');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function convertMagentaToTransparent(buffer, width, height, channels) {
  const pixels = new Uint8Array(width * height * 4);

  for (let i = 0; i < buffer.length; i += channels) {
    const r = buffer[i];
    const g = buffer[i + 1];
    const b = buffer[i + 2];
    const a = channels === 4 ? buffer[i + 3] : 255;

    const pixelIndex = (i / channels) * 4;

    // Check if pixel is magenta (with tolerance)
    const isMagenta = r > 230 && g < 30 && b > 230;

    if (isMagenta) {
      pixels[pixelIndex] = 0;
      pixels[pixelIndex + 1] = 0;
      pixels[pixelIndex + 2] = 0;
      pixels[pixelIndex + 3] = 0;
    } else {
      pixels[pixelIndex] = r;
      pixels[pixelIndex + 1] = g;
      pixels[pixelIndex + 2] = b;
      pixels[pixelIndex + 3] = a;
    }
  }

  return pixels;
}

async function extractSpriteSheet(name, config) {
  const inputPath = path.join(inputDir, `${name}.png`);
  const outputPath = path.join(outputDir, `${name}.png`);
  const jsonPath = path.join(outputDir, `${name}.json`);

  if (!fs.existsSync(inputPath)) {
    console.log(`Skipping ${name} - file not found`);
    return null;
  }

  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    console.log(`Processing ${name}: ${metadata.width}x${metadata.height}`);

    const { frameWidth, frameHeight, frames } = config;
    const numFrames = frames.length;

    // Create a horizontal sprite sheet
    const sheetWidth = frameWidth * numFrames;
    const sheetHeight = frameHeight;

    // Create output buffer
    const outputBuffer = Buffer.alloc(sheetWidth * sheetHeight * 4, 0);

    // Extract each frame
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];

      // Clamp dimensions to source image bounds
      const extractWidth = Math.min(frame.w, metadata.width - frame.x);
      const extractHeight = Math.min(frame.h, metadata.height - frame.y);

      if (extractWidth <= 0 || extractHeight <= 0) {
        console.log(`  Frame ${i} out of bounds, skipping`);
        continue;
      }

      const extracted = await sharp(inputPath)
        .extract({
          left: frame.x,
          top: frame.y,
          width: extractWidth,
          height: extractHeight
        })
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { data, info } = extracted;
      const transparentData = await convertMagentaToTransparent(data, info.width, info.height, info.channels);

      // Center the frame in the output cell
      const offsetX = Math.floor((frameWidth - info.width) / 2);
      const offsetY = Math.floor((frameHeight - info.height) / 2);

      // Copy to output buffer
      for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < info.width; x++) {
          const srcIdx = (y * info.width + x) * 4;
          const dstX = i * frameWidth + offsetX + x;
          const dstY = offsetY + y;
          const dstIdx = (dstY * sheetWidth + dstX) * 4;

          if (dstX >= 0 && dstX < sheetWidth && dstY >= 0 && dstY < sheetHeight) {
            outputBuffer[dstIdx] = transparentData[srcIdx];
            outputBuffer[dstIdx + 1] = transparentData[srcIdx + 1];
            outputBuffer[dstIdx + 2] = transparentData[srcIdx + 2];
            outputBuffer[dstIdx + 3] = transparentData[srcIdx + 3];
          }
        }
      }
    }

    // Save sprite sheet
    await sharp(outputBuffer, {
      raw: {
        width: sheetWidth,
        height: sheetHeight,
        channels: 4
      }
    })
    .png()
    .toFile(outputPath);

    // Save JSON metadata for Phaser
    const jsonData = {
      frameWidth,
      frameHeight,
      numFrames,
      animations: {
        idle: config.idleFrames,
        move: config.moveFrames
      }
    };
    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));

    console.log(`  Saved: ${outputPath} (${sheetWidth}x${sheetHeight}, ${numFrames} frames)`);
    return jsonData;
  } catch (error) {
    console.error(`Error processing ${name}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('Extracting animated sprite sheets...\n');

  const results = {};

  for (const [name, config] of Object.entries(spriteConfigs)) {
    const result = await extractSpriteSheet(name, config);
    if (result) {
      results[name] = result;
    }
  }

  // Save combined metadata
  const combinedPath = path.join(outputDir, 'sprites.json');
  fs.writeFileSync(combinedPath, JSON.stringify(results, null, 2));

  console.log('\nDone! Sprite sheets saved to:', outputDir);
  console.log('Metadata saved to:', combinedPath);
}

main();
