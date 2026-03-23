import { Command } from 'commander';
import { getHistory, clearHistory } from '../../core/history.js';
import { getAllPricing } from '../../core/pricing.js';
import { loadConfig, setConfigValue } from '../../core/config.js';

export const costCommand = new Command('cost')
  .description('Track API usage costs');

costCommand
  .command('summary')
  .alias('s')
  .description('Show cost summary')
  .option('--month <YYYY-MM>', 'Filter by month')
  .action(async (options: { month?: string }) => {
    const chalk = (await import('chalk')).default;
    const entries = getHistory();
    const config = loadConfig();

    // Filter by month
    let filtered = entries;
    if (options.month) {
      filtered = entries.filter(e => e.timestamp.startsWith(options.month!));
    } else {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      filtered = entries.filter(e => e.timestamp.startsWith(currentMonth));
    }

    const totalCost = filtered.reduce((sum, e) => sum + (e.cost || 0), 0);
    const byProvider: Record<string, { count: number; cost: number }> = {};

    for (const e of filtered) {
      if (!byProvider[e.provider]) byProvider[e.provider] = { count: 0, cost: 0 };
      byProvider[e.provider].count++;
      byProvider[e.provider].cost += e.cost || 0;
    }

    console.log(chalk.bold('\n  💰 Cost Summary\n'));
    console.log(`  Total generations: ${filtered.length}`);
    console.log(`  Total cost:        $${totalCost.toFixed(4)}`);

    if (config.cost.budget > 0) {
      const pct = (totalCost / config.cost.budget * 100).toFixed(1);
      const color = totalCost > config.cost.budget ? chalk.red : totalCost > config.cost.budget * 0.8 ? chalk.yellow : chalk.green;
      console.log(`  Budget:            $${config.cost.budget.toFixed(2)} (${color(`${pct}% used`)})`);
    }

    console.log(chalk.bold('\n  By Provider:\n'));
    for (const [name, data] of Object.entries(byProvider)) {
      console.log(`  ${chalk.bold(name)}: ${data.count} images, $${data.cost.toFixed(4)}`);
    }
    console.log('');
  });

costCommand
  .command('budget <amount>')
  .description('Set monthly budget (e.g., 10.00)')
  .action(async (amount: string) => {
    const chalk = (await import('chalk')).default;
    const budget = parseFloat(amount);
    if (isNaN(budget) || budget < 0) {
      console.error(chalk.red('  ✗ Invalid budget amount'));
      return;
    }
    setConfigValue('cost.budget', amount);
    console.log(chalk.green(`  ✓ Monthly budget set to $${budget.toFixed(2)}`));
  });

costCommand
  .command('pricing')
  .description('Show pricing for all providers and models')
  .action(async () => {
    const chalk = (await import('chalk')).default;
    const pricing = getAllPricing();

    console.log(chalk.bold('\n  💲 Pricing per Image\n'));
    for (const [provider, models] of Object.entries(pricing)) {
      console.log(chalk.bold(`  ${provider}:`));
      for (const [model, price] of Object.entries(models)) {
        if (model.startsWith('_')) continue; // skip internal keys
        const priceStr = price === 0 ? chalk.green('FREE') : `$${price.toFixed(4)}`;
        console.log(`    ${model}: ${priceStr}`);
      }
      console.log('');
    }
  });

costCommand
  .command('export <file>')
  .description('Export cost data to CSV')
  .action(async (file: string) => {
    const chalk = (await import('chalk')).default;
    const fs = await import('node:fs');
    const entries = getHistory();

    const csv = ['id,timestamp,provider,model,prompt,cost,elapsed_ms']
      .concat(entries.map(e =>
        `${e.id},${e.timestamp},${e.provider},${e.model},"${e.prompt.replace(/"/g, '""')}",${(e.cost || 0).toFixed(4)},${e.elapsed}`
      ))
      .join('\n');

    fs.writeFileSync(file, csv, 'utf-8');
    console.log(chalk.green(`  ✓ Exported ${entries.length} entries to ${file}`));
  });

costCommand
  .command('reset')
  .description('Reset cost tracking (clears history)')
  .action(async () => {
    const chalk = (await import('chalk')).default;
    const inquirer = (await import('inquirer')).default;
    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: 'This will clear all history. Continue?',
      default: false,
    }]);
    if (confirm) {
      clearHistory();
      console.log(chalk.green('  ✓ History and cost data cleared'));
    }
  });
