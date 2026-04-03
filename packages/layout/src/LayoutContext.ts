/**
 * @framesquared/layout – LayoutContext
 *
 * Holds layout state during a layout run.  Caches element measurements
 * to avoid layout thrashing (repeated reads/writes to the DOM).
 */

// ---------------------------------------------------------------------------
// LayoutContext
// ---------------------------------------------------------------------------

export class LayoutContext {
  /** Generic property cache (layout-level state). */
  private props = new Map<string, number>();

  /** Per-element DOM measurement cache: element → (propName → value). */
  private domCache = new WeakMap<Element, Map<string, number>>();

  // -----------------------------------------------------------------------
  // Generic props
  // -----------------------------------------------------------------------

  /**
   * Gets a layout-level property value.
   */
  getProp(name: string): number | undefined {
    return this.props.get(name);
  }

  /**
   * Sets a layout-level property value.
   */
  setProp(name: string, value: number): void {
    this.props.set(name, value);
  }

  // -----------------------------------------------------------------------
  // DOM measurement caching
  // -----------------------------------------------------------------------

  /**
   * Gets a cached DOM measurement, or reads it via `readFn` and caches the result.
   * This prevents repeated layout-triggering reads on the same element.
   */
  getDomProp(name: string, element: Element, readFn: () => number): number {
    let cache = this.domCache.get(element);
    if (!cache) {
      cache = new Map();
      this.domCache.set(element, cache);
    }

    if (cache.has(name)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return cache.get(name)!;
    }

    const value = readFn();
    cache.set(name, value);
    return value;
  }

  /**
   * Returns true if a DOM measurement has been cached for the given element+prop.
   */
  hasDomProp(name: string, element: Element): boolean {
    const cache = this.domCache.get(element);
    return cache?.has(name) ?? false;
  }

  // -----------------------------------------------------------------------
  // Flush
  // -----------------------------------------------------------------------

  /**
   * Clears all cached data.  Called at the start of a new layout run.
   */
  flush(): void {
    this.props.clear();
    // WeakMap doesn't have a clear method, so replace it
    this.domCache = new WeakMap();
  }
}
