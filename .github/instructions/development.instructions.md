---
applyTo: "**/*.ts"
---

# ImgForge Development Instructions

This is the **ImgForge CLI** project — a multi-provider AI image generation, editing, upscaling, and manipulation tool.

## Architecture

### Providers (`src/providers/`)
- `base.ts` — Abstract `ImageProvider` class with required `generate()` and optional `edit()`, `upscale()`, `removeBackground()`, `vary()` methods
- `openai.ts` — OpenAI DALL-E (generate, edit, vary)
- `gemini.ts` — Google Gemini/Nano Banana/Imagen (generate, edit)
- `stability.ts` — Stability AI (generate, edit, upscale, removeBackground)
- `pollinations.ts` — Pollinations free (generate only)
- `replicate.ts` — Replicate community models (generate only)
- `index.ts` — Provider registry & factory

### Core (`src/core/`)
- `config.ts` — Config at `~/.imgforge/config.json`, extended with cost, autoOpen, plugins, templates
- `history.ts` — Generation history log
- `output.ts` — Image saving and file management
- `presets.ts` — 15 style presets as prompt suffixes
- `ratios.ts` — 17 named aspect ratio presets + custom W:H parsing
- `pricing.ts` — Per-provider/model cost estimation with special HD/wide pricing
- `templates.ts` — Template CRUD with `{variable}` rendering
- `opener.ts` — Cross-platform file opener

### CLI Commands (`src/cli/commands/`)
- `generate.ts` — Main command with --ratio, --preset, --template, --var, --enhance, --open
- `edit.ts` — img2img / inpainting
- `upscale.ts` — AI upscaling 2x-4x
- `removebg.ts` — Background removal → transparent PNG
- `vary.ts` — Image variations
- `batch.ts` — YAML/JSON-driven batch generation
- `compare.ts` — Multi-provider comparison
- `template.ts` — Template save/list/show/delete
- `cost.ts` — Cost tracking (summary/budget/pricing/export/reset)
- `convert.ts` — Format conversion
- `history.ts` — History list + redo

### Types (`src/types/`)
- `provider.ts` — ImageGenerationRequest, ImageEditRequest, ImageUpscaleRequest, ImageVariationRequest, ProviderCapabilities
- `config.ts` — AppConfig, TemplateEntry, CostConfig

## Adding a New Provider

1. Create `src/providers/<name>.ts` extending `ImageProvider`
2. Implement required: `info`, `configure()`, `isConfigured()`, `validate()`, `generate()`, `listModels()`
3. Implement optional: `edit()`, `upscale()`, `removeBackground()`, `vary()` as supported
4. Register in `src/providers/index.ts` providerRegistry Map
5. Add default config entry in `src/core/config.ts` DEFAULT_CONFIG
6. Add pricing in `src/core/pricing.ts`

## Adding a New Command

1. Create `src/cli/commands/<name>.ts` exporting a function that takes Commander `program`
2. Register in `src/index.ts`

## Conventions

- ESM modules (`"type": "module"` in package.json)
- All imports use `.js` extension (TypeScript ESM requirement)
- Dynamic imports for chalk/ora (ESM-only packages): `const chalk = (await import('chalk')).default`
- Node.js 20+ required (inquirer uses `styleText` from `node:util`)
- No external HTTP dependencies — use built-in `fetch`
- File uploads use `new Blob([buffer])` with FormData (not File)
- Provider registry type: `Map<string, () => ImageProvider>`

## CI/CD

- GitHub CI builds on push (`.github/workflows/ci.yml`)
- npm publish is automatic via GitHub Release (`.github/workflows/publish.yml`)
- NPM_TOKEN stored as GitHub repo secret — never commit tokens
