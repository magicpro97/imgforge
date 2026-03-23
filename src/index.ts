#!/usr/bin/env node
import { Command } from 'commander';
import { generateCommand } from './cli/commands/generate.js';
import { configCommand } from './cli/commands/config.js';
import { providersCommand } from './cli/commands/providers.js';
import { historyCommand } from './cli/commands/history.js';
import { interactiveMode } from './cli/interactive.js';

const program = new Command();

program
  .name('imgforge')
  .description('🎨 ImgForge - AI Image Generator CLI\n\n  Multi-provider, multi-model AI image generation from your terminal.\n  Supports OpenAI (DALL-E), Google Gemini (Imagen), Stability AI, Replicate, and Pollinations (free).')
  .version('1.0.0');

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
  .option('--negative <prompt>', 'Negative prompt')
  .option('--seed <number>', 'Seed for reproducibility')
  .option('--no-save', 'Do not save to disk')
  .action(generateCommand);

program
  .command('interactive')
  .alias('i')
  .description('Start interactive mode with menus')
  .action(interactiveMode);

program.addCommand(configCommand);
program.addCommand(providersCommand);
program.addCommand(historyCommand);

// Show help by default if no arguments
if (process.argv.length <= 2) {
  program.outputHelp();
  console.log('');
  console.log('  Quick start:');
  console.log('    $ imgforge generate "a cat wearing sunglasses"');
  console.log('    $ imgforge config set openai.apiKey sk-xxxxx');
  console.log('    $ imgforge interactive');
  console.log('');
} else {
  program.parse();
}
