import { ImageProvider } from './base.js';
import type { ImageGenerationRequest, ImageGenerationResult, ProviderInfo } from '../types/index.js';

export class PollinationsProvider extends ImageProvider {
  private baseUrl = 'https://image.pollinations.ai';

  get info(): ProviderInfo {
    return {
      name: 'pollinations',
      displayName: 'Pollinations.AI (Free)',
      description: 'Free, open-source image generation. No API key needed.',
      requiresKey: false,
      website: 'https://pollinations.ai/',
      models: ['flux', 'flux-realism', 'flux-anime', 'flux-3d', 'turbo'],
    };
  }

  configure(_apiKey: string): void {
    // No key needed
  }

  isConfigured(): boolean {
    return true; // Always configured - no key needed
  }

  async validate(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/prompt/test?width=64&height=64&nologo=true`, {
        method: 'HEAD',
      });
      return response.ok || response.status === 200;
    } catch {
      return false;
    }
  }

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const startTime = Date.now();
    const model = request.model || 'flux';
    const w = request.width || 1024;
    const h = request.height || 1024;
    const count = request.count || 1;

    const images: Array<{ base64?: string; url?: string }> = [];

    for (let i = 0; i < count; i++) {
      const encodedPrompt = encodeURIComponent(request.prompt);
      const seed = request.seed !== undefined ? request.seed + i : Math.floor(Math.random() * 999999);
      const url = `${this.baseUrl}/prompt/${encodedPrompt}?model=${model}&width=${w}&height=${h}&seed=${seed}&nologo=true&enhance=true`;

      let lastError: Error | null = null;
      let response: Response | null = null;

      // Retry up to 2 times for transient errors, with 90s timeout per attempt
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 90000);
          response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeout);
          if (response.ok) break;
          if (response.status >= 500 && attempt < 1) {
            await new Promise(r => setTimeout(r, 3000));
            continue;
          }
          throw new Error(`Pollinations API error (${response.status}): ${response.statusText}`);
        } catch (err: any) {
          lastError = err.name === 'AbortError'
            ? new Error('Pollinations API: Request timed out (90s). The service may be slow or unavailable.')
            : err;
          if (attempt < 1) {
            await new Promise(r => setTimeout(r, 3000));
          }
        }
      }

      if (!response || !response.ok) {
        throw lastError || new Error('Pollinations API: Failed after retries');
      }

      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      images.push({ base64, url });
    }

    const elapsed = Date.now() - startTime;

    return {
      images,
      provider: 'pollinations',
      model,
      elapsed,
      cost: 0,
      metadata: { free: true },
    };
  }

  async listModels(): Promise<string[]> {
    return this.info.models;
  }
}
