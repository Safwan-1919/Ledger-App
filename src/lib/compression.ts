import { File } from 'expo-file-system';
import jpegJs from 'jpeg-js';
import UPNG from 'upng-js';

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function isPng(bytes: Uint8Array): boolean {
  return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
}

function isJpeg(bytes: Uint8Array): boolean {
  return bytes[0] === 0xff && bytes[1] === 0xd8;
}

function resizeRGBA(src: Uint8Array, w: number, h: number, maxDim: number): { data: Uint8Array; width: number; height: number } {
  const scale = Math.min(1, maxDim / Math.max(w, h));
  const nw = Math.max(1, Math.round(w * scale));
  const nh = Math.max(1, Math.round(h * scale));
  const out = new Uint8Array(nw * nh * 4);
  for (let y = 0; y < nh; y++) {
    const sy = Math.floor((y / nh) * h);
    for (let x = 0; x < nw; x++) {
      const sx = Math.floor((x / nw) * w);
      const si = (sy * w + sx) * 4;
      const di = (y * nw + x) * 4;
      out[di] = src[si];
      out[di + 1] = src[si + 1];
      out[di + 2] = src[si + 2];
      out[di + 3] = src[si + 3];
    }
  }
  return { data: out, width: nw, height: nh };
}

export async function compressReceipt(sourceUri: string, maxDim = 1280): Promise<string> {
  const src = new File(sourceUri);
  const bytes = await src.bytes();

  try {
    if (isJpeg(bytes)) {
      const decoded = jpegJs.decode(bytes, { useTArray: true });
      const resized = resizeRGBA(decoded.data, decoded.width, decoded.height, maxDim);
      const png = UPNG.encode([resized.data.buffer as ArrayBuffer], resized.width, resized.height, 8);
      const b64 = uint8ToBase64(new Uint8Array(png));
      return `data:image/png;base64,${b64}`;
    }

    if (isPng(bytes)) {
      const decoded = UPNG.decode(bytes.buffer as ArrayBuffer);
      const rgba = UPNG.toRGBA8(decoded);
      if (rgba.length > 0 && rgba[0]) {
        const imageData = new Uint8Array(rgba[0] as ArrayBuffer);
        const resized = resizeRGBA(imageData, decoded.width, decoded.height, maxDim);
        const png = UPNG.encode([resized.data.buffer as ArrayBuffer], resized.width, resized.height, 8);
        const b64 = uint8ToBase64(new Uint8Array(png));
        return `data:image/png;base64,${b64}`;
      }
    }
  } catch {
    // Fall through to raw base64.
  }

  const b64 = uint8ToBase64(bytes);
  return `data:image/jpeg;base64,${b64}`;
}
