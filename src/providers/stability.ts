import { ImageProvider } from './base.js';
import type { ImageGenerationRequest, ImageGenerationResult, ProviderInfo } from '../types/index.js';

export class StabilityProvider extends ImageProvider {
  private apiKey: string = '';
  private baseUrl = 'https://api.stability.ai/v2beta';

  get info(): ProviderInfo {
    return {
      name: 'stability',
      displayName: 'Stability AI (Stable Diffusion)',
      description: 'SDXL, SD3, Stable Image from Stability AI',
      requiresKey: true,
      website: 'https://platform.stability.ai/account/keys',
      models: ['sd3-large', 'sd3-medium', 'sd3-large-turbo', 'stable-image-core', 'stable-image-ultra'],
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
      const response = await fetch(`${this.baseUrl}/stable-image/generate/core`, {
        method: 'OPTIONS',
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      return response.status !== 401;
    } catch {
      return false;
    }
  }

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    if (!this.apiKey) throw new Error('Stability API key not configured. Run: imgforge config set stability.apiKey <key>');

    const startTime = Date.now();
    const model = request.model || 'sd3-large';

    const formData = new FormData();
    formData.append('prompt', request.prompt);
    if (request.negativePrompt) {
      formData.append('negative_prompt', request.negativePrompt);
    }

    const ratio = this.getAspectRatio(request.width, request.height);
    formData.append('aspect_ratio', ratio);
    formData.append('output_format', request.format || 'png');

    if (request.seed !== undefined) {
      formData.append('seed', String(request.seed));
    }

    let endpoint: string;
    if (model.startsWith('sd3')) {
      endpoint = `${this.baseUrl}/stable-image/generate/sd3`;
      formData.append('model', model);
    } else if (model === 'stable-image-ultra') {
      endpoint = `${this.baseUrl}/stable-image/generate/ultra`;
    } else {
      endpoint = `${this.baseUrl}/stable-image/generate/core`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/json',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = (errorData as any)?.message || (errorData as any)?.errors?.join(', ') || response.statusText;
      throw new Error(`Stability API error (${response.status}): ${msg}`);
    }

    const data: any = await response.json();
    const elapsed = Date.now() - startTime;

    return {
      images: [{
        base64: data.image,
      }],
      provider: 'stability',
      model,
      elapsed,
      metadata: { seed: data.seed, finishReason: data.finish_reason },
    };
  }

  private getAspectRatio(w?: number, h?: number): string {
    if (!w || !h) return '1:1';
    const ratio = w / h;
    if (ratio > 1.7) return '16:9';
    if (ratio > 1.3) return '4:3';
    if (ratio > 1.1) return '3:2';
    if (ratio < 0.6) return '9:16';
    if (ratio < 0.77) return '3:4';
    if (ratio < 0.9) return '2:3';
    return '1:1';
  }

  async listModels(): Promise<string[]> {
    return this.info.models;
  }
}
