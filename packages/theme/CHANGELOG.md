# @framesquared/theme

## 0.5.1

### Patch Changes

- TreeGridLockable.ts fixes: - Panel body is set to display:flex; flex-direction:row inline (overrides the theme's column default) - Locked panel: display:flex; flex-direction:column; flex:0 0 <W>px; overflow-x:hidden; overflow-y:auto — width computed from col.width sum - Normal panel: display:flex; flex-direction:column; flex:1 1 0; overflow-x:auto; overflow-y:auto - View overflow overridden to visible so the panel element is the scroll container (required for scroll-sync to work) - Table width set to the exact pixel sum of its columns so table-layout:fixed produces real column widths instead of compressing everything to fit - Selection wiring (itemclick → grid.select, selectionchange → markSelected) built into the plugin
- Updated dependencies
  - @framesquared/core@0.5.1

## 0.5.0

### Minor Changes

- 30424e2: Fix expand/collapse.

### Patch Changes

- Updated dependencies [30424e2]
  - @framesquared/core@0.5.0

## 0.4.0

### Minor Changes

- TreeGrid CSS changes

### Patch Changes

- Changes CSS for TreeGrid
- Updated dependencies
- Updated dependencies
  - @framesquared/core@0.4.0

## 0.2.0

### Minor Changes

- 68841b9: Initial public release of all @framesquared packages.

  A TypeScript-native UI component library — class system, events, data layer,
  tree/grid components, drag-and-drop, animations, layouts, and theming.

- 2007346: Initial public release of all @framesquared packages.

  A TypeScript-native UI component library — class system, events, data layer,
  tree/grid components, drag-and-drop, animations, layouts, and theming.

### Patch Changes

- Updated dependencies [68841b9]
- Updated dependencies [2007346]
  - @framesquared/core@0.2.0
