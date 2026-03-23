import { Command } from 'commander';
import { saveTemplate, getTemplate, getAllTemplates, deleteTemplate } from '../../core/templates.js';

export const templateCommand = new Command('template')
  .description('Manage prompt templates');

templateCommand
  .command('save <name> <prompt>')
  .description('Save a prompt template (use {var} for variables)')
  .option('-p, --provider <name>', 'Default provider')
  .option('-m, --model <model>', 'Default model')
  .option('-W, --width <pixels>', 'Default width')
  .option('-H, --height <pixels>', 'Default height')
  .option('-q, --quality <level>', 'Default quality')
  .option('--negative <prompt>', 'Default negative prompt')
  .action(async (name: string, prompt: string, options: any) => {
    const chalk = (await import('chalk')).default;
    const entry = saveTemplate(name, prompt, {
      provider: options.provider,
      model: options.model,
      width: options.width ? parseInt(options.width) : undefined,
      height: options.height ? parseInt(options.height) : undefined,
      quality: options.quality,
      negativePrompt: options.negative,
    });
    console.log(chalk.green(`\n  ✓ Template "${name}" saved`));
    if (entry.variables.length > 0) {
      console.log(chalk.dim(`  Variables: ${entry.variables.map(v => `{${v}}`).join(', ')}`));
    }
    console.log('');
  });

templateCommand
  .command('list')
  .alias('ls')
  .description('List all templates')
  .action(async () => {
    const chalk = (await import('chalk')).default;
    const templates = getAllTemplates();
    if (templates.length === 0) {
      console.log(chalk.dim('\n  No templates yet. Save one with: imgforge template save <name> "<prompt>"\n'));
      return;
    }
    console.log(chalk.bold(`\n  📝 Templates (${templates.length})\n`));
    for (const t of templates) {
      const vars = t.variables.length > 0 ? chalk.cyan(` [${t.variables.map(v => `{${v}}`).join(', ')}]`) : '';
      console.log(`  ${chalk.bold(t.name)}${vars}`);
      console.log(chalk.dim(`    "${t.prompt.slice(0, 70)}${t.prompt.length > 70 ? '...' : ''}"`));
      const meta: string[] = [];
      if (t.provider) meta.push(`provider: ${t.provider}`);
      if (t.model) meta.push(`model: ${t.model}`);
      if (t.width) meta.push(`${t.width}x${t.height || t.width}`);
      if (meta.length) console.log(chalk.dim(`    ${meta.join(' | ')}`));
      console.log('');
    }
  });

templateCommand
  .command('show <name>')
  .description('Show template details')
  .action(async (name: string) => {
    const chalk = (await import('chalk')).default;
    const t = getTemplate(name);
    if (!t) {
      console.log(chalk.red(`\n  ✗ Template "${name}" not found\n`));
      return;
    }
    console.log(chalk.bold(`\n  Template: ${t.name}\n`));
    console.log(`  Prompt:    "${t.prompt}"`);
    if (t.variables.length) console.log(`  Variables: ${t.variables.map(v => `{${v}}`).join(', ')}`);
    if (t.provider) console.log(`  Provider:  ${t.provider}`);
    if (t.model) console.log(`  Model:     ${t.model}`);
    if (t.width) console.log(`  Size:      ${t.width}x${t.height || t.width}`);
    if (t.quality) console.log(`  Quality:   ${t.quality}`);
    if (t.negativePrompt) console.log(`  Negative:  ${t.negativePrompt}`);
    console.log('');
  });

templateCommand
  .command('delete <name>')
  .alias('rm')
  .description('Delete a template')
  .action(async (name: string) => {
    const chalk = (await import('chalk')).default;
    if (deleteTemplate(name)) {
      console.log(chalk.green(`  ✓ Template "${name}" deleted`));
    } else {
      console.log(chalk.red(`  ✗ Template "${name}" not found`));
    }
  });
