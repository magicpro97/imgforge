---
description: Expert ImgForge developer agent. Extends ImgForge CLI with new providers, skills, features, and bug fixes.
tools:
  - powershell
  - view
  - edit
  - create
  - glob
  - grep
---

# ImgForge Developer Agent

You are an expert developer for the ImgForge CLI project at `F:\Code\tools\imgforge`.

## Quick Reference

- **Build**: `npm run build` (runs `tsc`)
- **Run**: `node dist/index.js <command>`
- **Test CLI**: `node dist/index.js providers list`
- **Publish**: Push to GitHub → create release → CI auto-publishes to npm

## Key Files

| File | Purpose |
|------|---------|
| `src/providers/base.ts` | Abstract `ImageProvider` with optional edit/upscale/removeBackground/vary |
| `src/providers/index.ts` | Provider registry & factory |
| `src/core/config.ts` | Config management (`~/.imgforge/config.json`) |
| `src/core/output.ts` | Image file saving |
| `src/core/history.ts` | Generation history |
| `src/core/presets.ts` | 15 style presets (photorealistic, anime, neon, etc.) |
| `src/core/ratios.ts` | 17 aspect ratio presets (16:9, phone, og-image, etc.) |
| `src/core/pricing.ts` | Per-provider/model cost estimation |
| `src/core/templates.ts` | Template CRUD + variable rendering |
| `src/core/opener.ts` | Cross-platform file opener |
| `src/cli/commands/generate.ts` | Main generate command (--ratio, --preset, --template, --enhance, --open) |
| `src/cli/commands/edit.ts` | img2img / inpainting |
| `src/cli/commands/upscale.ts` | AI upscaling (Stability) |
| `src/cli/commands/removebg.ts` | Background removal (Stability) |
| `src/cli/commands/vary.ts` | Image variations (OpenAI) |
| `src/cli/commands/batch.ts` | YAML-driven batch generation |
| `src/cli/commands/compare.ts` | Multi-provider comparison |
| `src/cli/commands/template.ts` | Template save/list/show/delete |
| `src/cli/commands/cost.ts` | Cost tracking & budget alerts |
| `src/cli/commands/convert.ts` | Format conversion |
| `src/cli/interactive.ts` | Interactive menu mode |
| `src/index.ts` | CLI entry point (14 commands) |
| `src/types/provider.ts` | All interfaces: ImageEditRequest, ImageUpscaleRequest, ImageVariationRequest, ProviderCapabilities |
| `src/types/config.ts` | AppConfig with cost, autoOpen, plugins, templates |

## Adding a New Provider

Follow this pattern:

```typescript
import { ImageProvider } from './base.js';
import type { ImageGenerationRequest, ImageGenerationResult, ProviderInfo } from '../types/index.js';

export class NewProvider extends ImageProvider {
  private apiKey: string = '';

  get info(): ProviderInfo {
    return {
      name: 'newprovider',
      displayName: 'New Provider Display Name',
      description: 'Description here',
      requiresKey: true,
      website: 'https://example.com',
      models: ['model-1', 'model-2'],
    };
  }

  configure(apiKey: string): void { this.apiKey = apiKey; }
  isConfigured(): boolean { return this.apiKey.length > 0; }

  async validate(): Promise<boolean> { /* Test API connection */ }
  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> { /* Call API */ }
  async listModels(): Promise<string[]> { return this.info.models; }

  // Optional capabilities (implement as needed):
  // async edit(request: ImageEditRequest): Promise<ImageGenerationResult> { }
  // async upscale(request: ImageUpscaleRequest): Promise<ImageGenerationResult> { }
  // async removeBackground(imagePath: string): Promise<Buffer> { }
  // async vary(request: ImageVariationRequest): Promise<ImageGenerationResult> { }
}
```

Register in `src/providers/index.ts` and add capabilities to `ProviderCapabilities`.

## Provider Capabilities Matrix

| Provider | generate | edit | upscale | removeBackground | vary |
|----------|----------|------|---------|-----------------|------|
| Pollinations | ✅ | ❌ | ❌ | ❌ | ❌ |
| Gemini | ✅ | ✅ | ❌ | ❌ | ❌ |
| OpenAI | ✅ | ✅ | ❌ | ❌ | ✅ |
| Stability | ✅ | ✅ | ✅ | ✅ | ❌ |
| Replicate | ✅ | ❌ | ❌ | ❌ | ❌ |

## CI/CD

- **CI**: `.github/workflows/ci.yml` — build + verify on push
- **Publish**: `.github/workflows/publish.yml` — triggered by GitHub Release → auto-publishes to npm
- **NPM_TOKEN**: stored as GitHub repo secret

## Build & Verify Checklist

1. `npm run build` — must compile clean
2. `node dist/index.js --version` — prints version
3. `node dist/index.js providers list` — shows all providers
4. `node dist/index.js config list` — shows config
5. `node dist/index.js --help` — shows all 14 commands
