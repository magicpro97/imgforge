import * as fs from 'node:fs';
import { createProvider } from '../../providers/index.js';
import { loadConfig, getProviderApiKey } from '../../core/config.js';
import { saveImages } from '../../core/output.js';
import { addHistoryEntry } from '../../core/history.js';
import { estimateCost } from '../../core/pricing.js';
import { openFile } from '../../core/opener.js';

interface EditOptions {
  input: string;
  mask?: string;
  provider?: string;
  model?: string;
  output?: string;
  strength?: string;
  open?: boolean;
}

export async function editCommand(prompt: string, options: EditOptions): Promise<void> {
  const chalk = (await import('chalk')).default;
  const ora = (await import('ora')).default;

  if (!options.input) {
    console.error(chalk.red('\n  ✗ --input <file> is required for image editing\n'));
    process.exit(1);
  }

  if (!fs.existsSync(options.input)) {
    console.error(chalk.red(`\n  ✗ Input file not found: ${options.input}\n`));
    process.exit(1);
  }

  if (options.mask && !fs.existsSync(options.mask)) {
    console.error(chalk.red(`\n  ✗ Mask file not found: ${options.mask}\n`));
    process.exit(1);
  }

  const config = loadConfig();
  const providerName = options.provider || config.defaults.provider;
  const provider = createProvider(providerName);

  const apiKey = getProviderApiKey(providerName);
  if (apiKey) provider.configure(apiKey);
  else if (provider.info.requiresKey) {
    console.error(chalk.red(`\n  ✗ No API key configured for "${providerName}"\n`));
    process.exit(1);
  }

  console.log(chalk.bold('\n  ✏️  ImgForge - Image Edit'));
  console.log(chalk.dim(`  Provider: ${provider.info.displayName}`));
  console.log(chalk.dim(`  Input:    ${options.input}`));
  if (options.mask) console.log(chalk.dim(`  Mask:     ${options.mask}`));
  console.log(chalk.dim(`  Prompt:   "${prompt.slice(0, 60)}..."`));
  console.log('');

  const spinner = ora({ text: 'Editing image...', indent: 2 }).start();

  try {
    const result = await provider.edit({
      prompt,
      inputImage: options.input,
      mask: options.mask,
      model: options.model,
      strength: options.strength ? parseFloat(options.strength) : undefined,
    });

    spinner.succeed(`Edited in ${(result.elapsed / 1000).toFixed(1)}s`);

    const cost = estimateCost(providerName, result.model, { operation: 'edit' });
    result.cost = cost;

    const saveResult = saveImages(result, options.output);
    for (const fp of saveResult.filePaths) {
      console.log(chalk.green(`  ✓ Saved: ${fp}`));
    }

    if (options.open || config.autoOpen) {
      for (const fp of saveResult.filePaths) openFile(fp);
    }

    if (config.history.enabled) {
      addHistoryEntry({
        provider: providerName, model: result.model, prompt,
        width: 0, height: 0, quality: 'standard',
        outputFiles: saveResult.filePaths, elapsed: result.elapsed, cost,
      });
    }

    if (cost > 0) console.log(chalk.dim(`  Cost: ~$${cost.toFixed(4)}`));
    console.log('');
  } catch (err: any) {
    spinner.fail('Edit failed');
    console.error(chalk.red(`\n  ${err.message}\n`));
    process.exit(1);
  }
}
