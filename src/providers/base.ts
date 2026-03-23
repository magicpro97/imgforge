import type { ImageGenerationRequest, ImageGenerationResult, ImageEditRequest, ImageUpscaleRequest, ImageVariationRequest, ProviderInfo } from '../types/index.js';

export abstract class ImageProvider {
  abstract get info(): ProviderInfo;

  abstract configure(apiKey: string): void;
  abstract isConfigured(): boolean;
  abstract validate(): Promise<boolean>;
  abstract generate(request: ImageGenerationRequest): Promise<ImageGenerationResult>;
  abstract listModels(): Promise<string[]>;

  // Optional capabilities — override in subclasses
  async edit(_request: ImageEditRequest): Promise<ImageGenerationResult> {
    throw new Error(`${this.info.name} does not support image editing`);
  }

  async upscale(_request: ImageUpscaleRequest): Promise<ImageGenerationResult> {
    throw new Error(`${this.info.name} does not support upscaling`);
  }

  async removeBackground(_inputImage: string): Promise<ImageGenerationResult> {
    throw new Error(`${this.info.name} does not support background removal`);
  }

  async vary(_request: ImageVariationRequest): Promise<ImageGenerationResult> {
    throw new Error(`${this.info.name} does not support variations`);
  }
}
