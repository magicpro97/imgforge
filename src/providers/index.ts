import { ImageProvider } from './base.js';
import { OpenAIProvider } from './openai.js';
import { GeminiProvider } from './gemini.js';
import { PollinationsProvider } from './pollinations.js';
import { StabilityProvider } from './stability.js';
import { ReplicateProvider } from './replicate.js';

export { ImageProvider } from './base.js';
export { OpenAIProvider } from './openai.js';
export { GeminiProvider } from './gemini.js';
export { PollinationsProvider } from './pollinations.js';
export { StabilityProvider } from './stability.js';
export { ReplicateProvider } from './replicate.js';

const providerRegistry = new Map<string, () => ImageProvider>([
  ['openai', () => new OpenAIProvider()],
  ['gemini', () => new GeminiProvider()],
  ['pollinations', () => new PollinationsProvider()],
  ['stability', () => new StabilityProvider()],
  ['replicate', () => new ReplicateProvider()],
]);

export function createProvider(name: string): ImageProvider {
  const factory = providerRegistry.get(name.toLowerCase());
  if (!factory) {
    const available = Array.from(providerRegistry.keys()).join(', ');
    throw new Error(`Unknown provider "${name}". Available: ${available}`);
  }
  return factory();
}

export function getAllProviderNames(): string[] {
  return Array.from(providerRegistry.keys());
}

export function createAllProviders(): Map<string, ImageProvider> {
  const providers = new Map<string, ImageProvider>();
  for (const [name, factory] of providerRegistry) {
    providers.set(name, factory());
  }
  return providers;
}
