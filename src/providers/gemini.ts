import { ImageProvider } from './base.js';
import type { ImageGenerationRequest, ImageGenerationResult, ProviderInfo } from '../types/index.js';

export class GeminiProvider extends ImageProvider {
  private apiKey: string = '';
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  get info(): ProviderInfo {
    return {
      name: 'gemini',
      displayName: 'Google Gemini (Imagen)',
      description: 'Gemini Flash Image, Imagen 3/4 from Google',
      requiresKey: true,
      website: 'https://ai.google.dev/',
      models: ['gemini-2.0-flash-preview-image-generation', 'imagen-3.0-generate-002'],
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
    const model = request.model || 'gemini-2.0-flash-preview-image-generation';

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

    const body = {
      contents: [{
        parts: [{ text: request.prompt }],
      }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
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
}
