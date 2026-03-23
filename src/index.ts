#!/usr/bin/env node
import { Command } from 'commander';
import { generateCommand } from './cli/commands/generate.js';
import { configCommand } from './cli/commands/config.js';
import { providersCommand } from './cli/commands/providers.js';
import { historyCommand } from './cli/commands/history.js';
import { templateCommand } from './cli/commands/template.js';
import { batchCommand } from './cli/commands/batch.js';
import { editCommand } from './cli/commands/edit.js';
import { upscaleCommand } from './cli/commands/upscale.js';
import { removeBgCommand } from './cli/commands/removebg.js';
import { varyCommand } from './cli/commands/vary.js';
import { costCommand } from './cli/commands/cost.js';
import { compareCommand } from './cli/commands/compare.js';
import { convertCommand } from './cli/commands/convert.js';
import { interactiveMode } from './cli/interactive.js';
import { getPresetNames } from './core/presets.js';
import { getRatioNames } from './core/ratios.js';

const program = new Command();

program
  .name('imgforge')
  .description('🎨 ImgForge - AI Image Generator CLI\n\n  Multi-provider, multi-model AI image generation from your terminal.\n  Supports OpenAI (DALL-E), Google Gemini (Nano Banana), Stability AI, Replicate, and Pollinations (free).')
  .version('1.2.0');

// Generate
program
  .command('generate <prompt>')
  .alias('gen')
  .alias('g')
  .description('Generate image(s) from a text prompt')
  .option('-p, --provider <name>', 'AI provider (openai, gemini, stability, replicate, pollinations)')
  .option('-m, --model <model>', 'Specific model to use')
  .option('-W, --width <pixels>', 'Image width', '1024')
  .option('-H, --height <pixels>', 'Image height', '1024')
  .option('-n, --count <number>', 'Number of images', '1')
  .option('-q, --quality <level>', 'Quality (standard, hd, ultra)', 'standard')
  .option('-o, --output <path>', 'Output file path')
  .option('-f, --format <type>', 'Output format (png, jpg, webp)', 'png')
  .option('-r, --ratio <ratio>', `Aspect ratio preset (${getRatioNames().slice(0, 5).join(', ')}...)`)
  .option('-s, --preset <style>', `Style preset (${getPresetNames().slice(0, 5).join(', ')}...)`)
  .option('-t, --template <name>', 'Use a saved prompt template')
  .option('-v, --var <key=value...>', 'Template variable (repeatable)', (v: string, prev: string[]) => [...prev, v], [])
  .option('--negative <prompt>', 'Negative prompt')
  .option('--seed <number>', 'Seed for reproducibility')
  .option('--enhance', 'Enhance prompt with quality keywords')
  .option('--open', 'Open image after generation')
  .option('--no-save', 'Do not save to disk')
  .action(generateCommand);

// Edit (img2img)
program
  .command('edit <prompt>')
  .description('Edit an existing image with AI (img2img, inpainting)')
  .requiredOption('-i, --input <file>', 'Source image file')
  .option('--mask <file>', 'Mask image (transparent = edit area)')
  .option('-p, --provider <name>', 'AI provider')
  .option('-m, --model <model>', 'Model to use')
  .option('-o, --output <path>', 'Output file path')
  .option('--strength <0.0-1.0>', 'Edit strength')
  .option('--open', 'Open image after editing')
  .action(editCommand);

// Upscale
program
  .command('upscale <input>')
  .description('Upscale image 2x-4x with AI')
  .option('-s, --scale <2x|4x>', 'Scale factor', '4x')
  .option('-p, --provider <name>', 'AI provider (default: stability)')
  .option('--prompt <text>', 'Creative guidance for upscaling')
  .option('--creativity <0.0-1.0>', 'Creativity level')
  .option('-o, --output <path>', 'Output file path')
  .option('--open', 'Open image after upscaling')
  .action(upscaleCommand);

// Remove Background
program
  .command('remove-bg <input>')
  .alias('rmbg')
  .description('Remove image background → transparent PNG')
  .option('-p, --provider <name>', 'AI provider (default: stability)')
  .option('-o, --output <path>', 'Output file path')
  .option('--open', 'Open image after processing')
  .action(removeBgCommand);

// Variations
program
  .command('vary <input>')
  .description('Generate variations of an existing image')
  .option('-n, --count <number>', 'Number of variations', '4')
  .option('--strength <0.0-1.0>', 'How different from original')
  .option('--prompt <text>', 'Guidance prompt')
  .option('-p, --provider <name>', 'AI provider')
  .option('-o, --output <path>', 'Output file path')
  .option('--open', 'Open images after generation')
  .action(varyCommand);

// Compare
program
  .command('compare <prompt>')
  .description('Compare same prompt across multiple providers')
  .option('-p, --providers <list>', 'Comma-separated provider list')
  .option('-W, --width <pixels>', 'Image width', '1024')
  .option('-H, --height <pixels>', 'Image height', '1024')
  .option('-q, --quality <level>', 'Quality level', 'standard')
  .option('-o, --output <dir>', 'Output directory')
  .option('--open', 'Open images after generation')
  .action(compareCommand);

// Batch
program
  .command('batch <file>')
  .description('Generate multiple images from a YAML/JSON config file')
  .option('--dry-run', 'Preview without generating')
  .option('--parallel <number>', 'Concurrent generations')
  .action(batchCommand);

// Convert
program
  .command('convert <input>')
  .description('Convert image format (png, jpg, webp)')
  .option('--to <format>', 'Target format', 'webp')
  .option('-W, --width <pixels>', 'Resize width')
  .option('-H, --height <pixels>', 'Resize height')
  .option('-q, --quality <1-100>', 'Output quality')
  .option('-o, --output <path>', 'Output file path')
  .action(convertCommand);

// Interactive
program
  .command('interactive')
  .alias('i')
  .description('Start interactive mode with menus')
  .action(interactiveMode);

// Sub-commands
program.addCommand(configCommand);
program.addCommand(providersCommand);
program.addCommand(historyCommand);
program.addCommand(templateCommand);
program.addCommand(costCommand);

// Show help by default if no arguments
if (process.argv.length <= 2) {
  program.outputHelp();
  console.log('');
  console.log('  Quick start:');
  console.log('    $ imgforge generate "a cat wearing sunglasses"');
  console.log('    $ imgforge generate "sunset" --preset photorealistic --ratio 16:9');
  console.log('    $ imgforge edit "make it neon" --input photo.png');
  console.log('    $ imgforge batch assets.yaml');
  console.log('    $ imgforge interactive');
  console.log('');
} else {
  program.parse();
}
