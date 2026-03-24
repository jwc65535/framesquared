# Accessibility

framesquared components include ARIA attributes, keyboard navigation, and focus management out of the box.

## Automatic ARIA Roles

Every component renders appropriate ARIA attributes:

| Component | `role` | Additional ARIA |
|-----------|--------|----------------|
| `Button` | `button` | `aria-label`, `aria-pressed` (toggle), `aria-haspopup` (menu), `aria-disabled` |
| `Panel` | `region` | `aria-label` (from title), `aria-expanded` (collapsible) |
| `Window` | `dialog` | `aria-modal`, `aria-labelledby` (title element) |
| `TabPanel` | — | Tab bar: `tablist`. Each tab: `tab` with `aria-selected`, `aria-controls` |
| `TabPanel cards` | `tabpanel` | Linked via tab's `aria-controls` |
| `Menu` | `menu` | — |
| `MenuItem` | `menuitem` | — |
| `Toolbar` | `toolbar` | — |
| `Tooltip` | `tooltip` | — |
| `Grid` (via Panel) | `region` | `aria-label` (from title) |

## AriaManager

Programmatic ARIA attribute management:

```typescript
import { AriaManager } from '@framesquared/core';

AriaManager.setRole(element, 'button');
AriaManager.setLabel(element, 'Save document');
AriaManager.setDescription(element, 'Click to save your changes');
AriaManager.setLive(element, 'polite');
```

### Screen Reader Announcements

```typescript
// Polite (waits for current speech to finish)
AriaManager.announce('File saved successfully');

// Assertive (interrupts current speech)
AriaManager.announce('Error: connection lost', 'assertive');
```

Live regions are created lazily as visually hidden elements in `document.body`.

## FocusManager

### Focus Trapping (for Modals)

```typescript
import { FocusManager } from '@framesquared/core';

// When opening a dialog
FocusManager.saveFocus();        // Remember current focus
FocusManager.trapFocus(dialog);  // Tab cycles within dialog

// When closing
FocusManager.releaseFocus();
FocusManager.restoreFocus();     // Return focus to previous element
```

### How Trapping Works

When `trapFocus` is active, a `keydown` listener on `document` intercepts Tab:
- **Tab on last focusable element** → cycles to first
- **Shift+Tab on first focusable element** → cycles to last

Focusable elements: `a[href]`, `button`, `input`, `select`, `textarea`, `[tabindex]` (not `[tabindex="-1"]`).

## Keyboard Navigation

### Grid

| Key | Action |
|-----|--------|
| Arrow keys | Navigate cells (CellSelectionModel) |
| Enter / F2 | Start editing |
| Escape | Cancel editing |
| Space | Toggle checkbox column |

### Tree

| Key | Action |
|-----|--------|
| Arrow Down/Up | Move between visible nodes |
| Arrow Right | Expand node |
| Arrow Left | Collapse node |
| Enter | Select/activate node |
| Space | Toggle checkbox |

### TabPanel

| Key | Action |
|-----|--------|
| Arrow Left/Right | Switch tabs |
| Home | First tab |
| End | Last tab |

### Menu

| Key | Action |
|-----|--------|
| Arrow Down/Up | Navigate items |
| Enter | Select item |
| Escape | Close menu |
| Arrow Right | Open submenu |
| Arrow Left | Close submenu |

### Dialog / Window

| Key | Action |
|-----|--------|
| Tab | Cycle focusable elements |
| Escape | Close dialog |

## i18n and RTL

```typescript
import { LocaleManager, arSA } from '@framesquared/core';

LocaleManager.register(arSA);
LocaleManager.setLocale('ar-SA');
// Sets dir="rtl" and lang="ar-SA" on <html>
// All layouts automatically flip direction
```

## Best Practices

1. Always provide `title` on Panels — it becomes `aria-label`
2. Always provide `text` on Buttons — it becomes `aria-label`
3. Use `fieldLabel` on form fields — it creates associated `<label>` elements
4. Set `modal: true` on dialog Windows — enables `aria-modal` and focus trapping
5. Use `AriaManager.announce()` for dynamic status updates (record saved, errors)
6. Test with a screen reader (VoiceOver, NVDA, JAWS)
