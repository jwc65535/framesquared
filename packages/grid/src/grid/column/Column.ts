/**
 * @ext-ts/grid – Column types
 *
 * Column (base), NumberColumn, DateColumn, BooleanColumn,
 * CheckColumn, ActionColumn, RowNumbererColumn.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Column config
// ---------------------------------------------------------------------------

export interface ColumnConfig {
  text?: string;
  dataIndex?: string;
  width?: number;
  flex?: number;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  hideable?: boolean;
  hidden?: boolean;
  align?: 'left' | 'center' | 'right';
  renderer?: (value: unknown, metaData: any, record: any, rowIndex: number, colIndex: number) => string;
  menuDisabled?: boolean;
  resizable?: boolean;
  draggable?: boolean;
  tdCls?: string;
  xtype?: string;
  // Number
  format?: string;
  // Boolean
  trueText?: string;
  falseText?: string;
  // Action
  actions?: ActionConfig[];
}

export interface ActionConfig {
  iconCls?: string;
  tooltip?: string;
  handler?: (record: any, rowIndex: number) => void;
}

// ---------------------------------------------------------------------------
// Column (base)
// ---------------------------------------------------------------------------

export class Column {
  readonly text: string;
  readonly dataIndex: string;
  readonly width: number;
  readonly flex: number;
  readonly minWidth: number;
  readonly maxWidth: number;
  readonly sortable: boolean;
  readonly hidden: boolean;
  readonly align: string;
  readonly config: ColumnConfig;

  private _renderer: ColumnConfig['renderer'] | null;

  constructor(config: ColumnConfig = {}) {
    this.config = config;
    this.text = config.text ?? '';
    this.dataIndex = config.dataIndex ?? '';
    this.width = config.width ?? 0;
    this.flex = config.flex ?? 0;
    this.minWidth = config.minWidth ?? 40;
    this.maxWidth = config.maxWidth ?? 0;
    this.sortable = config.sortable ?? true;
    this.hidden = config.hidden ?? false;
    this.align = config.align ?? 'left';
    this._renderer = config.renderer ?? null;
  }

  getCellValue(record: any): unknown {
    return record.get ? record.get(this.dataIndex) : record.data?.[this.dataIndex];
  }

  renderCell(value: unknown, metaData: any, record: any, rowIndex: number, colIndex: number): string {
    if (this._renderer) {
      return this._renderer(value, metaData, record, rowIndex, colIndex);
    }
    return this.formatValue(value);
  }

  formatValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    return String(value);
  }

  /** Create the TD content — override in special columns. */
  renderCellHtml(value: unknown, _metaData: any, record: any, rowIndex: number, colIndex: number): string {
    return this.renderCell(value, _metaData, record, rowIndex, colIndex);
  }
}

// ---------------------------------------------------------------------------
// NumberColumn
// ---------------------------------------------------------------------------

export class NumberColumn extends Column {
  private _format: string;

  constructor(config: ColumnConfig = {}) {
    super({ ...config, xtype: 'numbercolumn' });
    this._format = config.format ?? '0';
  }

  override formatValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    const n = Number(value);
    if (isNaN(n)) return String(value);

    // Simple format: '0.00' → toFixed(2), '0.0' → toFixed(1)
    const match = this._format.match(/0\.(0+)/);
    if (match) {
      return n.toFixed(match[1].length);
    }
    return String(n);
  }
}

// ---------------------------------------------------------------------------
// DateColumn
// ---------------------------------------------------------------------------

export class DateColumn extends Column {
  private _format: string;

  constructor(config: ColumnConfig = {}) {
    super({ ...config, xtype: 'datecolumn' });
    this._format = config.format ?? 'Y-m-d';
  }

  override formatValue(value: unknown): string {
    if (!value) return '';
    const d = value instanceof Date ? value : new Date(String(value));
    if (isNaN(d.getTime())) return String(value);

    // Simple format implementation
    const Y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return this._format
      .replace('Y', String(Y))
      .replace('m', m)
      .replace('d', day);
  }
}

// ---------------------------------------------------------------------------
// BooleanColumn
// ---------------------------------------------------------------------------

export class BooleanColumn extends Column {
  private _trueText: string;
  private _falseText: string;

  constructor(config: ColumnConfig = {}) {
    super({ ...config, xtype: 'booleancolumn' });
    this._trueText = config.trueText ?? 'true';
    this._falseText = config.falseText ?? 'false';
  }

  override formatValue(value: unknown): string {
    return value ? this._trueText : this._falseText;
  }
}

// ---------------------------------------------------------------------------
// CheckColumn
// ---------------------------------------------------------------------------

export class CheckColumn extends Column {
  constructor(config: ColumnConfig = {}) {
    super({ ...config, xtype: 'checkcolumn' });
  }

  override renderCellHtml(value: unknown, _metaData: any, _record: any, _rowIndex: number, _colIndex: number): string {
    const checked = value ? ' checked' : '';
    return `<input type="checkbox"${checked} class="x-check-col-input" />`;
  }
}

// ---------------------------------------------------------------------------
// ActionColumn
// ---------------------------------------------------------------------------

export class ActionColumn extends Column {
  private _actions: ActionConfig[];

  constructor(config: ColumnConfig = {}) {
    super({ ...config, xtype: 'actioncolumn', sortable: false });
    this._actions = config.actions ?? [];
  }

  get actions(): ActionConfig[] { return this._actions; }

  override renderCellHtml(_value: unknown, _metaData: any, _record: any, rowIndex: number, _colIndex: number): string {
    return this._actions.map((a, ai) =>
      `<span class="x-action-col-icon ${a.iconCls ?? ''}" ` +
      `title="${a.tooltip ?? ''}" data-action="${ai}" data-row="${rowIndex}"></span>`
    ).join('');
  }
}

// ---------------------------------------------------------------------------
// RowNumbererColumn
// ---------------------------------------------------------------------------

export class RowNumbererColumn extends Column {
  constructor(config: ColumnConfig = {}) {
    super({ text: '#', width: 40, sortable: false, ...config, xtype: 'rownumberer', dataIndex: '' });
  }

  override renderCellHtml(_value: unknown, _metaData: any, _record: any, rowIndex: number, _colIndex: number): string {
    return String(rowIndex + 1);
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createColumn(config: ColumnConfig): Column {
  switch (config.xtype) {
    case 'numbercolumn': return new NumberColumn(config);
    case 'datecolumn': return new DateColumn(config);
    case 'booleancolumn': return new BooleanColumn(config);
    case 'checkcolumn': return new CheckColumn(config);
    case 'actioncolumn': return new ActionColumn(config);
    case 'rownumberer': return new RowNumbererColumn(config);
    default: return new Column(config);
  }
}
