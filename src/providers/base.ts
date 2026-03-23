import type { ImageGenerationRequest, ImageGenerationResult, ProviderInfo } from '../types/index.js';

export abstract class ImageProvider {
  abstract get info(): ProviderInfo;

  abstract configure(apiKey: string): void;
  abstract isConfigured(): boolean;
  abstract validate(): Promise<boolean>;
  abstract generate(request: ImageGenerationRequest): Promise<ImageGenerationResult>;
  abstract listModels(): Promise<string[]>;
}
