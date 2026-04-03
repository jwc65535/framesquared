/**
 * @framesquared/core – KeyMap
 *
 * Maps key combinations to handlers.  Supports modifier keys
 * (Ctrl, Alt, Shift, Meta) with exact matching.
 *
 * ```ts
 * const km = new KeyMap({
 *   target: myElement,
 *   bindings: [
 *     { key: 'Ctrl+S', handler: onSave, preventDefault: true },
 *     { key: 'Escape', handler: onClose },
 *   ],
 * });
 * ```
 */

/* eslint-disable @typescript-eslint/no-unsafe-function-type */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface KeyBinding {
  /** Key combo string, e.g. `"Ctrl+Shift+S"`, `"Enter"`, `"Alt+F4"`. */
  key: string;
  /** Handler called when the combo matches. */
  handler: Function;
  /** Optional `this` scope for the handler. */
  scope?: object;
  /** If true, `e.preventDefault()` is called when the combo matches. */
  preventDefault?: boolean;
}

export interface KeyMapConfig {
  target: Element;
  bindings: KeyBinding[];
}

// ---------------------------------------------------------------------------
// Internal: parsed binding
// ---------------------------------------------------------------------------

interface ParsedBinding {
  raw: KeyBinding;
  keyLower: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
}

function parseBinding(binding: KeyBinding): ParsedBinding {
  const parts = binding.key.split('+').map((p) => p.trim());
  let ctrl = false;
  let alt = false;
  let shift = false;
  let meta = false;

  // The last part is the key; preceding parts are modifiers.
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const keyPart = parts.pop()!;

  for (const mod of parts) {
    switch (mod.toLowerCase()) {
      case 'ctrl':
      case 'control':
        ctrl = true;
        break;
      case 'alt':
        alt = true;
        break;
      case 'shift':
        shift = true;
        break;
      case 'meta':
      case 'cmd':
      case 'command':
        meta = true;
        break;
    }
  }

  return {
    raw: binding,
    keyLower: keyPart.toLowerCase(),
    ctrl,
    alt,
    shift,
    meta,
  };
}

function matchesEvent(parsed: ParsedBinding, e: KeyboardEvent): boolean {
  if (e.key.toLowerCase() !== parsed.keyLower) return false;
  if (e.ctrlKey !== parsed.ctrl) return false;
  if (e.altKey !== parsed.alt) return false;
  if (e.shiftKey !== parsed.shift) return false;
  if (e.metaKey !== parsed.meta) return false;
  return true;
}

// ---------------------------------------------------------------------------
// KeyMap
// ---------------------------------------------------------------------------

export class KeyMap {
  private target: Element;
  private parsedBindings: ParsedBinding[] = [];
  private enabled = true;
  private handleKeyDown: (e: Event) => void;

  constructor(config: KeyMapConfig) {
    this.target = config.target;

    for (const b of config.bindings) {
      this.parsedBindings.push(parseBinding(b));
    }

    this.handleKeyDown = (e: Event) => this.onKeyDown(e as KeyboardEvent);
    this.target.addEventListener('keydown', this.handleKeyDown);
  }

  // ----- event handler -----

  private onKeyDown(e: KeyboardEvent): void {
    if (!this.enabled) return;

    for (const parsed of this.parsedBindings) {
      if (matchesEvent(parsed, e)) {
        if (parsed.raw.preventDefault) {
          e.preventDefault();
        }
        parsed.raw.handler.call(parsed.raw.scope, e);
      }
    }
  }

  // ----- public API -----

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  addBinding(binding: KeyBinding): void {
    this.parsedBindings.push(parseBinding(binding));
  }

  removeBinding(binding: KeyBinding): void {
    const idx = this.parsedBindings.findIndex((p) => p.raw === binding);
    if (idx !== -1) this.parsedBindings.splice(idx, 1);
  }

  destroy(): void {
    this.target.removeEventListener('keydown', this.handleKeyDown);
    this.parsedBindings.length = 0;
    this.enabled = false;
  }
}
