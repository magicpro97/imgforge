import { ImageProvider } from './base.js';
import { replicateRunModel, replicateDownloadOutput, replicateValidateApiKey } from '@magicpro97/forge-core';
import type { ImageGenerationRequest, ImageGenerationResult, ProviderInfo } from '../types/index.js';

export class ReplicateProvider extends ImageProvider {
  private apiKey: string = '';

  get info(): ProviderInfo {
    return {
      name: 'replicate',
      displayName: 'Replicate (Flux & Community Models)',
      description: 'Flux, SDXL, and thousands of community models via Replicate',
      requiresKey: true,
      website: 'https://replicate.com/account/api-tokens',
      models: ['black-forest-labs/flux-1.1-pro', 'black-forest-labs/flux-schnell', 'stability-ai/sdxl'],
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
    return replicateValidateApiKey({ apiKey: this.apiKey });
  }

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    if (!this.apiKey) throw new Error('Replicate API key not configured. Run: imgforge config set replicate.apiKey <key>');

    const startTime = Date.now();
    const model = request.model || 'black-forest-labs/flux-1.1-pro';

    const w = request.width || 1024;
    const h = request.height || 1024;

    const prediction = await replicateRunModel(
      { apiKey: this.apiKey },
      model,
      {
        prompt: request.prompt,
        width: w,
        height: h,
        num_outputs: request.count || 1,
        ...(request.seed !== undefined ? { seed: request.seed } : {}),
      },
    );

    const elapsed = Date.now() - startTime;
    const output = Array.isArray(prediction.output) ? prediction.output : [prediction.output];

    // Download images
    const images = await Promise.all(
      (output as string[]).filter(Boolean).map(async (url: string) => {
        try {
          const buffer = await replicateDownloadOutput(url);
          return { base64: buffer.toString('base64'), url };
        } catch {
          return { url };
        }
      })
    );

    return {
      images,
      provider: 'replicate',
      model,
      elapsed,
      metadata: { predictionId: prediction.id },
    };
  }

  async listModels(): Promise<string[]> {
    return this.info.models;
  }
}
