import * as fs from 'node:fs';

export interface BrandKit {
  name?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
  };
  style?: string; // e.g., "modern minimalist", "playful colorful"
  tone?: string;  // e.g., "professional", "friendly", "luxurious"
  avoid?: string[]; // e.g., ["dark themes", "comic style"]
}

export function loadBrandKit(path: string): BrandKit {
  if (!fs.existsSync(path)) {
    throw new Error(`Brand kit file not found: ${path}`);
  }
  const content = fs.readFileSync(path, 'utf-8');
  return JSON.parse(content) as BrandKit;
}

export function brandKitToPrompt(kit: BrandKit): string {
  const parts: string[] = ['BRAND CONSISTENCY RULES:'];

  if (kit.colors) {
    const colorParts: string[] = [];
    if (kit.colors.primary) colorParts.push(`primary: ${kit.colors.primary}`);
    if (kit.colors.secondary) colorParts.push(`secondary: ${kit.colors.secondary}`);
    if (kit.colors.accent) colorParts.push(`accent: ${kit.colors.accent}`);
    if (kit.colors.background) colorParts.push(`background: ${kit.colors.background}`);
    if (kit.colors.text) colorParts.push(`text: ${kit.colors.text}`);
    if (colorParts.length > 0) {
      parts.push(`Use these exact brand colors: ${colorParts.join(', ')}.`);
    }
  }

  if (kit.style) parts.push(`Visual style: ${kit.style}.`);
  if (kit.tone) parts.push(`Tone and mood: ${kit.tone}.`);
  if (kit.name) parts.push(`Brand name: ${kit.name}.`);
  if (kit.avoid && kit.avoid.length > 0) {
    parts.push(`Avoid: ${kit.avoid.join(', ')}.`);
  }

  parts.push('Maintain visual coherence and brand identity across all generated images.');
  return parts.join(' ');
}
