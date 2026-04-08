# @framesquared/example-tree-explorer

## 0.3.1

### Patch Changes

- TreeGridLockable.ts fixes: - Panel body is set to display:flex; flex-direction:row inline (overrides the theme's column default) - Locked panel: display:flex; flex-direction:column; flex:0 0 <W>px; overflow-x:hidden; overflow-y:auto — width computed from col.width sum - Normal panel: display:flex; flex-direction:column; flex:1 1 0; overflow-x:auto; overflow-y:auto - View overflow overridden to visible so the panel element is the scroll container (required for scroll-sync to work) - Table width set to the exact pixel sum of its columns so table-layout:fixed produces real column widths instead of compressing everything to fit - Selection wiring (itemclick → grid.select, selectionchange → markSelected) built into the plugin
- Updated dependencies
  - @framesquared/ui@0.5.1
  - @framesquared/component@0.5.1
  - @framesquared/core@0.5.1
  - @framesquared/data@0.5.1
  - @framesquared/form@0.5.1
  - @framesquared/grid@0.5.1
  - @framesquared/layout@0.5.1
  - @framesquared/theme@0.5.1

## 0.3.0

### Minor Changes

- 30424e2: Fix expand/collapse.

### Patch Changes

- Updated dependencies [30424e2]
  - @framesquared/component@0.5.0
  - @framesquared/core@0.5.0
  - @framesquared/data@0.5.0
  - @framesquared/form@0.5.0
  - @framesquared/grid@0.5.0
  - @framesquared/layout@0.5.0
  - @framesquared/theme@0.5.0
  - @framesquared/ui@0.5.0

## 0.2.0

### Minor Changes

- TreeGrid CSS changes

### Patch Changes

- Changes CSS for TreeGrid
- Updated dependencies
- Updated dependencies
  - @framesquared/component@0.4.0
  - @framesquared/core@0.4.0
  - @framesquared/data@0.4.0
  - @framesquared/form@0.4.0
  - @framesquared/grid@0.4.0
  - @framesquared/layout@0.4.0
  - @framesquared/theme@0.4.0
  - @framesquared/ui@0.4.0

## 0.1.1

### Patch Changes

- Updated dependencies [68841b9]
- Updated dependencies [2007346]
  - @framesquared/component@0.2.0
  - @framesquared/core@0.2.0
  - @framesquared/data@0.2.0
  - @framesquared/form@0.2.0
  - @framesquared/grid@0.2.0
  - @framesquared/layout@0.2.0
  - @framesquared/theme@0.2.0
  - @framesquared/ui@0.2.0
