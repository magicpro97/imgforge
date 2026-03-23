// Style presets that get appended to prompts
export const STYLE_PRESETS: Record<string, string> = {
  'photorealistic': ', photorealistic, 8k, ultra detailed, sharp focus, professional photography, natural lighting',
  'anime': ', anime style, vibrant colors, detailed, clean lines, studio ghibli inspired',
  'flat-design': ', flat design, minimalist, clean lines, solid colors, vector art, no shadows',
  'watercolor': ', watercolor painting, soft edges, artistic, delicate brush strokes, paper texture',
  '3d-render': ', 3D render, octane render, high quality, realistic lighting, volumetric, ray tracing',
  'pixel-art': ', pixel art, retro, 8-bit style, clean pixels, nostalgic',
  'logo': ', professional logo design, clean, scalable, minimal, modern, centered',
  'icon': ', app icon, rounded corners, gradient, clean, minimal, no text, centered',
  'cinematic': ', cinematic, movie still, dramatic lighting, wide angle, color graded, film grain',
  'oil-painting': ', oil painting, rich colors, visible brush strokes, classical art, canvas texture',
  'comic': ', comic book style, bold outlines, cel shading, vibrant, dynamic',
  'sketch': ', pencil sketch, hand-drawn, detailed linework, monochrome, artistic',
  'neon': ', neon lights, glowing, cyberpunk, dark background, vivid colors, futuristic',
  'isometric': ', isometric view, 3D, clean, geometric, technical illustration',
  'vintage': ', vintage style, retro, muted colors, film grain, aged, nostalgic',
};

export function getPresetNames(): string[] {
  return Object.keys(STYLE_PRESETS);
}

export function applyPreset(prompt: string, preset: string): string {
  const suffix = STYLE_PRESETS[preset];
  if (!suffix) return prompt;
  return prompt + suffix;
}
