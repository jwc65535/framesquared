# 04 · Checkbox Tree

## Overview

Demonstrates a tri-state checkbox tree showing application feature permissions. Each node can be checked (☑), unchecked (☐), or indeterminate (◪). Indeterminate state means "some but not all children are checked" — common in permission trees where you want to grant partial access to a group.

## Key Concepts

- **`checkable: true`** — adds a checkbox to every tree node.
- **`cascadeChecks: true`** — enables automatic propagation of check/uncheck operations.
- **`checkPropagation: 'both'`** — checks propagate both down (checking parent checks all children) and up (unchecking a child updates parent to indeterminate). Other modes: `'down'` (cascade only), `'up'` (bubble only), `'none'` (independent checkboxes).
- **Indeterminate state** — when `$checked === null`, the checkbox shows as ◪ (a minus sign in a box). This state is computed automatically when `'up'` or `'both'` propagation is active.
- **`getChecked()`** — returns all nodes where `$checked === true`.
- **`getCheckedLeaves()`** — returns only leaf nodes that are checked.

## Try It

1. Check **User Management** — all 4 child permissions are checked automatically.
2. Uncheck **Delete Users** — "User Management" becomes indeterminate (◪).
3. Change **Check Propagation** to `'down'` — then uncheck a child and notice the parent does NOT update.
4. Click **Check All** then **Uncheck All** to reset.
5. Click **Get Checked Leaves** to see only the leaf permissions that are checked.

## Source Highlights

1. **Pre-set `$checked` values** — nodes in the dataset start with `$checked: true`, `$checked: false`, or `$checked: null` (indeterminate). This is how you initialize checkbox state.
2. **`checkchange` event** — fires whenever a checkbox is toggled, with the node and new value. Use this to sync to a server or update a permissions UI.
3. **`updateCheckedCount`** — calls `getChecked()` and updates the footer display. Wire this to `checkchange` for live updates.

## Real-World Use

Use checkbox trees for permission editors, feature flag dashboards, bulk-select operations, or any scenario where users need to select subsets of a hierarchy.

## Related Examples

- [08 · Selection Modes](#selection) — row selection (distinct from checkbox state)
- [12 · Clipboard](#clipboard) — copy checked items to clipboard
