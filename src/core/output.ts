import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ImageGenerationResult } from '../types/index.js';
import { loadConfig } from './config.js';

export interface SaveResult {
  filePaths: string[];
}

export function saveImages(result: ImageGenerationResult, outputPath?: string): SaveResult {
  const config = loadConfig();
  const outputDir = outputPath
    ? path.dirname(outputPath)
    : config.output.directory;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filePaths: string[] = [];
  const timestamp = Date.now();

  for (let i = 0; i < result.images.length; i++) {
    const img = result.images[i];
    if (!img.base64) continue;

    let filePath: string;
    if (outputPath && result.images.length === 1) {
      filePath = outputPath;
    } else if (outputPath && result.images.length > 1) {
      const ext = path.extname(outputPath);
      const base = path.basename(outputPath, ext);
      const dir = path.dirname(outputPath);
      filePath = path.join(dir, `${base}-${i + 1}${ext}`);
    } else {
      const pattern = config.output.namingPattern;
      const modelClean = result.model.replace(/[/\\:]/g, '-');
      const name = pattern
        .replace('{provider}', result.provider)
        .replace('{model}', modelClean)
        .replace('{timestamp}', String(timestamp));
      const suffix = result.images.length > 1 ? `-${i + 1}` : '';
      filePath = path.join(outputDir, `${name}${suffix}.png`);
    }

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const buffer = Buffer.from(img.base64, 'base64');
    fs.writeFileSync(filePath, buffer);
    img.localPath = path.resolve(filePath);
    filePaths.push(img.localPath);
  }

  return { filePaths };
}
