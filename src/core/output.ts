import { saveOutputFiles, type SaveResult } from '@magicpro97/forge-core';
import type { ImageGenerationResult } from '../types/index.js';
import { loadConfig } from './config.js';

export type { SaveResult };

export function saveImages(result: ImageGenerationResult, outputPath?: string): SaveResult {
  const config = loadConfig();
  return saveOutputFiles(result.images, {
    outputPath,
    outputDir: config.output.directory,
    namingPattern: config.output.namingPattern,
    provider: result.provider,
    model: result.model,
    extension: 'png',
  });
}
