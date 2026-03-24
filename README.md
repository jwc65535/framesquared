# ext-ts

A modern, clean-room reimplementation of the Sencha ExtJS framework in TypeScript with native ESM modules.

## Design Principles

- **Pure TypeScript + ESM** — no AMD, no CommonJS in source
- **No IE support** — leverages modern APIs freely (Proxy, WeakMap, WeakRef, ResizeObserver, MutationObserver, IntersectionObserver, etc.)
- **Test-Driven Development** — every feature is specified by tests before implementation
- **Zero dependency on original ExtJS source** — clean-room reimplementation

## Packages

| Package | Scope | Description |
|---------|-------|-------------|
| `@ext-ts/core` | `packages/core` | Class system, events, utilities |
| `@ext-ts/data` | `packages/data` | Models, stores, proxies |
| `@ext-ts/component` | `packages/component` | Component model, lifecycle, rendering |
| `@ext-ts/layout` | `packages/layout` | Layout managers |
| `@ext-ts/ui` | `packages/ui` | Panels, buttons, toolbars, and other widgets |
| `@ext-ts/form` | `packages/form` | Form fields and validation |
| `@ext-ts/grid` | `packages/grid` | Grid/table component |
| `@ext-ts/dd` | `packages/dd` | Drag and drop |
| `@ext-ts/app` | `packages/app` | Application architecture (MVC/MVVM) |
| `@ext-ts/fx` | `packages/fx` | Animations and effects |
| `@ext-ts/theme` | `packages/theme` | Theming and CSS-in-JS token system |

## Getting Started

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type-check all packages
pnpm typecheck

# Lint
pnpm lint
```

## Requirements

- Node.js >= 18.0.0
- pnpm >= 8.0.0

## Tech Stack

- **Language:** TypeScript 5.5+ (ES2022 target)
- **Modules:** Native ESM
- **Test Runner:** Vitest with jsdom
- **Bundler:** tsup (ESM-only output)
- **Linting:** ESLint 9 (flat config) + @typescript-eslint
- **Formatting:** Prettier
- **Git Hooks:** Husky + lint-staged
