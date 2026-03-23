import * as fs from 'node:fs';
import { ImageProvider } from './base.js';
import type { ImageGenerationRequest, ImageGenerationResult, ImageEditRequest, ImageVariationRequest, ProviderInfo } from '../types/index.js';

export class OpenAIProvider extends ImageProvider {
  private apiKey: string = '';
  private baseUrl = 'https://api.openai.com/v1';

  get info(): ProviderInfo {
    return {
      name: 'openai',
      displayName: 'OpenAI (DALL-E / GPT Image)',
      description: 'DALL-E 3, gpt-image-1 from OpenAI',
      requiresKey: true,
      website: 'https://platform.openai.com/api-keys',
      models: ['dall-e-3', 'dall-e-2', 'gpt-image-1'],
      capabilities: { edit: true, variations: true },
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
    if (!this.apiKey) throw new Error('OpenAI API key not configured. Run: imgforge config set openai.apiKey <key>');

    const startTime = Date.now();
    const model = request.model || 'dall-e-3';

    const sizeMap: Record<string, string[]> = {
      'dall-e-3': ['1024x1024', '1792x1024', '1024x1792'],
      'dall-e-2': ['256x256', '512x512', '1024x1024'],
      'gpt-image-1': ['1024x1024', '512x512', '256x256'],
    };

    const w = request.width || 1024;
    const h = request.height || 1024;
    const sizeStr = `${w}x${h}`;
    const validSizes = sizeMap[model] || sizeMap['dall-e-3'];
    const size = validSizes.includes(sizeStr) ? sizeStr : validSizes[0];

    const body: Record<string, unknown> = {
      model,
      prompt: request.prompt,
      n: Math.min(request.count || 1, model === 'dall-e-3' ? 1 : 4),
      size,
      response_format: 'b64_json',
    };

    if (model === 'dall-e-3' && request.quality === 'hd') {
      body.quality = 'hd';
    }

    const response = await fetch(`${this.baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = (errorData as any)?.error?.message || response.statusText;
      throw new Error(`OpenAI API error (${response.status}): ${msg}`);
    }

    const data: any = await response.json();
    const elapsed = Date.now() - startTime;

    return {
      images: data.data.map((img: any) => ({
        base64: img.b64_json,
        url: img.url,
        revisedPrompt: img.revised_prompt,
      })),
      provider: 'openai',
      model,
      elapsed,
      metadata: {},
    };
  }

  async listModels(): Promise<string[]> {
    return this.info.models;
  }

  async edit(request: ImageEditRequest): Promise<ImageGenerationResult> {
    if (!this.apiKey) throw new Error('OpenAI API key not configured');
    const startTime = Date.now();
    const model = request.model || 'gpt-image-1';

    const formData = new FormData();
    const imageBuffer = fs.readFileSync(request.inputImage);
    formData.append('image', new Blob([imageBuffer]), 'image.png');
    if (request.mask) {
      const maskBuffer = fs.readFileSync(request.mask);
      formData.append('mask', new Blob([maskBuffer]), 'mask.png');
    }
    formData.append('prompt', request.prompt);
    formData.append('model', model);
    formData.append('response_format', 'b64_json');
    formData.append('n', '1');

    const response = await fetch(`${this.baseUrl}/images/edits`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`OpenAI edit error (${response.status}): ${(err as any)?.error?.message || response.statusText}`);
    }

    const data: any = await response.json();
    return {
      images: data.data.map((img: any) => ({ base64: img.b64_json, revisedPrompt: img.revised_prompt })),
      provider: 'openai', model, elapsed: Date.now() - startTime, metadata: {},
    };
  }

  async vary(request: ImageVariationRequest): Promise<ImageGenerationResult> {
    if (!this.apiKey) throw new Error('OpenAI API key not configured');
    const startTime = Date.now();

    const formData = new FormData();
    const imageBuffer = fs.readFileSync(request.inputImage);
    formData.append('image', new Blob([imageBuffer]), 'image.png');
    formData.append('model', 'dall-e-2');
    formData.append('n', String(Math.min(request.count || 4, 4)));
    formData.append('response_format', 'b64_json');

    const response = await fetch(`${this.baseUrl}/images/variations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`OpenAI variation error (${response.status}): ${(err as any)?.error?.message || response.statusText}`);
    }

    const data: any = await response.json();
    return {
      images: data.data.map((img: any) => ({ base64: img.b64_json })),
      provider: 'openai', model: 'dall-e-2', elapsed: Date.now() - startTime, metadata: {},
    };
  }
}
