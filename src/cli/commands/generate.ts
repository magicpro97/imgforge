import { createProvider, getAllProviderNames } from '../../providers/index.js';
import { loadConfig, getProviderApiKey } from '../../core/config.js';
import { saveImages } from '../../core/output.js';
import { addHistoryEntry } from '../../core/history.js';
import { resolveRatio } from '../../core/ratios.js';
import { applyPreset, getPresetNames, STYLE_PRESETS } from '../../core/presets.js';
import { estimateCost } from '../../core/pricing.js';
import { getTemplate, renderTemplate } from '../../core/templates.js';
import { openFile } from '../../core/opener.js';
import type { ImageGenerationRequest } from '../../types/index.js';

interface GenerateOptions {
  provider?: string;
  model?: string;
  width?: string;
  height?: string;
  count?: string;
  quality?: string;
  output?: string;
  format?: string;
  negative?: string;
  seed?: string;
  save?: boolean;
  ratio?: string;
  preset?: string;
  enhance?: boolean;
  open?: boolean;
  template?: string;
  var?: string[];
}

export async function generateCommand(prompt: string, options: GenerateOptions): Promise<void> {
  const chalk = (await import('chalk')).default;
  const ora = (await import('ora')).default;

  const config = loadConfig();

  // Handle template
  if (options.template) {
    const tmpl = getTemplate(options.template);
    if (!tmpl) {
      console.error(chalk.red(`\n  ✗ Template "${options.template}" not found. Run: imgforge template list\n`));
      process.exit(1);
    }
    const vars: Record<string, string> = {};
    for (const v of options.var || []) {
      const [key, ...rest] = v.split('=');
      vars[key] = rest.join('=');
    }
    try {
      prompt = renderTemplate(tmpl, vars);
    } catch (err: any) {
      console.error(chalk.red(`\n  ✗ ${err.message}\n`));
      process.exit(1);
    }
    // Apply template defaults
    if (tmpl.provider && !options.provider) options.provider = tmpl.provider;
    if (tmpl.model && !options.model) options.model = tmpl.model;
    if (tmpl.width && !options.width) options.width = String(tmpl.width);
    if (tmpl.height && !options.height) options.height = String(tmpl.height);
    if (tmpl.quality && !options.quality) options.quality = tmpl.quality;
    if (tmpl.negativePrompt && !options.negative) options.negative = tmpl.negativePrompt;
  }

  // Apply style preset
  const presetName = options.preset || config.defaults.preset;
  if (presetName && STYLE_PRESETS[presetName]) {
    prompt = applyPreset(prompt, presetName);
  }

  // Resolve aspect ratio
  let width = parseInt(options.width || String(config.defaults.width)) || 1024;
  let height = parseInt(options.height || String(config.defaults.height)) || 1024;
  if (options.ratio) {
    const resolved = resolveRatio(options.ratio);
    if (resolved) {
      [width, height] = resolved;
    } else {
      const { getRatioNames: getRatios } = await import('../../core/ratios.js');
      console.error(chalk.red(`\n  ✗ Unknown ratio "${options.ratio}". Available: ${getRatios().join(', ')}\n`));
      process.exit(1);
    }
  }

  const providerName = options.provider || config.defaults.provider;
  const provider = createProvider(providerName);

  // Configure API key
  const apiKey = getProviderApiKey(providerName);
  if (apiKey) {
    provider.configure(apiKey);
  } else if (provider.info.requiresKey) {
    console.error(chalk.red(`\n  ✗ No API key configured for "${providerName}".`));
    console.error(chalk.yellow(`  → Run: imgforge config set ${providerName}.apiKey <your-key>`));
    console.error(chalk.dim(`  → Get key at: ${provider.info.website}\n`));
    process.exit(1);
  }

  const request: ImageGenerationRequest = {
    prompt,
    model: options.model || config.defaults.model || undefined,
    width,
    height,
    count: parseInt(options.count || String(config.defaults.count)) || 1,
    quality: (options.quality as any) || config.defaults.quality,
    format: (options.format as any) || config.defaults.format,
    negativePrompt: options.negative,
    seed: options.seed ? parseInt(options.seed) : undefined,
  };

  // Prompt enhancement
  if (options.enhance) {
    request.prompt = `${request.prompt}, highly detailed, professional quality, masterful composition, perfect lighting, 8k resolution`;
  }

  console.log('');
  console.log(chalk.bold('  🎨 ImgForge - AI Image Generator'));
  console.log(chalk.dim(`  Provider: ${provider.info.displayName}`));
  console.log(chalk.dim(`  Model:    ${request.model || 'default'}`));
  console.log(chalk.dim(`  Size:     ${request.width}x${request.height}`));
  if (presetName) console.log(chalk.dim(`  Preset:   ${presetName}`));
  console.log(chalk.dim(`  Prompt:   "${prompt.slice(0, 60)}${prompt.length > 60 ? '...' : ''}"`));
  console.log('');

  const spinner = ora({ text: 'Generating image...', indent: 2 }).start();

  try {
    const result = await provider.generate(request);
    spinner.succeed(`Generated ${result.images.length} image(s) in ${(result.elapsed / 1000).toFixed(1)}s`);

    if (result.images[0]?.revisedPrompt) {
      console.log(chalk.dim(`  Revised prompt: "${result.images[0].revisedPrompt.slice(0, 80)}..."`));
    }

    // Estimate cost
    const cost = estimateCost(providerName, request.model || '', {
      quality: request.quality,
      width: request.width,
      height: request.height,
    }) * (request.count || 1);
    result.cost = cost;

    // Save images
    if (options.save !== false) {
      const saveResult = saveImages(result, options.output);
      console.log('');
      for (const fp of saveResult.filePaths) {
        console.log(chalk.green(`  ✓ Saved: ${fp}`));
      }

      // Auto-open
      if (options.open || config.autoOpen) {
        for (const fp of saveResult.filePaths) {
          openFile(fp);
        }
      }

      // Add to history
      if (config.history.enabled) {
        addHistoryEntry({
          provider: result.provider,
          model: result.model,
          prompt,
          negativePrompt: request.negativePrompt,
          width: request.width!,
          height: request.height!,
          quality: request.quality || 'standard',
          outputFiles: saveResult.filePaths,
          elapsed: result.elapsed,
          cost,
        });
      }
    }

    if (cost > 0) {
      console.log(chalk.dim(`  Cost: ~$${cost.toFixed(4)}`));
    }
    console.log('');
  } catch (error: any) {
    spinner.fail('Generation failed');
    console.error(chalk.red(`\n  ${error.message}\n`));
    process.exit(1);
  }
}
