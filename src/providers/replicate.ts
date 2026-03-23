import { ImageProvider } from './base.js';
import type { ImageGenerationRequest, ImageGenerationResult, ProviderInfo } from '../types/index.js';

export class ReplicateProvider extends ImageProvider {
  private apiKey: string = '';
  private baseUrl = 'https://api.replicate.com/v1';

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
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    if (!this.apiKey) throw new Error('Replicate API key not configured. Run: imgforge config set replicate.apiKey <key>');

    const startTime = Date.now();
    const model = request.model || 'black-forest-labs/flux-1.1-pro';

    const w = request.width || 1024;
    const h = request.height || 1024;

    // Create prediction
    const createResponse = await fetch(`${this.baseUrl}/models/${model}/predictions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        Prefer: 'wait',
      },
      body: JSON.stringify({
        input: {
          prompt: request.prompt,
          width: w,
          height: h,
          num_outputs: request.count || 1,
          ...(request.seed !== undefined ? { seed: request.seed } : {}),
        },
      }),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}));
      const msg = (errorData as any)?.detail || createResponse.statusText;
      throw new Error(`Replicate API error (${createResponse.status}): ${msg}`);
    }

    let prediction: any = await createResponse.json();

    // Poll for completion if not using Prefer: wait
    while (prediction.status === 'starting' || prediction.status === 'processing') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const pollResponse = await fetch(prediction.urls.get, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      prediction = await pollResponse.json();
    }

    if (prediction.status === 'failed') {
      throw new Error(`Replicate generation failed: ${prediction.error || 'Unknown error'}`);
    }

    const elapsed = Date.now() - startTime;
    const output = Array.isArray(prediction.output) ? prediction.output : [prediction.output];

    // Download images
    const images = await Promise.all(
      output.filter(Boolean).map(async (url: string) => {
        try {
          const imgResponse = await fetch(url);
          const buffer = await imgResponse.arrayBuffer();
          return { base64: Buffer.from(buffer).toString('base64'), url };
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
