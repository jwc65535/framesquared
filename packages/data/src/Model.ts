/**
 * @framesquared/data – Model
 *
 * The foundation of the data layer.  A Model represents a record with
 * typed fields, dirty tracking, validation, and event notification.
 *
 * Instances are wrapped in a Proxy so `record.name` transparently
 * delegates to `get('name')` / `set('name', value)` for field access.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Base, Observable } from '@framesquared/core';
import { Field, createField } from './field/Field.js';
import type { FieldDefinition } from './field/Field.js';
import { Schema } from './Schema.js';
import type { Association } from './association/Association.js';
import { ModelCollection, ManyToManyCollection } from './ModelCollection.js';

// ---------------------------------------------------------------------------
// ValidationResult
// ---------------------------------------------------------------------------

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ---------------------------------------------------------------------------
// Field resolution helpers
// ---------------------------------------------------------------------------

/**
 * Resolves a dot-separated mapping path from raw data.
 */
function getNestedValue(data: Record<string, unknown>, path: string): unknown {
  const segments = path.split('.');
  let current: unknown = data;
  for (const seg of segments) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[seg];
  }
  return current;
}

// ---------------------------------------------------------------------------
// Proxy handler
// ---------------------------------------------------------------------------

const MODEL_PROPS = new Set<string | symbol>([
  // Commonly accessed non-field properties/methods that should NOT
  // be intercepted by the proxy's field get/set logic.
  'constructor', 'prototype', '__proto__',
  'get', 'set', 'getData', 'getId', 'setId',
  'isModified', 'getChanges', 'commit', 'reject', 'validate', 'isValid',
  'on', 'un', 'fireEvent', 'fireEventArgs', 'addListener', 'removeListener',
  'hasListener', 'clearListeners', 'suspendEvents', 'resumeEvents', 'isSuspended',
  'mon', 'mun', 'relayEvents', 'fireEventedAction',
  'destroy', 'isDestroyed', '$destroyHooks',
  '$className', 'self', '$callStack', '$configInitialized', '$pendingConfig',
  'hasMixin', 'initConfig', 'callParent',
  'modified', 'phantom',
  '$associations', '$fieldMap', '$data',
  Symbol.dispose, Symbol.toPrimitive, Symbol.toStringTag,
]);

function createModelProxy(model: Model): Model {
  return new Proxy(model, {
    get(target, prop, receiver) {
      // If it's a known Model/Base property or symbol, use normal access
      if (MODEL_PROPS.has(prop) || typeof prop === 'symbol') {
        return Reflect.get(target, prop, receiver);
      }
      // If it exists directly on the instance or prototype, use normal access
      if (prop in target) {
        const desc = Object.getOwnPropertyDescriptor(target, prop)
          ?? Object.getOwnPropertyDescriptor(Object.getPrototypeOf(target), prop);
        if (desc?.get || typeof desc?.value === 'function') {
          return Reflect.get(target, prop, receiver);
        }
      }
      // Check if it's a field name
      if (typeof prop === 'string' && target.$fieldMap?.has(prop)) {
        return target.get(prop);
      }
      return Reflect.get(target, prop, receiver);
    },
    set(target, prop, value, receiver) {
      if (typeof prop === 'string' && target.$fieldMap?.has(prop)) {
        target.set(prop, value);
        return true;
      }
      return Reflect.set(target, prop, value, receiver);
    },
  });
}

// ---------------------------------------------------------------------------
// Model class
// ---------------------------------------------------------------------------

// Register the Observable mixin class (defined by core's define())
const ObservableMixin: typeof Base = Observable;

export class Model extends Base {
  static override $className = 'Ext.data.Model';

  /** Field definitions — override in subclasses. */
  static fields: (FieldDefinition | string)[] = [];

  /** Name of the ID field. */
  static idProperty = 'id';

  // -- Instance state (non-enumerable to keep proxy clean) --

  /** Resolved Field instances keyed by name. */
  $fieldMap!: Map<string, Field>;

  /** Current field values. */
  $data!: Record<string, unknown>;

  /** Previous values for dirty fields (fieldName → old value). */
  modified: Record<string, unknown> = {};

