import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import sharp from 'sharp';

const FFMPEG = '/Users/pardaev/.gemini/antigravity/scratch/node_modules/@ffmpeg-installer/darwin-arm64/ffmpeg';
const PIPE_SOURCE = '/tmp/catalog_hero_orig_15s.mp4';
const NEVO_OUTRO = '/Users/pardaev/Movies/NEVO_GROUP_Assets/nevo_group_video.mp4';
const RAW_MERGED = '/tmp/nevo_catalog_raw.mp4';
const PUBLIC_VIDEOS = path.resolve('public/videos');

console.log('🎬 Starting NEVO Catalog Media Build Pipeline...');

if (!fs.existsSync(PIPE_SOURCE) || !fs.existsSync(NEVO_OUTRO)) {
  console.error('❌ Missing source video assets:', { PIPE_SOURCE, NEVO_OUTRO });
  process.exit(1);
}

// 0. Merge pipe extrusion & river stream with NEVO GROUP 3D logo outro
console.log('⏳ Merging catalog clips with NEVO GROUP outro (0.4s xfade)...');
execSync(
  `"${FFMPEG}" -y -i "${PIPE_SOURCE}" -i "${NEVO_OUTRO}" -filter_complex "[0:v]scale=1920:1080,setsar=1[v0]; [1:v]scale=1920:1080:flags=lanczos,setsar=1[v1]; [v0][v1]xfade=transition=fade:duration=0.4:offset=14.65,format=yuv420p[outv]; [0:a][1:a]acrossfade=d=0.4:c1=tri:c2=tri[outa]" -map "[outv]" -map "[outa]" -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k "${RAW_MERGED}"`,
  { stdio: 'inherit' }
);

// 1. Desktop 1080p catalog hero video (CRF 22, faststart, yuv420p)
console.log('⏳ Encoding public/videos/catalog-hero.mp4 (1080p)...');
execSync(
  `"${FFMPEG}" -y -i "${RAW_MERGED}" -vf "scale=1920:1080:flags=lanczos" -c:v libx264 -crf 22 -preset medium -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "${path.join(PUBLIC_VIDEOS, 'catalog-hero.mp4')}"`,
  { stdio: 'inherit' }
);

// 2. Mobile 720p catalog hero video (CRF 24, faststart, yuv420p)
console.log('⏳ Encoding public/videos/catalog-hero-720.mp4 (720p)...');
execSync(
  `"${FFMPEG}" -y -i "${RAW_MERGED}" -vf "scale=1280:720:flags=lanczos" -c:v libx264 -crf 24 -preset medium -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "${path.join(PUBLIC_VIDEOS, 'catalog-hero-720.mp4')}"`,
  { stdio: 'inherit' }
);

// 3. WebM catalog hero video
console.log('⏳ Encoding public/videos/catalog-hero.webm (WebM VP9)...');
execSync(
  `"${FFMPEG}" -y -i "${RAW_MERGED}" -vf "scale=1280:720" -c:v libvpx -b:v 1500k -crf 26 -c:a libvorbis -b:a 128k "${path.join(PUBLIC_VIDEOS, 'catalog-hero.webm')}"`,
  { stdio: 'inherit' }
);

// 4. High-resolution poster images
console.log('⏳ Generating catalog posters...');
const tempFrame = '/tmp/nevo_cat_frame_0.png';
execSync(
  `"${FFMPEG}" -y -ss 00:00:00.600 -i "${RAW_MERGED}" -vframes 1 "${tempFrame}"`,
  { stdio: 'inherit' }
);

await sharp(tempFrame)
  .resize(1600, 900, { fit: 'cover', position: 'center' })
  .webp({ quality: 85 })
  .toFile(path.join(PUBLIC_VIDEOS, 'catalog-hero-poster.webp'));

await sharp(tempFrame)
  .resize(720, 1280, { fit: 'cover', position: 'center' })
  .webp({ quality: 82 })
  .toFile(path.join(PUBLIC_VIDEOS, 'catalog-hero-mobile-poster.webp'));

// 5. Mobile animated WebP background (10 fps, 540x960 center crop, 15 seconds)
console.log('⏳ Encoding public/videos/catalog-hero-mobile.webp (animated WebP for fallback)...');
const framesDir = '/tmp/nevo_cat_frames';
fs.rmSync(framesDir, { recursive: true, force: true });
fs.mkdirSync(framesDir, { recursive: true });

execSync(
  `"${FFMPEG}" -y -ss 0 -t 15 -i "${RAW_MERGED}" -vf "fps=10,scale=540:960:force_original_aspect_ratio=increase,crop=540:960" "${framesDir}/f_%04d.png"`,
  { stdio: 'inherit' }
);

const frameFiles = fs.readdirSync(framesDir).filter(f => f.endsWith('.png')).sort();
const img2webpCmd = `/opt/homebrew/bin/img2webp -loop 0 -lossy -q 50 -d 100 ${frameFiles.map(f => `"${path.join(framesDir, f)}"`).join(' ')} -o "${path.join(PUBLIC_VIDEOS, 'catalog-hero-mobile.webp')}"`;
execSync(img2webpCmd, { stdio: 'inherit' });
fs.rmSync(framesDir, { recursive: true, force: true });

console.log('✅ All catalog hero media files built successfully with NEVO GROUP outro!');
