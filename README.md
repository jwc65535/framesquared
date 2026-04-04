# framesquared

A clean-room reimplementation of enterprise-grade UI for the modern web. Built with TypeScript 5.5+, native ESM modules, and a passion for developer experience.

## Design Principles

- **Pure TypeScript + ESM** — no AMD, no CommonJS in source
- **No IE support** — leverages modern APIs freely (Proxy, WeakMap, WeakRef, ResizeObserver, MutationObserver, IntersectionObserver, etc.)
- **Test-Driven Development** — every feature is specified by tests before implementation
- **Zero dependency on original ExtJS source** — clean-room reimplementation

## Packages

| Package | Scope | Description |
|---------|-------|-------------|
| `@framesquared/core` | `packages/core` | Class system, events, utilities |
| `@framesquared/data` | `packages/data` | Models, stores, proxies |
| `@framesquared/component` | `packages/component` | Component model, lifecycle, rendering |
| `@framesquared/layout` | `packages/layout` | Layout managers |
| `@framesquared/ui` | `packages/ui` | Panels, buttons, toolbars, and other widgets |
| `@framesquared/form` | `packages/form` | Form fields and validation |
| `@framesquared/grid` | `packages/grid` | Grid/table component |
| `@framesquared/dd` | `packages/dd` | Drag and drop |
| `@framesquared/app` | `packages/app` | Application architecture (MVC/MVVM) |
| `@framesquared/fx` | `packages/fx` | Animations and effects |
| `@framesquared/theme` | `packages/theme` | Theming and CSS-in-JS token system |

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