  /** Per-instance association storage: assocName → Model | ModelCollection */
  $associations: Map<string, Model | ModelCollection | ManyToManyCollection> = new Map();

  // -----------------------------------------------------------------------
  // Construction
  // -----------------------------------------------------------------------

  constructor(_data?: Record<string, unknown>) {
    super();
    // Will be called by create() which sets up fields + proxy
  }

  /**
   * Factory method that sets up fields, applies data, wraps in proxy.
   */
  static override create(this: typeof Model, data?: Record<string, unknown>): Model {
    const instance = new this();
    instance.$fieldMap = new Map();
    instance.$data = {};
    instance.modified = {};
    instance.$associations = new Map();

    // Resolve field definitions
    const fieldDefs = (this as any).fields as (FieldDefinition | string)[];
    for (const def of fieldDefs) {
      const field = createField(def);
      instance.$fieldMap.set(field.name, field);
    }

    // Apply Observable mixin methods if not already present
    ensureObservable(instance);

    // Load initial data
    instance.$loadData(data ?? {});

    // Process associations — install getters/setters, load nested data
    installAssociations(instance, data ?? {});

    // Wrap in proxy
    return createModelProxy(instance);
  }

  // -----------------------------------------------------------------------
  // Data loading (initial — not dirty)
  // -----------------------------------------------------------------------

  /** @internal Loads initial data without marking as dirty. */
  $loadData(rawData: Record<string, unknown>): void {
    // Store non-schema fields as-is (pass-through for custom data)
    for (const [key, value] of Object.entries(rawData)) {
      if (!this.$fieldMap.has(key)) {
        this.$data[key] = value;
      }
    }

    for (const [name, field] of this.$fieldMap) {
      let value: unknown;

      // Check mapping first
      if (field.mapping) {
        value = getNestedValue(rawData, field.mapping);
      } else {
        value = rawData[name];
      }

      // Apply field conversion
      if (value !== undefined) {
        value = field.convert(value, this);
      } else {
        value = field.defaultValue;
        if (value !== undefined) {
          value = field.convert(value, this);
        }
      }

      this.$data[name] = value;
    }
  }

  // -----------------------------------------------------------------------
  // get / set
  // -----------------------------------------------------------------------

  get(fieldName: string): unknown {
    return this.$data[fieldName];
  }

  set(fieldNameOrData: string | Record<string, unknown>, value?: unknown): string[] {
    const changes: Record<string, unknown> =
      typeof fieldNameOrData === 'string'
        ? { [fieldNameOrData]: value }
        : fieldNameOrData;

    const modifiedFields: string[] = [];

    for (const [name, newValue] of Object.entries(changes)) {
      const field = this.$fieldMap.get(name);
      if (!field) {
        // Pass-through for non-schema fields
        const oldValue = this.$data[name];
        if (newValue !== oldValue) {
          if (!(name in this.modified)) this.modified[name] = oldValue;
          this.$data[name] = newValue;
          modifiedFields.push(name);
        }
        continue;
      }

      const converted = field.convert(newValue, this);
      const oldValue = this.$data[name];

      if (converted === oldValue) continue;

      // Track dirty state — only store the first original value
      if (!(name in this.modified)) {
        this.modified[name] = oldValue;
      }

      this.$data[name] = converted;
      modifiedFields.push(name);

      // Fire idchanged if the id field changed
      const Ctor = this.constructor as typeof Model;
      if (name === Ctor.idProperty && typeof (this as any).fireEvent === 'function') {
        (this as any).fireEvent('idchanged', this, converted, oldValue);
      }
    }

    if (modifiedFields.length > 0 && typeof (this as any).fireEvent === 'function') {
      (this as any).fireEvent('change', this, modifiedFields);
    }

    return modifiedFields;
  }

