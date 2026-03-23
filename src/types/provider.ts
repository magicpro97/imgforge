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

export interface ImageEditRequest extends ImageGenerationRequest {
  inputImage: string;   // file path to source image
  mask?: string;        // file path to mask (transparent = edit area)
  strength?: number;    // 0.0-1.0, how much to change (img2img)
}

export interface ImageUpscaleRequest {
  inputImage: string;   // file path
  scale?: '2x' | '4x';
  prompt?: string;      // creative guidance for upscaling
  creativity?: number;  // 0.0-1.0
  format?: 'png' | 'jpg' | 'webp';
}

export interface ImageVariationRequest {
  inputImage: string;
  count?: number;
  strength?: number;    // how different from original
  prompt?: string;      // optional guidance
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
  capabilities?: ProviderCapabilities;
}

export interface ProviderCapabilities {
  edit?: boolean;
  upscale?: boolean;
  removeBackground?: boolean;
  variations?: boolean;
}
