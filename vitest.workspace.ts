import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/core/vitest.config.ts',
  'packages/data/vitest.config.ts',
  'packages/component/vitest.config.ts',
  'packages/layout/vitest.config.ts',
  'packages/ui/vitest.config.ts',
  'packages/form/vitest.config.ts',
  'packages/grid/vitest.config.ts',
  'packages/dd/vitest.config.ts',
  'packages/app/vitest.config.ts',
  'packages/fx/vitest.config.ts',
  'packages/theme/vitest.config.ts',
  'packages/integration-tests/vitest.config.ts',
]);
