import { Command } from 'commander';
import { createAllProviders } from '../../providers/index.js';
import { getProviderApiKey } from '../../core/config.js';

export const providersCommand = new Command('providers')
  .description('Manage and test AI providers');

providersCommand
  .command('list')
  .description('List all available providers')
  .action(async () => {
    const chalk = (await import('chalk')).default;
    const providers = createAllProviders();

    console.log(chalk.bold('\n  🔌 Available Providers\n'));

    for (const [name, provider] of providers) {
      const info = provider.info;
      const apiKey = getProviderApiKey(name);
      const hasKey = !!apiKey;

      let status: string;
      if (!info.requiresKey) {
        status = chalk.blue('FREE');
      } else if (hasKey) {
        status = chalk.green('CONFIGURED');
      } else {
        status = chalk.dim('NOT CONFIGURED');
      }

      console.log(`  ${chalk.bold(info.displayName)}`);
      console.log(`    Name:    ${name}`);
      console.log(`    Status:  ${status}`);
      console.log(`    Models:  ${info.models.join(', ')}`);
      if (info.requiresKey && !hasKey) {
        console.log(chalk.yellow(`    Setup:   imgforge config set ${name}.apiKey <key>`));
        console.log(chalk.dim(`    Get key: ${info.website}`));
      }
      console.log('');
    }
  });

providersCommand
  .command('test [name]')
  .description('Test provider connection')
  .option('--all', 'Test all providers')
  .action(async (name?: string, options?: { all?: boolean }) => {
    const chalk = (await import('chalk')).default;
    const ora = (await import('ora')).default;
    const providers = createAllProviders();

    const toTest = options?.all
      ? Array.from(providers.entries())
      : name
        ? [[name, providers.get(name)!] as [string, any]]
        : [];

    if (toTest.length === 0) {
      console.log(chalk.yellow('  Specify a provider name or use --all'));
      return;
    }

    console.log(chalk.bold('\n  🧪 Testing Providers\n'));

    for (const [provName, provider] of toTest) {
      if (!provider) {
        console.log(chalk.red(`  ✗ Unknown provider: ${provName}`));
        continue;
      }

      const apiKey = getProviderApiKey(provName);
      if (apiKey) provider.configure(apiKey);

      const spinner = ora({ text: `Testing ${provName}...`, indent: 2 }).start();

      try {
        if (provider.info.requiresKey && !apiKey) {
          spinner.warn(`${provName}: No API key configured`);
          continue;
        }
        const ok = await provider.validate();
        if (ok) {
          spinner.succeed(`${provName}: Connected ✓`);
        } else {
          spinner.fail(`${provName}: Connection failed`);
        }
      } catch (err: any) {
        spinner.fail(`${provName}: ${err.message}`);
      }
    }
    console.log('');
  });

providersCommand
  .command('models <name>')
  .description('List models for a provider')
  .action(async (name: string) => {
    const chalk = (await import('chalk')).default;
    const providers = createAllProviders();
    const provider = providers.get(name);

    if (!provider) {
      console.log(chalk.red(`  ✗ Unknown provider: ${name}`));
      return;
    }

    const models = await provider.listModels();
    console.log(chalk.bold(`\n  Models for ${provider.info.displayName}:\n`));
    for (const model of models) {
      console.log(`    • ${model}`);
    }
    console.log('');
  });
