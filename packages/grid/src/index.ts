/**
 * @framesquared/grid
 * Grid/table component
 */

import './styles.js';

export { Grid } from './grid/Grid.js';
export type { GridConfig } from './grid/Grid.js';
export type { GridStore, GridRecord } from './grid/GridStore.js';
export { GridView } from './grid/GridView.js';
export type { GridViewConfig } from './grid/GridView.js';
export { HeaderContainer } from './grid/HeaderContainer.js';
export {
  Column,
  NumberColumn,
  DateColumn,
  BooleanColumn,
  CheckColumn,
  ActionColumn,
  RowNumbererColumn,
  createColumn,
} from './grid/column/Column.js';
export type { ColumnConfig, ActionConfig } from './grid/column/Column.js';

// Features
export { Grouping } from './grid/feature/Grouping.js';
export type { GroupingConfig } from './grid/feature/Grouping.js';
export { Summary } from './grid/feature/Summary.js';
export type { SummaryConfig, SummaryType } from './grid/feature/Summary.js';
export { GroupingSummary } from './grid/feature/GroupingSummary.js';
export type { GroupingSummaryConfig } from './grid/feature/GroupingSummary.js';
export { RowBody } from './grid/feature/RowBody.js';
export type { RowBodyConfig } from './grid/feature/RowBody.js';

// Plugins
export { CellEditing } from './grid/plugin/CellEditing.js';
export { RowEditing } from './grid/plugin/RowEditing.js';
export { RowExpander } from './grid/plugin/RowExpander.js';
export type { RowExpanderConfig } from './grid/plugin/RowExpander.js';
export { GridClipboard } from './grid/plugin/Clipboard.js';
export { GridDragDrop } from './grid/plugin/DragDrop.js';

// Selection models
export { RowSelectionModel } from './grid/selection/RowSelectionModel.js';
export type {
  RowSelectionModelConfig,
  SelectableGrid,
} from './grid/selection/RowSelectionModel.js';
export { CellSelectionModel } from './grid/selection/CellSelectionModel.js';
export type { CellPosition } from './grid/selection/CellSelectionModel.js';
export { SpreadsheetSelectionModel } from './grid/selection/SpreadsheetSelectionModel.js';
export type { SelectionRange } from './grid/selection/SpreadsheetSelectionModel.js';

// Lockable
export { Lockable } from './grid/Lockable.js';

// State
export { GridState } from './grid/state/GridState.js';
export type { GridStateConfig } from './grid/state/GridState.js';

// Tree
export { TreePanel } from './tree/TreePanel.js';
export type { TreePanelConfig } from './tree/TreePanel.js';
export { TreeStore } from './tree/TreeStore.js';
export type { TreeStoreConfig, TreeNodeConfig, TreeNode } from './tree/TreeStore.js';
