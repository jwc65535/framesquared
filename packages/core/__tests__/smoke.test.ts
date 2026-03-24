import { describe, it, expect } from 'vitest';
import { VERSION } from '../src/index.js';

describe('@framesquared/core', () => {
  it('should export VERSION equal to 0.0.1', () => {
    expect(VERSION).toBe('0.0.1');
  });

  it('should export VERSION as a string', () => {
    expect(typeof VERSION).toBe('string');
  });
});
