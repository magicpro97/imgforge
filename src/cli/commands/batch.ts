import * as fs from 'node:fs';
import * as path from 'node:path';
import YAML from 'yaml';
import { createProvider } from '../../providers/index.js';
import { loadConfig, getProviderApiKey } from '../../core/config.js';
import { saveImages } from '../../core/output.js';
import { addHistoryEntry } from '../../core/history.js';
import { estimateCost } from '../../core/pricing.js';
import { applyPreset } from '../../core/presets.js';
import { resolveRatio } from '../../core/ratios.js';

interface BatchImage {
  name: string;
  prompt: string;
  provider?: string;
  model?: string;
  size?: string;
  ratio?: string;
  width?: number;
  height?: number;
  quality?: string;
  negative?: string;
  preset?: string;
  output?: string;
  count?: number;
}

interface BatchConfig {
  defaults?: {
    provider?: string;
    model?: string;
    size?: string;
    ratio?: string;
    quality?: string;
    negative?: string;
    preset?: string;
    output?: string;
  };
  images: BatchImage[];
}

export async function batchCommand(file: string, options: { dryRun?: boolean; parallel?: string }): Promise<void> {
  const chalk = (await import('chalk')).default;
  const ora = (await import('ora')).default;

  if (!fs.existsSync(file)) {
    console.error(chalk.red(`\n  ✗ File not found: ${file}\n`));
    process.exit(1);
  }

  const raw = fs.readFileSync(file, 'utf-8');
  const ext = path.extname(file).toLowerCase();
  let batch: BatchConfig;

  try {
    batch = (ext === '.json') ? JSON.parse(raw) : YAML.parse(raw);
  } catch (err: any) {
    console.error(chalk.red(`\n  ✗ Failed to parse ${file}: ${err.message}\n`));
    process.exit(1);
  }

  if (!batch.images || !Array.isArray(batch.images)) {
    console.error(chalk.red('\n  ✗ Invalid batch file: missing "images" array\n'));
    process.exit(1);
  }

  const config = loadConfig();
  const total = batch.images.length;
  let totalCost = 0;

  console.log(chalk.bold(`\n  📦 Batch Processing: ${total} images`));
  if (options.dryRun) console.log(chalk.yellow('  (dry run — no images will be generated)\n'));
  else console.log('');

  const results: { name: string; status: string; file?: string; cost: number; elapsed: number }[] = [];

  for (let i = 0; i < total; i++) {
    const img = batch.images[i];
    const defaults = batch.defaults || {};

    const providerName = img.provider || defaults.provider || config.defaults.provider;
    const modelName = img.model || defaults.model || '';
    const quality = img.quality || defaults.quality || 'standard';
    const negative = img.negative || defaults.negative;
    const presetName = img.preset || defaults.preset;

    // Resolve size
    let width = img.width || 1024;
    let height = img.height || 1024;
    const ratio = img.ratio || defaults.ratio;
    const size = img.size || defaults.size;

    if (ratio) {
      const resolved = resolveRatio(ratio);
      if (resolved) [width, height] = resolved;
    } else if (size) {
      const [w, h] = size.split('x').map(Number);
      if (w && h) { width = w; height = h; }
    }

    let prompt = img.prompt;
    if (presetName) prompt = applyPreset(prompt, presetName);

    const outputPath = img.output || defaults.output
      ? path.resolve(img.output || `${defaults.output}/${img.name}.png`)
      : undefined;

    const cost = estimateCost(providerName, modelName, { quality, width, height }) * (img.count || 1);
    totalCost += cost;

    const prefix = chalk.dim(`  [${i + 1}/${total}]`);

    if (options.dryRun) {
      console.log(`${prefix} ${chalk.bold(img.name)} — ${providerName}/${modelName || 'default'} ${width}x${height} ~$${cost.toFixed(4)}`);
      console.log(chalk.dim(`         "${prompt.slice(0, 60)}${prompt.length > 60 ? '...' : ''}"`));
      results.push({ name: img.name, status: 'dry-run', cost, elapsed: 0 });
      continue;
    }

    const spinner = ora({ text: `${img.name} — generating...`, indent: 2 }).start();

    try {
      const provider = createProvider(providerName);
      const apiKey = getProviderApiKey(providerName);
      if (apiKey) provider.configure(apiKey);
      else if (provider.info.requiresKey) throw new Error(`No API key for ${providerName}`);

      const result = await provider.generate({
        prompt,
        model: modelName || undefined,
        width,
        height,
        quality: quality as any,
        negativePrompt: negative,
        count: img.count || 1,
      });

      result.cost = cost;
      const saveResult = saveImages(result, outputPath);

      if (config.history.enabled) {
        addHistoryEntry({
          provider: providerName,
          model: result.model,
          prompt,
          negativePrompt: negative,
          width, height,
          quality,
          outputFiles: saveResult.filePaths,
          elapsed: result.elapsed,
          cost,
        });
      }

      spinner.succeed(`${img.name} — ${(result.elapsed / 1000).toFixed(1)}s → ${saveResult.filePaths[0]}`);
      results.push({ name: img.name, status: 'ok', file: saveResult.filePaths[0], cost, elapsed: result.elapsed });
    } catch (err: any) {
      spinner.fail(`${img.name} — ${err.message}`);
      results.push({ name: img.name, status: 'failed', cost: 0, elapsed: 0 });
    }
  }

  // Summary
  const succeeded = results.filter(r => r.status === 'ok').length;
  const failed = results.filter(r => r.status === 'failed').length;

  console.log(chalk.bold(`\n  📊 Summary: ${succeeded}/${total} succeeded`));
  if (failed > 0) console.log(chalk.red(`  ${failed} failed`));
  console.log(chalk.dim(`  Total estimated cost: $${totalCost.toFixed(4)}\n`));
}