  getData(options?: { serialize?: boolean }): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [name, field] of this.$fieldMap) {
      const value = this.$data[name];
      result[name] = options?.serialize ? field.serialize(value, this) : value;
    }
    return result;
  }

  // -----------------------------------------------------------------------
  // Dirty tracking
  // -----------------------------------------------------------------------

  isModified(fieldName?: string): boolean {
    if (fieldName) {
      return fieldName in this.modified;
    }
    return Object.keys(this.modified).length > 0;
  }

  getChanges(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const name of Object.keys(this.modified)) {
      result[name] = this.$data[name];
    }
    return result;
  }

  commit(silent?: boolean): void {
    this.modified = {};
    if (!silent && typeof (this as any).fireEvent === 'function') {
      (this as any).fireEvent('commit', this);
    }
  }

  reject(silent?: boolean): void {
    // Revert to previous values
    for (const [name, oldValue] of Object.entries(this.modified)) {
      this.$data[name] = oldValue;
    }
    this.modified = {};
    if (!silent && typeof (this as any).fireEvent === 'function') {
      (this as any).fireEvent('reject', this);
    }
  }

  // -----------------------------------------------------------------------
  // Identification
  // -----------------------------------------------------------------------

  getId(): string | number {
    const Ctor = this.constructor as typeof Model;
    return this.$data[Ctor.idProperty] as string | number;
  }

  setId(id: string | number): void {
    const Ctor = this.constructor as typeof Model;
    this.set(Ctor.idProperty, id);
  }

  get phantom(): boolean {
    const id = this.getId();
    return id === undefined || id === null || id === 0 || id === '';
  }

  // -----------------------------------------------------------------------
  // Validation
  // -----------------------------------------------------------------------

  validate(): ValidationResult {
    const errors: ValidationError[] = [];

    for (const [name, field] of this.$fieldMap) {
      const value = this.$data[name];
      for (const validator of field.validators) {
        const msg = validator(value, this);
        if (msg) {
          errors.push({ field: name, message: msg });
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  isValid(): boolean {
    return this.validate().valid;
  }
}

// ---------------------------------------------------------------------------
// Observable mixin integration
// ---------------------------------------------------------------------------

/**
 * Ensures the Observable mixin methods are available on the instance.
 * We copy prototype methods from Observable to Model instances at runtime.
 */
function ensureObservable(instance: Model): void {
  const proto = ObservableMixin.prototype;
  for (const name of Object.getOwnPropertyNames(proto)) {
    if (name === 'constructor') continue;
    if (name in instance) continue;
    const desc = Object.getOwnPropertyDescriptor(proto, name);
    if (desc && typeof desc.value === 'function') {
      (instance as any)[name] = desc.value.bind(instance);
    }
  }
}

// ---------------------------------------------------------------------------
// Association integration
// ---------------------------------------------------------------------------

/**
 * Processes all associations for the given instance's model class.
 * Installs getters/setters, loads nested data, sets up cascade hooks.
 */
function installAssociations(
  instance: Model,
  rawData: Record<string, unknown>,
): void {
  const modelName = (instance.constructor as typeof Model).$className;
  const assocs = Schema.getAssociations(modelName);
  if (assocs.length === 0) return;

  for (const assoc of assocs) {
    if (!assoc.associatedModel) continue;

    switch (assoc.type) {
      case 'hasOne':
        installHasOne(instance, assoc, rawData);
        break;
      case 'hasMany':
        installHasMany(instance, assoc, rawData);
        break;
      case 'belongsTo':
        installBelongsTo(instance, assoc, rawData);
        break;
      case 'manyToMany':
        installManyToMany(instance, assoc, rawData);
        break;
    }
  }
}

function installHasOne(
  instance: Model,
  assoc: Association,
  rawData: Record<string, unknown>,
): void {
  const AssocModel = assoc.associatedModel!;
  const name = assoc.associationName;
  const getterName = assoc.getterName;
  const setterName = assoc.setterName;

  // Initialise storage
  instance.$associations.set(name, null as any);

  // Getter
  (instance as any)[getterName] = function (): Model | null {
    return (instance.$associations.get(name) as Model) ?? null;
  };

  // Setter
  (instance as any)[setterName] = function (child: Model): void {
    instance.$associations.set(name, child);
    // Set foreignKey on child pointing back to this parent
    const parentId = instance.get(assoc.primaryKey);
    if (parentId !== undefined && child.$fieldMap?.has(assoc.foreignKey)) {
      child.set(assoc.foreignKey, parentId);
    }
  };

  // Load from nested data
  const nestedData = rawData[name];
  if (nestedData && typeof nestedData === 'object' && !Array.isArray(nestedData)) {
    const childData = { ...nestedData as Record<string, unknown> };
    // Set foreignKey
    const parentId = instance.get(assoc.primaryKey);
    if (parentId !== undefined) {
      childData[assoc.foreignKey] = parentId;
    }
    const child = AssocModel.create(childData);
    instance.$associations.set(name, child);
  }

  // Cascade destroy
  if (assoc.cascade) {
    instance.$destroyHooks.push(() => {
      const child = instance.$associations.get(name) as Model | null;
      if (child && !child.isDestroyed) child.destroy();
    });
  }
}

function installHasMany(
  instance: Model,
  assoc: Association,
  rawData: Record<string, unknown>,
): void {
  const AssocModel = assoc.associatedModel!;
  const name = assoc.associationName;
  const collection = new ModelCollection();
  instance.$associations.set(name, collection);

  // Collection accessor — wraps add() to auto-set foreignKey
  const wrappedCollection = {
    getCount: () => collection.getCount(),
    getAll: () => collection.getAll(),
    getById: (id: string | number) => collection.getById(id),
    filter: (fn: (record: Model) => boolean) => collection.filter(fn),
    add(child: Model) {
      const parentId = instance.get(assoc.primaryKey);
      if (parentId !== undefined && child.$fieldMap?.has(assoc.foreignKey)) {
        child.set(assoc.foreignKey, parentId);
      }
      collection.add(child);
    },
    remove(child: Model) {
      collection.remove(child);
    },
  };

  // Accessor method (e.g., user.orders())
  (instance as any)[name] = function () {
    return wrappedCollection;
  };

  // Load from nested data
  const nestedData = rawData[name];
  if (Array.isArray(nestedData)) {
    const parentId = instance.get(assoc.primaryKey);
    for (const itemData of nestedData) {
      if (typeof itemData === 'object' && itemData !== null) {
        const childData = { ...itemData as Record<string, unknown> };
        if (parentId !== undefined) {
          childData[assoc.foreignKey] = parentId;
        }
        const child = AssocModel.create(childData);
        collection.add(child);
      }
    }
  }

  // Cascade destroy
  if (assoc.cascade) {
    instance.$destroyHooks.push(() => {
      collection.destroyAll();
    });
  }
}

function installBelongsTo(
  instance: Model,
  assoc: Association,
  rawData: Record<string, unknown>,
): void {
  const AssocModel = assoc.associatedModel!;
  const name = assoc.associationName;
  const getterName = assoc.getterName;
  const setterName = assoc.setterName;

  // Initialise storage
  instance.$associations.set(name, null as any);

  // Getter
  (instance as any)[getterName] = function (): Model | null {
    return (instance.$associations.get(name) as Model) ?? null;
  };

  // Setter
  (instance as any)[setterName] = function (parent: Model): void {
    instance.$associations.set(name, parent);
    // Update foreignKey on self
    const parentId = parent.get(assoc.primaryKey);
    if (parentId !== undefined && instance.$fieldMap?.has(assoc.foreignKey)) {
      instance.set(assoc.foreignKey, parentId);
    }
  };

  // Load from nested data
  const nestedData = rawData[name];
  if (nestedData && typeof nestedData === 'object' && !Array.isArray(nestedData)) {
    const parent = AssocModel.create(nestedData as Record<string, unknown>);
    instance.$associations.set(name, parent);
  }
}

function installManyToMany(
  instance: Model,
  assoc: Association,
  rawData: Record<string, unknown>,
): void {
  const AssocModel = assoc.associatedModel!;
  const name = assoc.associationName;
  const collection = new ManyToManyCollection();
  instance.$associations.set(name, collection);

  // Accessor method
  (instance as any)[name] = function () {
    return collection;
  };

  // Load from nested data
  const nestedData = rawData[name];
  if (Array.isArray(nestedData)) {
    for (const itemData of nestedData) {
      if (typeof itemData === 'object' && itemData !== null) {
        const child = AssocModel.create(itemData as Record<string, unknown>);
        collection.link(child);
      }
    }
  }
}
