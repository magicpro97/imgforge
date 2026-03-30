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

  // Marketing use-case presets
  'app-icon-clean': ', Clean app icon design, single bold symbol centered on solid or simple gradient background, no text, no letters, no words, vibrant colors, high contrast, modern flat style, suitable for app store display at all sizes from 16px to 1024px',
  'hero-image': ', Hero banner image, vibrant and eye-catching, benefit-focused composition showing positive outcomes, lifestyle imagery, warm and inviting, professional marketing quality, suitable for app landing page or store listing header',
  'social-proof-banner': ', Marketing banner with space for statistics and numbers overlay, clean modern background with subtle patterns, professional corporate style, muted colors that allow white text to be readable, suitable for showcasing download counts or ratings',
  'store-screenshot-bg': ', Abstract gradient background for app store screenshots, smooth color transitions, modern and premium feel, subtle geometric patterns optional, no text, designed as a backdrop for device mockups, portrait orientation preferred',

  // Science-backed icon preset (Shin et al. 2018)
  'app-icon-science': ', App icon following scientific best practices for maximum download conversion: ONE single dominant visual element only, absolutely NO text or letters or words of any kind, high contrast color palette with bold vibrant primary color, clean simple background (solid color or minimal gradient), centered symmetrical composition, rounded corners compatible, visually clear and recognizable at 16px size, modern flat or subtle 3D style, no fine details that disappear at small sizes',

  // Mood presets
  'professional': 'Professional corporate style, clean lines, muted color palette, sophisticated typography, business-appropriate imagery, polished and refined aesthetic',
  'playful': 'Playful and fun design style, bright vibrant colors, rounded shapes, whimsical elements, cartoon-like qualities, energetic and joyful mood',
  'luxurious': 'Luxury premium aesthetic, rich deep colors, gold or metallic accents, elegant minimalism, high-end fashion or jewelry inspired, sophisticated and exclusive feel',
  'minimalist': 'Ultra-minimalist design, maximum whitespace, single accent color, clean sans-serif typography, essential elements only, zen-like simplicity and clarity',

  // Seasonal presets
  'christmas': 'Christmas holiday theme, red and green colors, snow elements, warm golden lighting, festive decorations, cozy winter atmosphere, candy canes and ornaments',
  'lunar-new-year': 'Lunar New Year celebration theme, red and gold dominant colors, traditional lanterns, cherry blossoms, auspicious symbols, festive and prosperous atmosphere',
  'summer': 'Bright summer theme, warm sunny colors, blue skies, tropical vibes, fresh and energetic, outdoor lifestyle feel, vibrant greens and ocean blues',

  // Social media presets
  'instagram-post': 'Designed for Instagram post format (1080x1080 square), eye-catching visual that stops scrolling, bold text readable at thumbnail size, vibrant colors, strong focal point, social media optimized',
  'twitter-header': 'Designed for Twitter/X header banner (1500x500 wide format), professional banner with brand identity, clean composition that works with profile picture overlay on left, subtle patterns or gradients',
  'youtube-thumb': 'Designed for YouTube thumbnail (1280x720), extremely eye-catching, bold large text readable at small size, expressive imagery, high contrast colors, click-worthy composition, faces or reactions work well',
};

export function getPresetNames(): string[] {
  return Object.keys(STYLE_PRESETS);
}

export function applyPreset(prompt: string, preset: string): string {
  const suffix = STYLE_PRESETS[preset];
  if (!suffix) return prompt;
  return prompt + suffix;
}
