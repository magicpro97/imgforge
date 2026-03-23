export interface AppConfig {
  providers: Record<string, ProviderConfig>;
  defaults: DefaultsConfig;
  history: HistoryConfig;
  output: OutputConfig;
}

export interface ProviderConfig {
  apiKey?: string;
  enabled: boolean;
  defaultModel?: string;
  endpoint?: string;
}

export interface DefaultsConfig {
  provider: string;
  model: string;
  width: number;
  height: number;
  quality: 'standard' | 'hd' | 'ultra';
  format: 'png' | 'jpg' | 'webp';
  count: number;
}

export interface OutputConfig {
  directory: string;
  namingPattern: string;
}

export interface HistoryConfig {
  enabled: boolean;
  maxEntries: number;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  provider: string;
  model: string;
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  quality: string;
  outputFiles: string[];
  elapsed: number;
  cost?: number;
}
