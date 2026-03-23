import * as fs from 'node:fs';
import { ImageProvider } from './base.js';
import type { ImageGenerationRequest, ImageGenerationResult, ImageEditRequest, ProviderInfo } from '../types/index.js';

export class GeminiProvider extends ImageProvider {
  private apiKey: string = '';
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  // Nano Banana models use IMAGE-only responseModalities for better results
  private nanoBananaModels = new Set([
    'gemini-2.5-flash-image',
    'gemini-3.1-flash-image-preview',
  ]);

  get info(): ProviderInfo {
    return {
      name: 'gemini',
      displayName: 'Google Gemini (Nano Banana / Imagen)',
      description: 'Nano Banana 2, Gemini Flash Image, Imagen 4/3 from Google DeepMind',
      requiresKey: true,
      website: 'https://ai.google.dev/',
      models: [
        'gemini-2.5-flash-image',               // Nano Banana — best balance
        'gemini-3.1-flash-image-preview',        // Nano Banana 2 — latest & most powerful
        'gemini-2.0-flash-preview-image-generation', // Legacy Gemini Flash
        'imagen-4.0-generate-001',               // Imagen 4 — high fidelity
        'imagen-4.0-ultra-generate-001',         // Imagen 4 Ultra — maximum quality
        'imagen-3.0-generate-002',               // Imagen 3
      ],
      capabilities: { edit: true },
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
      const url = `${this.baseUrl}/models?key=${this.apiKey}`;
      const response = await fetch(url);
      return response.ok;
    } catch {
      return false;
    }
  }

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    if (!this.apiKey) throw new Error('Gemini API key not configured. Run: imgforge config set gemini.apiKey <key>');

    const startTime = Date.now();
    const model = request.model || 'gemini-2.5-flash-image';

    if (model.startsWith('imagen')) {
      return this.generateWithImagen(request, model, startTime);
    }

    return this.generateWithGemini(request, model, startTime);
  }

  private async generateWithGemini(
    request: ImageGenerationRequest,
    model: string,
    startTime: number
  ): Promise<ImageGenerationResult> {
    const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;

    // Nano Banana models work best with IMAGE-only modality
    const isNanoBanana = this.nanoBananaModels.has(model);
    const responseModalities = isNanoBanana ? ['IMAGE'] : ['TEXT', 'IMAGE'];

    const body: Record<string, unknown> = {
      contents: [{
        parts: [{ text: request.prompt }],
      }],
      generationConfig: {
        responseModalities,
        ...(isNanoBanana && request.width && request.height
          ? { imageConfig: { aspectRatio: this.getAspectRatio(request.width, request.height) } }
          : {}),
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = (errorData as any)?.error?.message || response.statusText;
      throw new Error(`Gemini API error (${response.status}): ${msg}`);
    }

    const data: any = await response.json();
    const elapsed = Date.now() - startTime;
    const images: Array<{ base64?: string; revisedPrompt?: string }> = [];

    for (const candidate of data.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.inlineData?.mimeType?.startsWith('image/')) {
          images.push({ base64: part.inlineData.data });
        }
      }
    }

    if (images.length === 0) {
      throw new Error('Gemini returned no images. The model may have declined the prompt or the response format was unexpected.');
    }

    return {
      images,
      provider: 'gemini',
      model,
      elapsed,
      metadata: {},
    };
  }

  private async generateWithImagen(
    request: ImageGenerationRequest,
    model: string,
    startTime: number
  ): Promise<ImageGenerationResult> {
    const url = `${this.baseUrl}/models/${model}:predict?key=${this.apiKey}`;

    const body = {
      instances: [{ prompt: request.prompt }],
      parameters: {
        sampleCount: Math.min(request.count || 1, 4),
        aspectRatio: this.getAspectRatio(request.width, request.height),
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = (errorData as any)?.error?.message || response.statusText;
      throw new Error(`Imagen API error (${response.status}): ${msg}`);
    }

    const data: any = await response.json();
    const elapsed = Date.now() - startTime;

    const images = (data.predictions || []).map((pred: any) => ({
      base64: pred.bytesBase64Encoded,
    }));

    if (images.length === 0) {
      throw new Error('Imagen returned no images.');
    }

    return {
      images,
      provider: 'gemini',
      model,
      elapsed,
      metadata: {},
    };
  }

  private getAspectRatio(w?: number, h?: number): string {
    if (!w || !h) return '1:1';
    const ratio = w / h;
    if (ratio > 1.7) return '16:9';
    if (ratio > 1.3) return '4:3';
    if (ratio < 0.6) return '9:16';
    if (ratio < 0.77) return '3:4';
    return '1:1';
  }

  async listModels(): Promise<string[]> {
    return this.info.models;
  }

  async edit(request: ImageEditRequest): Promise<ImageGenerationResult> {
    if (!this.apiKey) throw new Error('Gemini API key not configured');
    const startTime = Date.now();
    const model = request.model || 'gemini-2.5-flash-image';

    const imageBuffer = fs.readFileSync(request.inputImage);
    const imageBase64 = imageBuffer.toString('base64');
    const mimeType = request.inputImage.endsWith('.png') ? 'image/png' : 'image/jpeg';

    const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;
    const body = {
      contents: [{
        parts: [
          { text: request.prompt },
          { inlineData: { mimeType, data: imageBase64 } },
        ],
      }],
      generationConfig: {
        responseModalities: ['IMAGE'],
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Gemini edit error (${response.status}): ${(err as any)?.error?.message || response.statusText}`);
    }

    const data: any = await response.json();
    const images: Array<{ base64?: string }> = [];

    for (const candidate of data.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.inlineData?.mimeType?.startsWith('image/')) {
          images.push({ base64: part.inlineData.data });
        }
      }
    }

    if (images.length === 0) throw new Error('Gemini returned no images for edit');

    return {
      images, provider: 'gemini', model,
      elapsed: Date.now() - startTime, metadata: {},
    };
  }
}
