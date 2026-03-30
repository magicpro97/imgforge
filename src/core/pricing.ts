import * as fs from 'node:fs';
import * as path from 'node:path';
import { getConfigDir } from './config.js';

// Cost pricing per image by provider and model
const PRICING: Record<string, Record<string, number>> = {
  openai: {
    'dall-e-3': 0.040,
    'dall-e-3-hd': 0.080,
    'dall-e-3-hd-wide': 0.120,
    'dall-e-2': 0.020,
    'gpt-image-1': 0.040,
    '_default': 0.040,
    '_edit': 0.040,
    '_variation': 0.020,
  },
  gemini: {
    'gemini-2.5-flash-image': 0.039,
    'gemini-3.1-flash-image-preview': 0.039,
    'gemini-2.0-flash-preview-image-generation': 0.039,
    'imagen-4.0-generate-001': 0.040,
    'imagen-4.0-ultra-generate-001': 0.060,
    'imagen-3.0-generate-002': 0.030,
    '_default': 0.039,
  },
  stability: {
    'sd3-large': 0.065,
    'sd3-medium': 0.035,
    'sd3-large-turbo': 0.040,
    'stable-image-core': 0.030,
    'stable-image-ultra': 0.080,
    '_default': 0.065,
    '_upscale': 0.250,
    '_remove-bg': 0.020,
  },
  replicate: {
    'black-forest-labs/flux-1.1-pro': 0.040,
    'black-forest-labs/flux-schnell': 0.003,
    'stability-ai/sdxl': 0.010,
    '_default': 0.040,
  },
  pollinations: {
    '_default': 0,
  },
};

export function estimateCost(
  provider: string,
  model: string,
  options?: { quality?: string; width?: number; height?: number; operation?: string }
): number {
  const providerPricing = PRICING[provider];
  if (!providerPricing) return 0;

  // Check for special operations
  if (options?.operation) {
    const opPrice = providerPricing[`_${options.operation}`];
    if (opPrice !== undefined) return opPrice;
  }

  // Special pricing for OpenAI HD/wide
  if (provider === 'openai' && model === 'dall-e-3') {
    const isHd = options?.quality === 'hd';
    const isWide = (options?.width || 1024) > (options?.height || 1024);
    if (isHd && isWide) return PRICING.openai['dall-e-3-hd-wide'];
    if (isHd) return PRICING.openai['dall-e-3-hd'];
  }

  return providerPricing[model] ?? providerPricing['_default'] ?? 0;
}

export function getAllPricing(): Record<string, Record<string, number>> {
  return PRICING;
}

// --- Cost persistence ---

export interface CostEntry {
  id: string;
  timestamp: string;
  provider: string;
  model: string;
  count: number;
  cost: number;
}

const COSTS_FILE = path.join(getConfigDir(), 'costs.json');

function loadCosts(): CostEntry[] {
  try {
    if (!fs.existsSync(COSTS_FILE)) return [];
    return JSON.parse(fs.readFileSync(COSTS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveCosts(entries: CostEntry[]): void {
  const dir = path.dirname(COSTS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(COSTS_FILE, JSON.stringify(entries, null, 2), 'utf-8');
}

export function addCostEntry(entry: Omit<CostEntry, 'id' | 'timestamp'>): CostEntry {
  const fullEntry: CostEntry = {
    id: `cost-${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  const entries = loadCosts();
  entries.push(fullEntry);
  saveCosts(entries);
  return fullEntry;
}

export function getCostHistory(): CostEntry[] {
  return loadCosts();
}

export function getCostSummary(): Record<string, number> {
  const entries = loadCosts();
  const summary: Record<string, number> = { total: 0 };
  for (const entry of entries) {
    summary[entry.provider] = (summary[entry.provider] ?? 0) + entry.cost;
    summary.total += entry.cost;
  }
  return summary;
}

export function clearCosts(): void {
  if (fs.existsSync(COSTS_FILE)) {
    fs.unlinkSync(COSTS_FILE);
  }
}
