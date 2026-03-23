import { Command } from 'commander';
import { getHistory, getHistoryEntry, clearHistory } from '../../core/history.js';

export const historyCommand = new Command('history')
  .description('View generation history');

historyCommand
  .command('list')
  .alias('ls')
  .description('List recent generations')
  .option('-n, --last <count>', 'Number of entries', '10')
  .action(async (options: { last: string }) => {
    const chalk = (await import('chalk')).default;
    const entries = getHistory(parseInt(options.last));

    if (entries.length === 0) {
      console.log(chalk.dim('\n  No history entries yet.\n'));
      return;
    }

    console.log(chalk.bold(`\n  📜 Recent Generations (last ${entries.length})\n`));

    for (const entry of entries) {
      const date = new Date(entry.timestamp).toLocaleString();
      const promptShort = entry.prompt.slice(0, 50) + (entry.prompt.length > 50 ? '...' : '');
      console.log(`  ${chalk.dim(entry.id)} ${chalk.bold(entry.provider)}/${entry.model}`);
      console.log(`    ${chalk.dim(date)} | ${(entry.elapsed / 1000).toFixed(1)}s`);
      console.log(`    "${promptShort}"`);
      for (const f of entry.outputFiles) {
        console.log(chalk.green(`    → ${f}`));
      }
      console.log('');
    }
  });

historyCommand
  .command('show <id>')
  .description('Show details of a specific generation')
  .action(async (id: string) => {
    const chalk = (await import('chalk')).default;
    const entry = getHistoryEntry(id);

    if (!entry) {
      console.log(chalk.red(`  ✗ Entry "${id}" not found`));
      return;
    }

    console.log(chalk.bold('\n  Generation Details\n'));
    console.log(`  ID:        ${entry.id}`);
    console.log(`  Date:      ${new Date(entry.timestamp).toLocaleString()}`);
    console.log(`  Provider:  ${entry.provider}`);
    console.log(`  Model:     ${entry.model}`);
    console.log(`  Prompt:    "${entry.prompt}"`);
    if (entry.negativePrompt) {
      console.log(`  Negative:  "${entry.negativePrompt}"`);
    }
    console.log(`  Size:      ${entry.width}x${entry.height}`);
    console.log(`  Quality:   ${entry.quality}`);
    console.log(`  Elapsed:   ${(entry.elapsed / 1000).toFixed(1)}s`);
    if (entry.cost) {
      console.log(`  Cost:      $${entry.cost.toFixed(4)}`);
    }
    console.log(chalk.bold('\n  Output Files:'));
    for (const f of entry.outputFiles) {
      console.log(chalk.green(`    ${f}`));
    }
    console.log('');
  });

historyCommand
  .command('clear')
  .description('Clear all history')
  .action(async () => {
    const chalk = (await import('chalk')).default;
    clearHistory();
    console.log(chalk.green('  ✓ History cleared'));
  });
