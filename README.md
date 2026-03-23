# 🎨 ImgForge - AI Image Generator CLI

Multi-provider, multi-model AI image generation, editing, and processing from your terminal.

## Features

- **5 Providers**: OpenAI (DALL-E 3), Google Gemini (Nano Banana 2, Imagen 4), Stability AI (SD3), Replicate (Flux), Pollinations (Free)
- **30+ Models**: Switch between models with `-m` flag
- **Image Editing**: img2img, inpainting with `imgforge edit`
- **Upscaling**: 2x-4x AI upscaling with `imgforge upscale`
- **Background Removal**: Transparent PNGs with `imgforge remove-bg`
- **Image Variations**: Generate variations with `imgforge vary`
- **Batch Processing**: YAML-driven batch generation with `imgforge batch`
- **Prompt Templates**: Save & reuse prompts with variables
- **15 Style Presets**: photorealistic, anime, flat-design, watercolor, 3d-render, and more
- **17 Aspect Ratios**: 16:9, phone, og-image, instagram, story, and more
- **Cost Tracking**: Monitor API spending with budget alerts
- **Provider Comparison**: Compare same prompt across providers
- **Interactive Mode**: Menu-driven UI for step-by-step generation
- **Generation History**: JSON log with redo capability
- **Auto-Open**: Open images after generation
- **Prompt Enhancement**: AI-boosted prompts with `--enhance`
- **Zero Signup**: Pollinations provider works without API key

## Quick Start

```bash
# Install globally
npm install -g imgforge

# Generate with free provider (no API key needed!)
imgforge generate "a beautiful sunset over mountains"

# Use style presets and aspect ratios
imgforge generate "sunset" --preset photorealistic --ratio 16:9

# Configure a paid provider for better quality
imgforge config set gemini.apiKey AIzaSyxxx
imgforge generate "portrait" -p gemini -m gemini-2.5-flash-image
```

## Commands

### Generate Images

```bash
# Basic generation
imgforge generate "a futuristic cityscape"

# With style preset and ratio
imgforge generate "mountain landscape" --preset cinematic --ratio 16:9

# Choose provider and model
imgforge generate "portrait photo" -p openai -m dall-e-3
imgforge generate "anime girl" -p gemini -m gemini-2.5-flash-image
imgforge generate "realistic portrait" -p gemini -m gemini-3.1-flash-image-preview

# Custom size and output
imgforge generate "app icon" -W 512 -H 512 -o ./assets/icon.png

# With template
imgforge generate _ --template app-icon --var subject=weather --var color=blue

# Enhanced prompt
imgforge generate "cat" --enhance

# Auto-open after generation
imgforge generate "logo" --open
```

### Edit Images (img2img / Inpainting)

```bash
imgforge edit "make it look cyberpunk" --input photo.png -p gemini
imgforge edit "add sunglasses" --input face.png --mask mask.png -p openai
imgforge edit "change background to beach" --input portrait.png -p stability
```

### Upscale Images

```bash
imgforge upscale photo.png -s 4x -p stability
imgforge upscale photo.png --prompt "enhance details, vibrant" --creativity 0.3
```

### Remove Background

```bash
imgforge remove-bg product.png -o transparent.png
imgforge remove-bg logo.png -p stability
```

### Image Variations

```bash
imgforge vary logo.png -n 4 -p openai
imgforge vary design.png --strength 0.3 --prompt "warmer colors"
```

### Compare Providers

```bash
imgforge compare "sunset over mountains" -p openai,gemini,pollinations
```

### Batch Processing

```bash
imgforge batch assets.yaml
imgforge batch assets.yaml --dry-run
```

**Example `assets.yaml`:**
```yaml
defaults:
  provider: gemini
  model: gemini-2.5-flash-image
  quality: hd

images:
  - name: icon
    prompt: "minimalist weather app icon, flat design"
    size: 512x512
    output: ./assets/icon.png

  - name: banner
    prompt: "futuristic city skyline at sunset"
    ratio: 16:9
    output: ./assets/banner.png
```

### Prompt Templates

```bash
# Save template with variables
imgforge template save app-icon "minimalist {subject} app icon, {color} gradient, flat design"

# Use template
imgforge generate _ --template app-icon --var subject=weather --var color=blue

# List templates
imgforge template list
```

### Style Presets

Available: `photorealistic`, `anime`, `flat-design`, `watercolor`, `3d-render`, `pixel-art`, `logo`, `icon`, `cinematic`, `oil-painting`, `comic`, `sketch`, `neon`, `isometric`, `vintage`

```bash
imgforge generate "forest" --preset watercolor
imgforge generate "robot" --preset neon
```

### Aspect Ratios

Available: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `phone`, `desktop`, `og-image`, `twitter`, `instagram`, `story`, `favicon`, `banner`, `portrait`, `landscape`

```bash
imgforge generate "banner" --ratio 16:9
imgforge generate "app screenshot" --ratio phone
imgforge generate "social post" --ratio instagram
```

### Cost Tracking

```bash
imgforge cost summary           # monthly summary
imgforge cost pricing           # show all model prices
imgforge cost budget 10.00      # set $10/month budget
imgforge cost export costs.csv  # export to CSV
```

### Configure API Keys

```bash
imgforge config set openai.apiKey sk-xxxxx
imgforge config set gemini.apiKey AIzaSyyyy
imgforge config set stability.apiKey sk-stab-zzzzz
imgforge config set replicate.apiKey r8_xxxxx

# Set defaults
imgforge config set defaults.provider gemini
imgforge config set defaults.preset photorealistic
imgforge config set autoOpen true
```

### Interactive Mode

```bash
imgforge interactive
```

## Providers

| Provider | Models | API Key | Capabilities |
|----------|--------|---------|-------------|
| **Pollinations** | flux, flux-realism, flux-anime, turbo | **Not needed** | Generate |
| **Gemini** | Nano Banana 2, Imagen 4/3 | Required | Generate, Edit |
| **OpenAI** | DALL-E 3, gpt-image-1 | Required | Generate, Edit, Variations |
| **Stability** | SD3, Stable Image Ultra | Required | Generate, Edit, Upscale, Remove-BG |
| **Replicate** | Flux Pro, Flux Schnell | Required | Generate |

## Requirements

- Node.js 20+

## License

MIT
