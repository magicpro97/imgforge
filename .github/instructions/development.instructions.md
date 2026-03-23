---
applyTo: "**/*.ts"
---

# ImgForge Development Instructions

This is the **ImgForge CLI** project — a multi-provider AI image generator CLI tool.

## Architecture

- `src/providers/` — Each file implements `ImageProvider` abstract class from `base.ts`
- `src/core/config.ts` — Config stored at `~/.imgforge/config.json`
- `src/core/history.ts` — Generation history log
- `src/core/output.ts` — Image saving and file management
- `src/cli/commands/` — Commander.js command handlers
- `src/cli/interactive.ts` — Inquirer.js interactive menu mode
- `src/types/` — TypeScript interfaces

## Adding a New Provider

1. Create `src/providers/<name>.ts` extending `ImageProvider`
2. Implement: `info`, `configure()`, `isConfigured()`, `validate()`, `generate()`, `listModels()`
3. Register in `src/providers/index.ts` providerRegistry Map
4. Add default config entry in `src/core/config.ts` DEFAULT_CONFIG

## Conventions

- ESM modules (`"type": "module"` in package.json)
- All imports use `.js` extension (TypeScript ESM requirement)
- Dynamic imports for chalk/ora (ESM-only packages)
- Node.js 20+ required (inquirer uses `styleText` from `node:util`)
- No external HTTP dependencies — use built-in `fetch`
