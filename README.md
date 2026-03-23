# 🎨 ImgForge - AI Image Generator CLI

Multi-provider, multi-model AI image generation from your terminal.

## Features

- **5 Providers**: OpenAI (DALL-E 3), Google Gemini (Imagen), Stability AI (SD3/SDXL), Replicate (Flux), Pollinations (Free)
- **Simple CLI**: `imgforge generate "your prompt"` → saves image to disk
- **Interactive Mode**: Menu-driven UI for step-by-step generation
- **Multi-model**: Switch between models with `-m` flag
- **Config System**: Persistent API key and default management
- **Generation History**: JSON log of all generated images
- **Retry Logic**: Auto-retry on transient API failures
- **Zero Signup for Free**: Pollinations provider works without API key

## Quick Start

```bash
# Install
cd imgforge && npm install && npm run build

# Generate with free provider (no API key needed!)
imgforge generate "a beautiful sunset over mountains"

# Or configure a paid provider for better quality
imgforge config set openai.apiKey sk-your-key-here
imgforge generate "a cat wearing sunglasses" -p openai -m dall-e-3
```

## Installation

```bash
git clone <repo>
cd imgforge
npm install
npm run build
npm link   # makes 'imgforge' available globally
```

## Commands

### Generate Images

```bash
# Basic generation (uses default provider - Pollinations free)
imgforge generate "a futuristic cityscape"

# Choose provider and model
imgforge generate "portrait photo" -p openai -m dall-e-3
imgforge generate "anime girl" -p gemini -m gemini-2.0-flash-preview-image-generation
imgforge generate "landscape" -p stability -m sd3-large
imgforge generate "abstract art" -p replicate -m black-forest-labs/flux-1.1-pro

# Custom size and output
imgforge generate "app icon" -W 512 -H 512 -o ./assets/icon.png

# High quality
imgforge generate "product photo" -q hd

# Multiple images
imgforge generate "logo variations" -n 4

# With negative prompt
imgforge generate "clean portrait" --negative "blurry, low quality, watermark"

# Reproducible with seed
imgforge generate "test image" --seed 42
```

### Configure API Keys

```bash
# Set API keys (stored in ~/.imgforge/config.json)
imgforge config set openai.apiKey sk-xxxxx
imgforge config set gemini.apiKey AIzaSyyyy
imgforge config set stability.apiKey sk-stab-zzzzz
imgforge config set replicate.apiKey r8_xxxxx

# Set defaults
imgforge config set defaults.provider openai
imgforge config set defaults.width 1792
imgforge config set defaults.height 1024

# View all config
imgforge config list

# Get specific value
imgforge config get openai.apiKey
```

### Manage Providers

```bash
# List all providers with status
imgforge providers list

# Test provider connection
imgforge providers test openai
imgforge providers test --all

# List available models
imgforge providers models openai
imgforge providers models gemini
```

### View History

```bash
imgforge history list
imgforge history list -n 20
imgforge history show <id>
imgforge history clear
```

### Interactive Mode

```bash
imgforge interactive
# or
imgforge i
```

## Providers

| Provider | Models | API Key | Free Tier | Website |
|----------|--------|---------|-----------|---------|
| **OpenAI** | DALL-E 3, DALL-E 2, gpt-image-1 | Required | $5 credit | [platform.openai.com](https://platform.openai.com/api-keys) |
| **Gemini** | Gemini Flash Image, Imagen 3 | Required | Free tier | [ai.google.dev](https://ai.google.dev/) |
| **Stability** | SD3, SDXL, Stable Image | Required | 25 credits | [platform.stability.ai](https://platform.stability.ai/account/keys) |
| **Replicate** | Flux 1.1 Pro, Flux Schnell, SDXL | Required | Free tier | [replicate.com](https://replicate.com/account/api-tokens) |
| **Pollinations** | Flux, Flux Realism, Turbo | **Not needed** | **Unlimited free** | [pollinations.ai](https://pollinations.ai/) |

## Config File

Stored at `~/.imgforge/config.json`:

```json
{
  "providers": {
    "openai": { "apiKey": "sk-...", "enabled": true },
    "gemini": { "apiKey": "AIza...", "enabled": true },
    "pollinations": { "enabled": true }
  },
  "defaults": {
    "provider": "pollinations",
    "width": 1024,
    "height": 1024,
    "quality": "standard",
    "format": "png"
  },
  "output": {
    "directory": "./imgforge-output",
    "namingPattern": "{provider}-{model}-{timestamp}"
  }
}
```

## Requirements

- Node.js 18+

## License

MIT
