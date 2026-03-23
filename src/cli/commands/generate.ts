import { createProvider, getAllProviderNames } from '../../providers/index.js';
import { loadConfig, getProviderApiKey } from '../../core/config.js';
import { saveImages } from '../../core/output.js';
import { addHistoryEntry } from '../../core/history.js';
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
}

export async function generateCommand(prompt: string, options: GenerateOptions): Promise<void> {
  const chalk = (await import('chalk')).default;
  const ora = (await import('ora')).default;

  const config = loadConfig();
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
    width: parseInt(options.width || String(config.defaults.width)) || 1024,
    height: parseInt(options.height || String(config.defaults.height)) || 1024,
    count: parseInt(options.count || String(config.defaults.count)) || 1,
    quality: (options.quality as any) || config.defaults.quality,
    format: (options.format as any) || config.defaults.format,
    negativePrompt: options.negative,
    seed: options.seed ? parseInt(options.seed) : undefined,
  };

  console.log('');
  console.log(chalk.bold('  🎨 ImgForge - AI Image Generator'));
  console.log(chalk.dim(`  Provider: ${provider.info.displayName}`));
  console.log(chalk.dim(`  Model:    ${request.model || 'default'}`));
  console.log(chalk.dim(`  Size:     ${request.width}x${request.height}`));
  console.log(chalk.dim(`  Prompt:   "${prompt.slice(0, 60)}${prompt.length > 60 ? '...' : ''}"`));
  console.log('');

  const spinner = ora({ text: 'Generating image...', indent: 2 }).start();

  try {
    const result = await provider.generate(request);
    spinner.succeed(`Generated ${result.images.length} image(s) in ${(result.elapsed / 1000).toFixed(1)}s`);

    if (result.images[0]?.revisedPrompt) {
      console.log(chalk.dim(`  Revised prompt: "${result.images[0].revisedPrompt.slice(0, 80)}..."`));
    }

    // Save images
    if (options.save !== false) {
      const saveResult = saveImages(result, options.output);
      console.log('');
      for (const fp of saveResult.filePaths) {
        console.log(chalk.green(`  ✓ Saved: ${fp}`));
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
          cost: result.cost,
        });
      }
    }

    if (result.cost !== undefined && result.cost > 0) {
      console.log(chalk.dim(`  Cost: ~$${result.cost.toFixed(4)}`));
    }
    console.log('');
  } catch (error: any) {
    spinner.fail('Generation failed');
    console.error(chalk.red(`\n  ${error.message}\n`));
    process.exit(1);
  }
}
