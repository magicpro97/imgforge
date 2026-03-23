import { createProvider, getAllProviderNames } from '../../providers/index.js';
import { loadConfig, getProviderApiKey } from '../../core/config.js';
import { saveImages } from '../../core/output.js';
import { estimateCost } from '../../core/pricing.js';
import { openFile } from '../../core/opener.js';
import type { ImageGenerationRequest } from '../../types/index.js';

interface CompareOptions {
  providers?: string;
  model?: string;
  width?: string;
  height?: string;
  quality?: string;
  output?: string;
  open?: boolean;
}

export async function compareCommand(prompt: string, options: CompareOptions): Promise<void> {
  const chalk = (await import('chalk')).default;
  const ora = (await import('ora')).default;

  const config = loadConfig();
  const providerNames = options.providers
    ? options.providers.split(',').map(p => p.trim())
    : getAllProviderNames();

  const width = parseInt(options.width || '1024');
  const height = parseInt(options.height || '1024');

  console.log(chalk.bold('\n  🔀 ImgForge - Provider Comparison'));
  console.log(chalk.dim(`  Prompt:    "${prompt.slice(0, 60)}${prompt.length > 60 ? '...' : ''}"`));
  console.log(chalk.dim(`  Providers: ${providerNames.join(', ')}`));
  console.log(chalk.dim(`  Size:      ${width}x${height}`));
  console.log('');

  const results: { provider: string; elapsed: number; cost: number; file?: string; error?: string }[] = [];

  for (const name of providerNames) {
    const spinner = ora({ text: `${name} — generating...`, indent: 2 }).start();

    try {
      const provider = createProvider(name);
      const apiKey = getProviderApiKey(name);
      if (apiKey) provider.configure(apiKey);
      else if (provider.info.requiresKey) {
        spinner.warn(`${name} — no API key configured`);
        results.push({ provider: name, elapsed: 0, cost: 0, error: 'no key' });
        continue;
      }

      const request: ImageGenerationRequest = {
        prompt,
        width,
        height,
        quality: (options.quality as any) || 'standard',
      };

      const result = await provider.generate(request);
      const cost = estimateCost(name, result.model, { quality: options.quality, width, height });

      const outputDir = options.output || './imgforge-output/compare';
      const saveResult = saveImages(result, `${outputDir}/${name}.png`);

      spinner.succeed(`${name} — ${(result.elapsed / 1000).toFixed(1)}s, ~$${cost.toFixed(4)}`);

      if (options.open || config.autoOpen) {
        for (const fp of saveResult.filePaths) openFile(fp);
      }

      results.push({ provider: name, elapsed: result.elapsed, cost, file: saveResult.filePaths[0] });
    } catch (err: any) {
      spinner.fail(`${name} — ${err.message.slice(0, 60)}`);
      results.push({ provider: name, elapsed: 0, cost: 0, error: err.message });
    }
  }

  // Summary
  const succeeded = results.filter(r => !r.error);
  if (succeeded.length > 0) {
    const fastest = succeeded.reduce((a, b) => a.elapsed < b.elapsed ? a : b);
    const cheapest = succeeded.reduce((a, b) => a.cost < b.cost ? a : b);

    console.log(chalk.bold('\n  📊 Comparison Results:\n'));
    console.log(`  Fastest:  ${chalk.green(fastest.provider)} (${(fastest.elapsed / 1000).toFixed(1)}s)`);
    console.log(`  Cheapest: ${chalk.green(cheapest.provider)} ($${cheapest.cost.toFixed(4)})`);
  }
  console.log('');
}
