/**
 * @ext-ts/data – Schema
 *
 * Singleton registry for Model classes and their associations.
 * Handles forward references: if Model A declares an association to
 * Model B by string name before B is registered, the reference is
 * resolved when B is later registered.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Model } from './Model.js';
import { Association } from './association/Association.js';
import type { AssociationConfig } from './association/Association.js';
import { HasOne } from './association/HasOne.js';
import { HasMany } from './association/HasMany.js';
import { BelongsTo } from './association/BelongsTo.js';
import { ManyToMany } from './association/ManyToMany.js';

// ---------------------------------------------------------------------------
// Internal storage
// ---------------------------------------------------------------------------

/** className → Model class */
const models = new Map<string, typeof Model>();

/** className → Association[] (owned by that model) */
const associations = new Map<string, Association[]>();

/** modelName → list of unresolved Association references waiting for it */
const pendingReferences = new Map<string, Association[]>();

// ---------------------------------------------------------------------------
// SchemaImpl
// ---------------------------------------------------------------------------

class SchemaImpl {
  /**
   * Registers a Model class and processes its association declarations.
   * If the model has `static hasOne`, `static hasMany`, `static belongsTo`,
   * or `static manyToMany` arrays, creates Association instances for each.
   */
  register(ModelClass: typeof Model): void {
    const name = ModelClass.$className;
    models.set(name, ModelClass);

    // Process association declarations
    this.processAssociations(ModelClass, 'hasOne', HasOne);
    this.processAssociations(ModelClass, 'hasMany', HasMany);
    this.processAssociations(ModelClass, 'belongsTo', BelongsTo);
    this.processAssociations(ModelClass, 'manyToMany', ManyToMany);

    // Resolve any pending forward references to this model
    const pending = pendingReferences.get(name);
    if (pending) {
      for (const assoc of pending) {
        assoc.associatedModel = ModelClass;
      }
      pendingReferences.delete(name);
    }
  }

  /**
   * Retrieves a registered Model class by name.
   */
  get(name: string): typeof Model | undefined {
    return models.get(name);
  }

  /**
   * Returns all Association instances owned by the given model name.
   */
  getAssociations(modelName: string): Association[] {
    return associations.get(modelName) ?? [];
  }

  /**
   * Clears all registrations (for testing).
   */
  clear(): void {
    models.clear();
    associations.clear();
    pendingReferences.clear();
  }

  // -----------------------------------------------------------------------
  // Internal: process static association arrays
  // -----------------------------------------------------------------------

  private processAssociations(
    ModelClass: typeof Model,
    staticProp: string,
    AssocClass: new (ownerName: string, config: AssociationConfig) => Association,
  ): void {
    const configs = (ModelClass as any)[staticProp] as AssociationConfig[] | undefined;
    if (!configs || !Array.isArray(configs)) return;

    const ownerName = ModelClass.$className;
    if (!associations.has(ownerName)) {
      associations.set(ownerName, []);
    }
    const list = associations.get(ownerName)!;

    for (const config of configs) {
      const assoc = new AssocClass(ownerName, config);

      // Resolve model reference
      const modelRef = config.model;
      if (typeof modelRef === 'string') {
        const resolved = models.get(modelRef);
        if (resolved) {
          assoc.associatedModel = resolved;
        } else {
          // Forward reference — park it for later resolution
          if (!pendingReferences.has(modelRef)) {
            pendingReferences.set(modelRef, []);
          }
          pendingReferences.get(modelRef)!.push(assoc);
        }
      } else {
        // Direct class reference
        assoc.associatedModel = modelRef as typeof Model;
      }

      list.push(assoc);
    }
  }
}

/** Singleton. */
export const Schema = new SchemaImpl();
