/**
 * @framesquared/data – Field system
 *
 * Defines field types with type coercion, serialization, and defaults.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// FieldType enum
// ---------------------------------------------------------------------------

export enum FieldType {
  STRING = 'string',
  INT = 'int',
  FLOAT = 'float',
  BOOLEAN = 'boolean',
  DATE = 'date',
  AUTO = 'auto',
}

// ---------------------------------------------------------------------------
// Validator type (function signature)
// ---------------------------------------------------------------------------

export type Validator = (value: unknown, record?: any) => string | null;

// ---------------------------------------------------------------------------
// FieldDefinition
// ---------------------------------------------------------------------------

export interface FieldDefinition {
  name: string;
  type?: FieldType;
  defaultValue?: unknown;
  convert?: (value: unknown, record?: any) => unknown;
  serialize?: (value: unknown, record?: any) => unknown;
  mapping?: string;
  persist?: boolean;
  critical?: boolean;
  allowNull?: boolean;
  sortType?: string;
  validators?: Validator[];
}

// ---------------------------------------------------------------------------
// Base Field class
// ---------------------------------------------------------------------------

export abstract class Field {
  readonly name: string;
  readonly type: FieldType;
  readonly mapping: string | undefined;
  readonly persist: boolean;
  readonly critical: boolean;
  readonly allowNull: boolean;
  readonly sortType: string | undefined;
  readonly validators: Validator[];
  private readonly customConvert?: (value: unknown, record?: any) => unknown;
  private readonly customSerialize?: (value: unknown, record?: any) => unknown;
  private readonly customDefault: unknown;

  constructor(def: FieldDefinition) {
    this.name = def.name;
    this.type = def.type ?? FieldType.AUTO;
    this.mapping = def.mapping;
    this.persist = def.persist ?? true;
    this.critical = def.critical ?? false;
    this.allowNull = def.allowNull ?? false;
    this.sortType = def.sortType;
    this.validators = def.validators ?? [];
    this.customConvert = def.convert;
    this.customSerialize = def.serialize;
    this.customDefault = def.defaultValue;
  }

  /** Type-specific default (overridden by subclasses). */
  get defaultValue(): unknown {
    return this.customDefault !== undefined ? this.customDefault : this.getTypeDefault();
  }

  /** Subclass provides the type-specific default. */
  protected abstract getTypeDefault(): unknown;

  /**
   * Converts a raw value to the field's type.
   * If a custom `convert` was specified in the definition, it is used.
   * Otherwise delegates to the subclass's `coerce()`.
   */
  convert(value: unknown, record?: any): unknown {
    if (this.customConvert) {
      return this.customConvert(value, record);
    }
    if (value === null && this.allowNull) return null;
    if (value === undefined) return this.defaultValue;
    return this.coerce(value);
  }

  /** Type-specific coercion (subclasses override). */
  protected abstract coerce(value: unknown): unknown;

  /**
   * Serializes a value for transport.
   */
  serialize(value: unknown, record?: any): unknown {
    if (this.customSerialize) {
      return this.customSerialize(value, record);
    }
    return value;
  }
}

// ---------------------------------------------------------------------------
// StringField
// ---------------------------------------------------------------------------

export class StringField extends Field {
  constructor(def: Omit<FieldDefinition, 'type'> & { type?: FieldType }) {
    super({ ...def, type: FieldType.STRING });
  }

  protected getTypeDefault(): unknown { return ''; }

  protected coerce(value: unknown): unknown {
    if (value === null) return '';
    return String(value);
  }
}

// ---------------------------------------------------------------------------
// IntField
// ---------------------------------------------------------------------------

export class IntField extends Field {
  constructor(def: Omit<FieldDefinition, 'type'> & { type?: FieldType }) {
    super({ ...def, type: FieldType.INT });
  }

  protected getTypeDefault(): unknown { return 0; }

  protected coerce(value: unknown): unknown {
    if (value === null) return 0;
    if (typeof value === 'boolean') return value ? 1 : 0;
    const n = parseInt(String(value), 10);
    return Number.isNaN(n) ? 0 : n;
  }
}

// ---------------------------------------------------------------------------
// FloatField
// ---------------------------------------------------------------------------

export class FloatField extends Field {
  constructor(def: Omit<FieldDefinition, 'type'> & { type?: FieldType }) {
    super({ ...def, type: FieldType.FLOAT });
  }

  protected getTypeDefault(): unknown { return 0; }

  protected coerce(value: unknown): unknown {
    if (value === null) return 0;
    if (typeof value === 'boolean') return value ? 1 : 0;
    const n = parseFloat(String(value));
    return Number.isNaN(n) ? 0 : n;
  }
}

// ---------------------------------------------------------------------------
// BooleanField
// ---------------------------------------------------------------------------

const FALSE_STRINGS = new Set(['false', '0', 'no', 'off', '']);

export class BooleanField extends Field {
  constructor(def: Omit<FieldDefinition, 'type'> & { type?: FieldType }) {
    super({ ...def, type: FieldType.BOOLEAN });
  }

  protected getTypeDefault(): unknown { return false; }

  protected coerce(value: unknown): unknown {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') {
      return !FALSE_STRINGS.has(value.toLowerCase());
    }
    return Boolean(value);
  }
}

// ---------------------------------------------------------------------------
// DateField
// ---------------------------------------------------------------------------

export class DateField extends Field {
  constructor(def: Omit<FieldDefinition, 'type'> & { type?: FieldType }) {
    super({ ...def, type: FieldType.DATE });
  }

  protected getTypeDefault(): unknown { return null; }

  protected coerce(value: unknown): unknown {
    if (value instanceof Date) return value;
    if (typeof value === 'number') return new Date(value);
    if (typeof value === 'string') {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    return null;
  }

  override serialize(value: unknown): unknown {
    if (value instanceof Date) return value.toISOString();
    return value;
  }
}

// ---------------------------------------------------------------------------
// AutoField
// ---------------------------------------------------------------------------

export class AutoField extends Field {
  constructor(def: Omit<FieldDefinition, 'type'> & { type?: FieldType }) {
    super({ ...def, type: FieldType.AUTO });
  }

  protected getTypeDefault(): unknown { return undefined; }

  protected coerce(value: unknown): unknown {
    return value;
  }
}

// ---------------------------------------------------------------------------
// createField factory
// ---------------------------------------------------------------------------

const FIELD_CONSTRUCTORS: Record<string, new (def: FieldDefinition) => Field> = {
  [FieldType.STRING]: StringField,
  [FieldType.INT]: IntField,
  [FieldType.FLOAT]: FloatField,
  [FieldType.BOOLEAN]: BooleanField,
  [FieldType.DATE]: DateField,
  [FieldType.AUTO]: AutoField,
};

/**
 * Creates a Field instance from a definition or shorthand string.
 */
export function createField(def: FieldDefinition | string): Field {
  if (typeof def === 'string') {
    return new AutoField({ name: def });
  }
  const type = def.type ?? FieldType.AUTO;
  const Ctor = FIELD_CONSTRUCTORS[type] ?? AutoField;
  return new Ctor(def);
}
