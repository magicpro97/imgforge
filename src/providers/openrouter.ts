import { ImageProvider } from './base.js';
import { openrouterGenerateImage } from '@magicpro97/forge-core';
import type { ImageGenerationRequest, ImageGenerationResult, ProviderInfo } from '../types/index.js';

export class OpenRouterProvider extends ImageProvider {
  private apiKey: string = '';

  get info(): ProviderInfo {
    return {
      name: 'openrouter',
      displayName: 'OpenRouter (Multi-Model Gateway)',
      description: 'Access multiple image models through OpenRouter API gateway',
      requiresKey: true,
      website: 'https://openrouter.ai/keys',
      models: ['openai/gpt-image-1', 'google/gemini-2.0-flash-exp:free'],
    };
  }

  configure(apiKey: string): void {
    this.apiKey = apiKey;
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  async validate(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    if (!this.apiKey) throw new Error('OpenRouter API key not configured. Run: imgforge config set openrouter.apiKey <key>');

    const startTime = Date.now();
    const model = request.model || 'openai/gpt-image-1';

    const result = await openrouterGenerateImage({
      apiKey: this.apiKey,
      model,
      prompt: request.prompt,
      width: request.width,
      height: request.height,
      count: request.count,
    });

    const elapsed = Date.now() - startTime;

    return {
      images: result.images,
      provider: 'openrouter',
      model: result.model,
      elapsed,
      metadata: {},
    };
  }

  async listModels(): Promise<string[]> {
    return this.info.models;
  }
}
