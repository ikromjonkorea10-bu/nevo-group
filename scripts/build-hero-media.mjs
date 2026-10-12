import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import sharp from 'sharp';

const FFMPEG = '/Users/pardaev/.gemini/antigravity/scratch/node_modules/@ffmpeg-installer/darwin-arm64/ffmpeg';
const RAW_MERGED = '/tmp/nevo_full_raw.mp4';
const PUBLIC_VIDEOS = path.resolve('public/videos');

console.log('🎬 Starting NEVO Hero Media Build Pipeline...');

if (!fs.existsSync(RAW_MERGED)) {
  console.error('❌ Missing raw merged video at', RAW_MERGED);
  process.exit(1);
}

// 1. Desktop 1080p hero video (CRF 23, faststart)
console.log('⏳ Encoding public/videos/home-hero.mp4 (1080p)...');
execSync(
  `"${FFMPEG}" -y -i "${RAW_MERGED}" -vf "scale=1920:1080:flags=lanczos" -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k -movflags +faststart "${path.join(PUBLIC_VIDEOS, 'home-hero.mp4')}"`,
  { stdio: 'inherit' }
);

// 2. Mobile 720p hero video (CRF 26, faststart)
console.log('⏳ Encoding public/videos/home-hero-720.mp4 (720p)...');
execSync(
  `"${FFMPEG}" -y -i "${RAW_MERGED}" -c:v libx264 -crf 26 -preset medium -c:a aac -b:a 128k -movflags +faststart "${path.join(PUBLIC_VIDEOS, 'home-hero-720.mp4')}"`,
  { stdio: 'inherit' }
);

// 3. WebM hero video
console.log('⏳ Encoding public/videos/home-hero.webm (WebM VP8/VP9)...');
execSync(
  `"${FFMPEG}" -y -i "${RAW_MERGED}" -c:v libvpx -b:v 1500k -crf 26 -c:a libvorbis -b:a 128k "${path.join(PUBLIC_VIDEOS, 'home-hero.webm')}"`,
  { stdio: 'inherit' }
);

// 4. Audio tracks (mp3 and m4a)
console.log('⏳ Extracting audio tracks...');
execSync(
  `"${FFMPEG}" -y -i "${RAW_MERGED}" -vn -c:a libmp3lame -b:a 128k "${path.join(PUBLIC_VIDEOS, 'home-hero-audio.mp3')}"`,
  { stdio: 'inherit' }
);
execSync(
  `"${FFMPEG}" -y -i "${RAW_MERGED}" -vn -c:a aac -b:a 128k "${path.join(PUBLIC_VIDEOS, 'home-hero-audio.m4a')}"`,
  { stdio: 'inherit' }
);

// 5. High-resolution poster images
console.log('⏳ Generating posters...');
const tempFrame = '/tmp/nevo_hero_frame_0.png';
execSync(
  `"${FFMPEG}" -y -ss 00:00:00.600 -i "${RAW_MERGED}" -vframes 1 "${tempFrame}"`,
  { stdio: 'inherit' }
);

await sharp(tempFrame)
  .resize(1600, 900, { fit: 'cover', position: 'center' })
  .webp({ quality: 85 })
  .toFile(path.join(PUBLIC_VIDEOS, 'home-hero-poster.webp'));

await sharp(tempFrame)
  .resize(540, 960, { fit: 'cover', position: 'center' })
  .webp({ quality: 82 })
  .toFile(path.join(PUBLIC_VIDEOS, 'home-hero-mobile-poster.webp'));

// 6. Mobile animated WebP background (10 fps, 540x960 center crop, 15 seconds)
console.log('⏳ Encoding public/videos/home-hero-mobile.webp (animated WebP for mobile)...');
const framesDir = '/tmp/nevo_frames';
fs.rmSync(framesDir, { recursive: true, force: true });
fs.mkdirSync(framesDir, { recursive: true });

execSync(
  `"${FFMPEG}" -y -ss 0 -t 15 -i "${RAW_MERGED}" -vf "fps=10,scale=540:960:force_original_aspect_ratio=increase,crop=540:960" "${framesDir}/f_%04d.png"`,
  { stdio: 'inherit' }
);

const frameFiles = fs.readdirSync(framesDir).filter(f => f.endsWith('.png')).sort();
const img2webpCmd = `/opt/homebrew/bin/img2webp -loop 0 -q 55 -d 100 ${frameFiles.map(f => `"${path.join(framesDir, f)}"`).join(' ')} -o "${path.join(PUBLIC_VIDEOS, 'home-hero-mobile.webp')}"`;
execSync(img2webpCmd, { stdio: 'inherit' });
fs.rmSync(framesDir, { recursive: true, force: true });

console.log('✅ All hero media files built successfully!');
