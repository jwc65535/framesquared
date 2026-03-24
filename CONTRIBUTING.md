# Contributing to framesquared

Thank you for your interest in contributing! This guide covers everything you need to get started.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/framesquared/framesquared.git
cd framesquared

# Install dependencies (pnpm required)
pnpm install

# Build all packages in dependency order
pnpm build

# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate API documentation
pnpm run docs
```

### Requirements

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **TypeScript** knowledge (the entire codebase is TypeScript)

## Project Structure

```
framesquared/
├── packages/
│   ├── core/           # Class system, events, utilities, ARIA, i18n
│   ├── data/           # Models, stores, proxies
│   ├── component/      # Component lifecycle, rendering
│   ├── layout/         # Layout managers
│   ├── ui/             # Panels, buttons, toolbars, menus, tabs
│   ├── form/           # Form fields and validation
│   ├── grid/           # Grid, tree, selection models
│   ├── dd/             # Drag and drop
│   ├── fx/             # Animations (Web Animations API)
│   ├── app/            # Application architecture (MVC/MVVM)
│   ├── theme/          # Theming and CSS tokens
│   ├── framesquared/         # Umbrella package (re-exports)
│   ├── integration-tests/
│   └── build-tests/
├── docs/
│   ├── guide/          # Developer guides (Markdown)
│   └── api/            # Generated API docs (TypeDoc)
├── examples/           # Example applications
└── typedoc.json
```

### Package Dependency Graph

```
core (no deps)
  ├── data
  ├── component
  │     ├── layout
  │     ├── ui
  │     │     ├── form
  │     │     └── grid
  │     ├── dd
  │     └── fx
  ├── app
  └── theme
```

Packages may only depend on packages above them in this graph. No circular dependencies.

## Development Workflow

### Test-Driven Development

Every feature follows TDD:

1. **Write failing tests** in `packages/<pkg>/__tests__/`
2. **Implement** the feature in `packages/<pkg>/src/`
3. **Verify** all tests pass: `pnpm --filter @framesquared/<pkg> test`
4. **Build** to check types: `pnpm --filter @framesquared/<pkg> build`

### Running Tests

```bash
# All tests
pnpm test

# Single package
pnpm --filter @framesquared/core test

# Watch mode for a package
pnpm --filter @framesquared/ui test -- --watch

# With coverage
pnpm --filter @framesquared/core test -- --coverage
```

### Building

```bash
# Build all packages
pnpm build

# Build single package
pnpm --filter @framesquared/core build

# Build must be done in dependency order for first build
```

## Code Style

### TypeScript Conventions

- **ESM only** — `import`/`export`, never `require`/`module.exports`
- **ES2022 target** — use modern APIs freely (no IE support)
- **Strict mode** — all strict flags enabled in tsconfig
- **`declare` pattern** for instance properties: `declare private _myProp: Type;`
- **Underscore prefix** for private properties: `_config`, `_items`, `_el`
- **Static `$className`** on every class for debugging
- **`eslint-disable` comments** must cite the specific rule

### File Organization

- One primary class per file, named to match the class
- Test files: `__tests__/<feature>.test.ts`
- Barrel exports: `src/index.ts` (re-exports only, no logic)
- Configs: `interface FooConfig` in same file or dedicated types file

### Naming

- Classes: `PascalCase` (`Grid`, `FormPanel`, `RowSelectionModel`)
- Interfaces: `PascalCase` with descriptive suffix (`GridConfig`, `StoreConfig`)
- Functions/methods: `camelCase` (`getToken`, `setActiveTab`)
- Constants: `UPPER_SNAKE_CASE` (`SAFE_TAGS`, `ACTION_METHODS`)
- Files: `PascalCase.ts` for classes, `camelCase.ts` for utilities

### Security

- **Never use raw `innerHTML`** with user-provided content
- Use `Sanitizer.sanitize()` from `@framesquared/core` for any HTML from untrusted sources
- **No `eval()`** except in XTemplate (which sanitizes inputs)
- **No prototype pollution** — guard against `__proto__`, `constructor`, `prototype` keys
- All URLs in `href`/`src` must pass URL safety checks

### Documentation

Every public API must have JSDoc:

```typescript
/**
 * Sets the active tab by index.
 *
 * @param index - Zero-based tab index
 * @fires beforetabchange
 * @fires tabchange
 * @since 0.1.0
 *
 * @example
 * ```typescript
 * tabPanel.setActiveTab(2);
 * ```
 */
setActiveTab(index: number): void {
```

## Submitting Changes

### Pull Request Process

1. Fork the repository and create a feature branch from `main`
2. Write tests for your changes (TDD)
3. Ensure all tests pass: `pnpm test`
4. Ensure build succeeds: `pnpm build`
5. Run linting: `pnpm lint`
6. Submit a PR with a clear description

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(grid): add column reordering via drag
fix(store): prevent duplicate records on reload
docs(guide): add grid editing examples
test(form): add cross-field validation tests
refactor(core): simplify Observable mixin
perf(data): optimize Store.filter for large datasets
```

### PR Checklist

- [ ] Tests pass (`pnpm test`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Lint passes (`pnpm lint`)
- [ ] New tests written for new features
- [ ] JSDoc added for new public APIs
- [ ] No TODO/FIXME comments (implement or create issue)
- [ ] No `innerHTML` with unsanitized content
- [ ] Integration tests updated if cross-package change

## Architecture Decision Records

Key decisions are documented inline in code comments. Major ones:

- **Component.fire() returns boolean** — enables event cancellation (e.g., `beforetabchange`)
- **Model uses Proxy** — field access via `record.name` delegates to `record.get('name')`
- **Module-level singletons** — DragManager, Router, ThemeManager, LocaleManager use const objects, not class instances
- **No Component dependency in dd/fx** — avoids circular deps; integration happens at the app level
- **WAAPI for animations** — Web Animations API is the sole engine; no CSS transition fallbacks
- **Intl API for i18n** — number/date formatting uses native `Intl.NumberFormat`/`Intl.DateTimeFormat`
- **CSS custom properties for theming** — runtime theme switching without rebuild

## Getting Help

- Open an issue for bugs or feature requests
- Discussion topics for architecture questions
- Check existing tests for API usage examples
