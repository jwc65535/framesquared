/**
 * @ext-ts/data – Association (base class)
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Model } from '../Model.js';

export interface AssociationConfig {
  model: string | typeof Model;
  foreignKey: string;
  primaryKey?: string;
  getterName?: string;
  setterName?: string;
  cascade?: boolean;
  /** For ManyToMany: junction model name or class */
  through?: string;
  /** For ManyToMany: the other foreign key in the junction */
  otherKey?: string;
}

export type AssociationType = 'hasOne' | 'hasMany' | 'belongsTo' | 'manyToMany';

export class Association {
  readonly type: AssociationType;
  readonly config: AssociationConfig;
  readonly ownerModelName: string;

  /** Resolved associated model class (may be null until forward ref resolves). */
  associatedModel: typeof Model | null = null;

  constructor(type: AssociationType, ownerModelName: string, config: AssociationConfig) {
    this.type = type;
    this.ownerModelName = ownerModelName;
    this.config = config;
  }

  /**
   * The property name used for nested JSON loading and as the
   * default getter/collection accessor name.
   */
  get associationName(): string {
    if (!this.associatedModel) return '';
    // Derive from classname: 'test.Address' → 'address', 'test.Order' → 'orders'
    const raw = this.associatedModel.$className.split('.').pop()!;
    const lower = raw[0].toLowerCase() + raw.slice(1);
    if (this.type === 'hasMany' || this.type === 'manyToMany') {
      // Simple pluralise: add 's'
      return lower.endsWith('s') ? lower : lower + 's';
    }
    return lower;
  }

  get getterName(): string {
    if (this.config.getterName) return this.config.getterName;
    const name = this.associationName;
    return `get${name[0].toUpperCase()}${name.slice(1)}`;
  }

  get setterName(): string {
    if (this.config.setterName) return this.config.setterName;
    const name = this.associationName;
    return `set${name[0].toUpperCase()}${name.slice(1)}`;
  }

  get foreignKey(): string {
    return this.config.foreignKey;
  }

  get primaryKey(): string {
    return this.config.primaryKey ?? 'id';
  }

  get cascade(): boolean {
    return this.config.cascade ?? false;
  }
}
