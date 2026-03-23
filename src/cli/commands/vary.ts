import * as fs from 'node:fs';
import { createProvider } from '../../providers/index.js';
import { loadConfig, getProviderApiKey } from '../../core/config.js';
import { saveImages } from '../../core/output.js';
import { openFile } from '../../core/opener.js';

interface VaryOptions {
  count?: string;
  strength?: string;
  prompt?: string;
  provider?: string;
  output?: string;
  open?: boolean;
}

export async function varyCommand(input: string, options: VaryOptions): Promise<void> {
  const chalk = (await import('chalk')).default;
  const ora = (await import('ora')).default;

  if (!fs.existsSync(input)) {
    console.error(chalk.red(`\n  ✗ File not found: ${input}\n`));
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

  const count = parseInt(options.count || '4');

  console.log(chalk.bold('\n  🔄 ImgForge - Image Variations'));
  console.log(chalk.dim(`  Provider: ${provider.info.displayName}`));
  console.log(chalk.dim(`  Input:    ${input}`));
  console.log(chalk.dim(`  Count:    ${count}`));
  console.log('');

  const spinner = ora({ text: `Generating ${count} variations...`, indent: 2 }).start();

  try {
    const result = await provider.vary({
      inputImage: input,
      count,
      strength: options.strength ? parseFloat(options.strength) : undefined,
      prompt: options.prompt,
    });

    spinner.succeed(`Generated ${result.images.length} variation(s) in ${(result.elapsed / 1000).toFixed(1)}s`);

    const saveResult = saveImages(result, options.output);
    for (const fp of saveResult.filePaths) {
      console.log(chalk.green(`  ✓ Saved: ${fp}`));
    }

    if (options.open || config.autoOpen) {
      for (const fp of saveResult.filePaths) openFile(fp);
    }

    console.log('');
  } catch (err: any) {
    spinner.fail('Variations failed');
    console.error(chalk.red(`\n  ${err.message}\n`));
    process.exit(1);
  }
}
