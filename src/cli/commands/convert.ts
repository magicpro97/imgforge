import * as fs from 'node:fs';
import * as path from 'node:path';

interface ConvertOptions {
  to?: string;
  width?: string;
  height?: string;
  quality?: string;
  output?: string;
}

export async function convertCommand(input: string, options: ConvertOptions): Promise<void> {
  const chalk = (await import('chalk')).default;

  if (!fs.existsSync(input)) {
    console.error(chalk.red(`\n  ✗ File not found: ${input}\n`));
    process.exit(1);
  }

  const targetFormat = options.to || 'webp';
  const inputExt = path.extname(input).slice(1).toLowerCase();

  // Read the image as buffer
  const buffer = fs.readFileSync(input);

  // Determine output path
  const baseName = path.basename(input, path.extname(input));
  const outputDir = path.dirname(options.output || input);
  const outputPath = options.output || path.join(outputDir, `${baseName}.${targetFormat}`);

  // For basic format conversion, we re-encode using base64 roundtrip
  // For full conversion support, we'd need sharp — but to keep deps minimal,
  // we handle PNG/JPG/WebP natively where possible
  if (inputExt === targetFormat) {
    console.log(chalk.yellow(`\n  Input is already ${targetFormat}. Nothing to do.\n`));
    return;
  }

  // Try sharp for real conversion, fall back to warning
  try {
    // Dynamic import — sharp is optional
    const sharpModule = await import(/* webpackIgnore: true */ 'sharp' as string);
    const sharp = sharpModule.default;
    const outDir = path.dirname(outputPath);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    let pipeline = sharp(buffer);
    if (options.width || options.height) {
      pipeline = pipeline.resize(
        options.width ? parseInt(options.width) : undefined,
        options.height ? parseInt(options.height) : undefined,
      );
    }
    const quality = options.quality ? parseInt(options.quality) : undefined;
    if (targetFormat === 'webp') pipeline = pipeline.webp({ quality });
    else if (targetFormat === 'png') pipeline = pipeline.png();
    else if (targetFormat === 'jpg' || targetFormat === 'jpeg') pipeline = pipeline.jpeg({ quality });
    else if (targetFormat === 'avif') pipeline = pipeline.avif({ quality });

    await pipeline.toFile(outputPath);
    console.log(chalk.bold('\n  🔄 ImgForge - Format Convert'));
    console.log(chalk.green(`  ✓ ${input} → ${outputPath}`));
    console.log('');
  } catch {
    console.error(chalk.red('\n  ✗ Format conversion requires the "sharp" package.'));
    console.error(chalk.dim('    Install it with: npm install sharp'));
    console.error(chalk.dim('    Then retry: imgforge convert ' + input + ' --to ' + targetFormat));
    console.log('');
    process.exit(1);
  }
}
