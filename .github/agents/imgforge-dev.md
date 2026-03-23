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

## Key Files

| File | Purpose |
|------|---------|
| `src/providers/base.ts` | Abstract `ImageProvider` class |
| `src/providers/index.ts` | Provider registry & factory |
| `src/core/config.ts` | Config management (`~/.imgforge/config.json`) |
| `src/core/output.ts` | Image file saving |
| `src/core/history.ts` | Generation history |
| `src/cli/commands/generate.ts` | Main `generate` command |
| `src/cli/interactive.ts` | Interactive menu mode |
| `src/index.ts` | CLI entry point |

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

  async validate(): Promise<boolean> {
    // Test API connection
  }

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    // Call API, return base64 images
  }

  async listModels(): Promise<string[]> { return this.info.models; }
}
```

Then register in `src/providers/index.ts`.

## Build & Verify Checklist

1. `npm run build` — must compile clean
2. `node dist/index.js --version` — prints version
3. `node dist/index.js providers list` — shows all providers
4. `node dist/index.js config list` — shows config
