import inquirer from 'inquirer';
import { createProvider, getAllProviderNames } from '../providers/index.js';
import { loadConfig, getProviderApiKey, setProviderApiKey } from '../core/config.js';
import { saveImages } from '../core/output.js';
import { addHistoryEntry } from '../core/history.js';

export async function interactiveMode(): Promise<void> {
  const chalk = (await import('chalk')).default;
  const ora = (await import('ora')).default;

  console.log('');
  console.log(chalk.bold('  🎨 ImgForge - Interactive Mode'));
  console.log(chalk.dim('  Type "quit" or Ctrl+C to exit\n'));

  while (true) {
    const config = loadConfig();

    // Provider selection
    const providerNames = getAllProviderNames();
    const providerChoices = providerNames.map(name => {
      const key = getProviderApiKey(name);
      const provider = createProvider(name);
      const status = !provider.info.requiresKey
        ? chalk.blue(' (free)')
        : key ? chalk.green(' ✓') : chalk.dim(' (no key)');
      return { name: `${provider.info.displayName}${status}`, value: name };
    });

    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: '🖼️  Generate image', value: 'generate' },
        { name: '🔧 Configure API key', value: 'configure' },
        { name: '🔌 List providers', value: 'providers' },
        { name: '📜 View history', value: 'history' },
        { name: '❌ Exit', value: 'exit' },
      ],
    }]);

    if (action === 'exit') {
      console.log(chalk.dim('\n  Goodbye! 👋\n'));
      break;
    }

    if (action === 'configure') {
      await configureApiKey(chalk, providerChoices);
      continue;
    }

    if (action === 'providers') {
      await showProviders(chalk);
      continue;
    }

    if (action === 'history') {
      await showHistory(chalk);
      continue;
    }

    // Generate flow
    const { provider: providerName } = await inquirer.prompt([{
      type: 'list',
      name: 'provider',
      message: 'Select provider:',
      choices: providerChoices,
      default: config.defaults.provider,
    }]);

    const provider = createProvider(providerName);
    const apiKey = getProviderApiKey(providerName);

    if (provider.info.requiresKey && !apiKey) {
      const { key } = await inquirer.prompt([{
        type: 'password',
        name: 'key',
        message: `Enter ${providerName} API key:`,
        mask: '*',
      }]);
      if (key) {
        setProviderApiKey(providerName, key);
        provider.configure(key);
      } else {
        console.log(chalk.yellow('  Skipped. No key provided.\n'));
        continue;
      }
    } else if (apiKey) {
      provider.configure(apiKey);
    }

    const models = await provider.listModels();
    const { model } = await inquirer.prompt([{
      type: 'list',
      name: 'model',
      message: 'Select model:',
      choices: models.map(m => ({ name: m, value: m })),
    }]);

    const { prompt } = await inquirer.prompt([{
      type: 'input',
      name: 'prompt',
      message: 'Enter your prompt:',
      validate: (v: string) => v.trim().length > 0 || 'Prompt cannot be empty',
    }]);

    if (prompt.toLowerCase() === 'quit') break;

    const { size } = await inquirer.prompt([{
      type: 'list',
      name: 'size',
      message: 'Image size:',
      choices: [
        { name: '1024 × 1024 (Square)', value: '1024x1024' },
        { name: '1792 × 1024 (Landscape)', value: '1792x1024' },
        { name: '1024 × 1792 (Portrait)', value: '1024x1792' },
        { name: '512 × 512 (Small)', value: '512x512' },
      ],
      default: '1024x1024',
    }]);

    const [width, height] = size.split('x').map(Number);

    console.log('');
    const spinner = ora({ text: 'Generating image...', indent: 2 }).start();

    try {
      const result = await provider.generate({
        prompt,
        model,
        width,
        height,
        quality: 'standard',
      });

      spinner.succeed(`Generated in ${(result.elapsed / 1000).toFixed(1)}s`);

      if (result.images[0]?.revisedPrompt) {
        console.log(chalk.dim(`  Revised: "${result.images[0].revisedPrompt.slice(0, 80)}..."`));
      }

      const saveResult = saveImages(result);
      for (const fp of saveResult.filePaths) {
        console.log(chalk.green(`  ✓ Saved: ${fp}`));
      }

      if (config.history.enabled) {
        addHistoryEntry({
          provider: result.provider,
          model: result.model,
          prompt,
          width,
          height,
          quality: 'standard',
          outputFiles: saveResult.filePaths,
          elapsed: result.elapsed,
          cost: result.cost,
        });
      }
    } catch (error: any) {
      spinner.fail('Generation failed');
      console.error(chalk.red(`  ${error.message}`));
    }

    console.log('');
  }
}

async function configureApiKey(chalk: any, providerChoices: any[]): Promise<void> {
  const { provider } = await inquirer.prompt([{
    type: 'list',
    name: 'provider',
    message: 'Select provider to configure:',
    choices: providerChoices,
  }]);

  const p = createProvider(provider);
  if (!p.info.requiresKey) {
    console.log(chalk.blue(`\n  ${p.info.displayName} is free - no API key needed!\n`));
    return;
  }

  console.log(chalk.dim(`  Get key at: ${p.info.website}`));
  const { key } = await inquirer.prompt([{
    type: 'password',
    name: 'key',
    message: `Enter ${provider} API key:`,
    mask: '*',
  }]);

  if (key) {
    setProviderApiKey(provider, key);
    console.log(chalk.green(`\n  ✓ API key saved for ${provider}\n`));
  }
}

async function showProviders(chalk: any): Promise<void> {
  const { createAllProviders } = await import('../providers/index.js');
  const providers = createAllProviders();

  console.log(chalk.bold('\n  🔌 Providers:\n'));
  for (const [name, provider] of providers) {
    const info = provider.info;
    const key = getProviderApiKey(name);
    const status = !info.requiresKey ? chalk.blue('FREE') : key ? chalk.green('✓') : chalk.dim('✗');
    console.log(`  ${status} ${info.displayName} (${info.models.length} models)`);
  }
  console.log('');
}

async function showHistory(chalk: any): Promise<void> {
  const { getHistory } = await import('../core/history.js');
  const entries = getHistory(10);

  if (entries.length === 0) {
    console.log(chalk.dim('\n  No history yet.\n'));
    return;
  }

  console.log(chalk.bold('\n  📜 Recent Generations:\n'));
  for (const e of entries) {
    const date = new Date(e.timestamp).toLocaleString();
    console.log(`  ${chalk.dim(e.id)} ${e.provider}/${e.model} - "${e.prompt.slice(0, 40)}..." (${date})`);
  }
  console.log('');
}
