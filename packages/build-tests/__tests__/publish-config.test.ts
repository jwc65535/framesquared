/**
 * TDD: Publish configuration validation
 *
 * Ensures every publishable package is correctly configured for
 * public release on the npmjs.com registry under @framesquared.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const ROOT = resolve(fileURLToPath(import.meta.url), '../../../..');

const PUBLISHABLE = [
  'core',
  'data',
  'component',
  'layout',
  'ui',
  'form',
  'grid',
  'dd',
  'fx',
  'app',
  'theme',
];

const NPM_REGISTRY = 'https://registry.npmjs.org';

// ═══════════════════════════════════════════════════════════════════════════
// package.json publish fields
// ═══════════════════════════════════════════════════════════════════════════

describe('npm publish configuration', () => {
  for (const pkg of PUBLISHABLE) {
    const pkgJson = JSON.parse(readFileSync(join(ROOT, 'packages', pkg, 'package.json'), 'utf-8'));

    it(`@framesquared/${pkg}: is not marked private`, () => {
      expect(pkgJson.private).not.toBe(true);
    });

    it(`@framesquared/${pkg}: has a license field`, () => {
      expect(pkgJson.license).toBeDefined();
      expect(typeof pkgJson.license).toBe('string');
      expect(pkgJson.license.length).toBeGreaterThan(0);
    });

    it(`@framesquared/${pkg}: has publishConfig.access = "public"`, () => {
      expect(pkgJson.publishConfig).toBeDefined();
      expect(pkgJson.publishConfig.access).toBe('public');
    });

    it(`@framesquared/${pkg}: has publishConfig.registry pointing to npmjs.com`, () => {
      expect(pkgJson.publishConfig).toBeDefined();
      expect(pkgJson.publishConfig.registry).toBe(NPM_REGISTRY);
    });

    it(`@framesquared/${pkg}: has a description`, () => {
      expect(pkgJson.description).toBeDefined();
      expect(typeof pkgJson.description).toBe('string');
      expect(pkgJson.description.length).toBeGreaterThan(0);
    });

    it(`@framesquared/${pkg}: has a files array including "dist"`, () => {
      expect(Array.isArray(pkgJson.files)).toBe(true);
      expect(pkgJson.files).toContain('dist');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// Changeset configuration
// ═══════════════════════════════════════════════════════════════════════════

describe('Changeset configuration', () => {
  const changesetConfig = JSON.parse(
    readFileSync(join(ROOT, '.changeset', 'config.json'), 'utf-8'),
  );

  it('changeset access is set to "public"', () => {
    expect(changesetConfig.access).toBe('public');
  });

  it('changeset baseBranch is "main"', () => {
    expect(changesetConfig.baseBranch).toBe('main');
  });

  it('non-publishable packages are in the ignore list', () => {
    const ignored: string[] = changesetConfig.ignore ?? [];
    expect(ignored).toContain('@framesquared/build-tests');
    expect(ignored).toContain('@framesquared/integration-tests');
  });

  it('all publishable packages are in the linked group', () => {
    const linked: string[][] = changesetConfig.linked ?? [];
    const allLinked = linked.flat();
    for (const pkg of PUBLISHABLE) {
      expect(allLinked).toContain(`@framesquared/${pkg}`);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// publish.yml workflow validation
// ═══════════════════════════════════════════════════════════════════════════

describe('publish.yml workflow', () => {
  const workflowPath = join(ROOT, '.github', 'workflows', 'publish.yml');

  it('publish.yml exists', () => {
    expect(existsSync(workflowPath)).toBe(true);
  });

  const workflow = parseYaml(readFileSync(workflowPath, 'utf-8')) as Record<string, unknown>;

  it('workflow triggers on push to main', () => {
    const on = workflow.on as Record<string, unknown>;
    expect(on.push).toBeDefined();
    const push = on.push as Record<string, unknown>;
    expect(push.branches).toContain('main');
  });

  it('workflow uses npmjs.com registry-url', () => {
    const jobs = workflow.jobs as Record<string, unknown>;
    const jobNames = Object.keys(jobs);
    let found = false;
    for (const jobName of jobNames) {
      const job = jobs[jobName] as Record<string, unknown>;
      const steps = (job.steps as Record<string, unknown>[]) ?? [];
      for (const step of steps) {
        const uses = step.uses as string | undefined;
        if (uses?.startsWith('actions/setup-node')) {
          const withBlock = step.with as Record<string, unknown> | undefined;
          if (withBlock?.['registry-url'] === NPM_REGISTRY) {
            found = true;
          }
        }
      }
    }
    expect(found).toBe(true);
  });

  it('workflow references NPM_TOKEN secret', () => {
    const raw = readFileSync(workflowPath, 'utf-8');
    expect(raw).toContain('NPM_TOKEN');
  });

  it('workflow runs pnpm build before publish', () => {
    const raw = readFileSync(workflowPath, 'utf-8');
    expect(raw).toContain('pnpm build');
  });

  it('workflow has changesets publish step', () => {
    const raw = readFileSync(workflowPath, 'utf-8');
    expect(raw).toMatch(/changesets\/action/);
  });

  it('workflow publish command is not commented out', () => {
    const raw = readFileSync(workflowPath, 'utf-8');
    // The publish key inside the changesets action step must not be commented
    const lines = raw.split('\n');
    const publishLines = lines.filter((l) => l.trimStart().startsWith('publish:'));
    expect(publishLines.length).toBeGreaterThan(0);
    // None of the active publish lines should be preceded by '#'
    for (const line of publishLines) {
      expect(line.trimStart().startsWith('#')).toBe(false);
    }
  });
});
