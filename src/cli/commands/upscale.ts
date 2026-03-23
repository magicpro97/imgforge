import * as fs from 'node:fs';
import { createProvider } from '../../providers/index.js';
import { loadConfig, getProviderApiKey } from '../../core/config.js';
import { saveImages } from '../../core/output.js';
import { estimateCost } from '../../core/pricing.js';
import { openFile } from '../../core/opener.js';

interface UpscaleOptions {
  scale?: string;
  provider?: string;
  prompt?: string;
  creativity?: string;
  output?: string;
  open?: boolean;
}

export async function upscaleCommand(input: string, options: UpscaleOptions): Promise<void> {
  const chalk = (await import('chalk')).default;
  const ora = (await import('ora')).default;

  if (!fs.existsSync(input)) {
    console.error(chalk.red(`\n  ✗ File not found: ${input}\n`));
    process.exit(1);
  }

  const config = loadConfig();
  const providerName = options.provider || 'stability';
  const provider = createProvider(providerName);

  const apiKey = getProviderApiKey(providerName);
  if (apiKey) provider.configure(apiKey);
  else if (provider.info.requiresKey) {
    console.error(chalk.red(`\n  ✗ No API key configured for "${providerName}"\n`));
    process.exit(1);
  }

  const scale = (options.scale || '4x') as '2x' | '4x';

  console.log(chalk.bold('\n  🔍 ImgForge - Image Upscale'));
  console.log(chalk.dim(`  Provider: ${provider.info.displayName}`));
  console.log(chalk.dim(`  Input:    ${input}`));
  console.log(chalk.dim(`  Scale:    ${scale}`));
  if (options.prompt) console.log(chalk.dim(`  Guidance: "${options.prompt.slice(0, 60)}..."`));
  console.log('');

  const spinner = ora({ text: `Upscaling ${scale}...`, indent: 2 }).start();

  try {
    const result = await provider.upscale({
      inputImage: input,
      scale,
      prompt: options.prompt,
      creativity: options.creativity ? parseFloat(options.creativity) : undefined,
    });

    spinner.succeed(`Upscaled in ${(result.elapsed / 1000).toFixed(1)}s`);

    const cost = estimateCost(providerName, '', { operation: 'upscale' });
    const saveResult = saveImages(result, options.output);

    for (const fp of saveResult.filePaths) {
      console.log(chalk.green(`  ✓ Saved: ${fp}`));
    }

    if (options.open || config.autoOpen) {
      for (const fp of saveResult.filePaths) openFile(fp);
    }

    if (cost > 0) console.log(chalk.dim(`  Cost: ~$${cost.toFixed(4)}`));
    console.log('');
  } catch (err: any) {
    spinner.fail('Upscale failed');
    console.error(chalk.red(`\n  ${err.message}\n`));
    process.exit(1);
  }
}
