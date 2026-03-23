// Common aspect ratio presets
export const RATIO_PRESETS: Record<string, [number, number]> = {
  '1:1': [1024, 1024],
  '16:9': [1792, 1024],
  '9:16': [1024, 1792],
  '4:3': [1365, 1024],
  '3:4': [1024, 1365],
  '3:2': [1536, 1024],
  '2:3': [1024, 1536],
  'phone': [1170, 2532],
  'desktop': [1920, 1080],
  'og-image': [1200, 630],
  'twitter': [1200, 675],
  'instagram': [1080, 1080],
  'story': [1080, 1920],
  'favicon': [512, 512],
  'banner': [1792, 1024],
  'portrait': [1024, 1792],
  'landscape': [1792, 1024],
};

export function resolveRatio(ratio: string): [number, number] | null {
  // Check presets first
  const preset = RATIO_PRESETS[ratio.toLowerCase()];
  if (preset) return preset;

  // Try parsing "W:H" format
  const match = ratio.match(/^(\d+):(\d+)$/);
  if (match) {
    const w = parseInt(match[1]);
    const h = parseInt(match[2]);
    const scale = 1024 / Math.max(w, h);
    return [Math.round(w * scale), Math.round(h * scale)];
  }

  return null;
}

export function getRatioNames(): string[] {
  return Object.keys(RATIO_PRESETS);
}
