import { createConfigManager } from '@magicpro97/forge-core';
import type { AppConfig } from '../types/index.js';

const DEFAULT_CONFIG: AppConfig = {
  providers: {
    openai: { enabled: true },
    gemini: { enabled: true },
    pollinations: { enabled: true },
    stability: { enabled: true },
    replicate: { enabled: true },
  },
  defaults: {
    provider: 'pollinations',
    model: '',
    width: 1024,
    height: 1024,
    quality: 'standard',
    format: 'png',
    count: 1,
    preset: '',
  },
  history: {
    enabled: true,
    maxEntries: 500,
  },
  output: {
    directory: './imgforge-output',
    namingPattern: '{provider}-{model}-{timestamp}',
  },
  cost: {
    budget: 0,
    currency: 'USD',
    trackingEnabled: true,
  },
  autoOpen: false,
  plugins: [],
};

const configManager = createConfigManager({
  toolName: 'imgforge',
  defaultConfig: DEFAULT_CONFIG as AppConfig & Record<string, unknown>,
});

export const loadConfig = configManager.loadConfig as () => AppConfig;
export const saveConfig = configManager.saveConfig as (config: AppConfig) => void;
export const getConfigValue = configManager.getConfigValue;
export const setConfigValue = configManager.setConfigValue;
export const getProviderApiKey = configManager.getProviderApiKey;
export const setProviderApiKey = configManager.setProviderApiKey;
export const getConfigDir = configManager.getConfigDir;
export const getConfigFilePath = configManager.getConfigFilePath;
