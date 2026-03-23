import { Command } from 'commander';
import { loadConfig, setConfigValue, getConfigValue, getConfigFilePath } from '../../core/config.js';

export const configCommand = new Command('config')
  .description('Manage ImgForge configuration');

configCommand
  .command('set <key> <value>')
  .description('Set a config value (e.g., openai.apiKey sk-xxx)')
  .action(async (key: string, value: string) => {
    const chalk = (await import('chalk')).default;

    // Shorthand: "openai.apiKey" → "providers.openai.apiKey"
    const fullKey = normalizeKey(key);
    setConfigValue(fullKey, value);

    const display = fullKey.toLowerCase().includes('apikey')
      ? value.slice(0, 6) + '...' + value.slice(-4)
      : value;
    console.log(chalk.green(`  ✓ Set ${key} = ${display}`));
  });

configCommand
  .command('get <key>')
  .description('Get a config value')
  .action(async (key: string) => {
    const chalk = (await import('chalk')).default;
    const fullKey = normalizeKey(key);
    const value = getConfigValue(fullKey);

    if (value === undefined) {
      console.log(chalk.yellow(`  ⚠ Key "${key}" not found`));
    } else {
      const display = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
      const masked = fullKey.toLowerCase().includes('apikey') && typeof value === 'string'
        ? value.slice(0, 6) + '...' + value.slice(-4)
        : display;
      console.log(`  ${key} = ${masked}`);
    }
  });

configCommand
  .command('list')
  .description('Show all configuration')
  .action(async () => {
    const chalk = (await import('chalk')).default;
    const config = loadConfig();

    console.log(chalk.bold('\n  📋 ImgForge Configuration'));
    console.log(chalk.dim(`  File: ${getConfigFilePath()}\n`));

    // Providers
    console.log(chalk.bold('  Providers:'));
    for (const [name, pConfig] of Object.entries(config.providers)) {
      const hasKey = pConfig.apiKey && pConfig.apiKey.length > 0;
      const status = hasKey ? chalk.green('✓ configured') : (name === 'pollinations' ? chalk.blue('✓ free (no key)') : chalk.dim('✗ no key'));
      console.log(`    ${name.padEnd(14)} ${status}`);
    }

    // Defaults
    console.log(chalk.bold('\n  Defaults:'));
    console.log(`    Provider:  ${config.defaults.provider}`);
    console.log(`    Size:      ${config.defaults.width}x${config.defaults.height}`);
    console.log(`    Quality:   ${config.defaults.quality}`);
    console.log(`    Format:    ${config.defaults.format}`);

    // Output
    console.log(chalk.bold('\n  Output:'));
    console.log(`    Directory: ${config.output.directory}`);
    console.log(`    Pattern:   ${config.output.namingPattern}`);
    console.log('');
  });

configCommand
  .command('path')
  .description('Show config file path')
  .action(() => {
    console.log(getConfigFilePath());
  });

function normalizeKey(key: string): string {
  // Allow shorthand like "openai.apiKey" → "providers.openai.apiKey"
  const providerNames = ['openai', 'gemini', 'pollinations', 'stability', 'replicate'];
  const parts = key.split('.');
  if (parts.length >= 2 && providerNames.includes(parts[0]) && !key.startsWith('providers.')) {
    return `providers.${key}`;
  }
  if (parts.length >= 1 && ['provider', 'model', 'width', 'height', 'quality', 'format', 'count'].includes(parts[0]) && !key.startsWith('defaults.')) {
    return `defaults.${key}`;
  }
  return key;
}
