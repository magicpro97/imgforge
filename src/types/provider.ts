export interface ImageGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  model?: string;
  style?: string;
  quality?: 'standard' | 'hd' | 'ultra';
  count?: number;
  seed?: number;
  format?: 'png' | 'jpg' | 'webp';
}

export interface GeneratedImage {
  url?: string;
  base64?: string;
  localPath?: string;
  revisedPrompt?: string;
}

export interface ImageGenerationResult {
  images: GeneratedImage[];
  provider: string;
  model: string;
  elapsed: number;
  cost?: number;
  metadata: Record<string, unknown>;
}

export interface ProviderInfo {
  name: string;
  displayName: string;
  description: string;
  requiresKey: boolean;
  website: string;
  models: string[];
}
