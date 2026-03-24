/**
 * @ext-ts/app – Stub
 *
 * Internal representation of data nodes in the ViewModel.
 * ValueStub holds plain values with dirty tracking.
 * FormulaStub holds computed functions with dependency management.
 */

// ---------------------------------------------------------------------------
// Base Stub
// ---------------------------------------------------------------------------

export abstract class Stub {
  readonly name: string;
  private _dependents: Stub[] = [];

  constructor(name: string) {
    this.name = name;
  }

  addDependent(stub: Stub): void {
    if (!this._dependents.includes(stub)) {
      this._dependents.push(stub);
    }
  }

  removeDependent(stub: Stub): void {
    const idx = this._dependents.indexOf(stub);
    if (idx >= 0) this._dependents.splice(idx, 1);
  }

  getDependents(): Stub[] {
    return [...this._dependents];
  }
}

// ---------------------------------------------------------------------------
// ValueStub
// ---------------------------------------------------------------------------

export class ValueStub extends Stub {
  private _value: unknown;
  private _dirty = false;

  constructor(name: string, value: unknown) {
    super(name);
    this._value = value;
  }

  getValue(): unknown {
    return this._value;
  }

  setValue(value: unknown): void {
    if (this._value !== value) {
      this._value = value;
      this._dirty = true;
    }
  }

  isDirty(): boolean {
    return this._dirty;
  }

  clearDirty(): void {
    this._dirty = false;
  }
}

// ---------------------------------------------------------------------------
// FormulaStub
// ---------------------------------------------------------------------------

export class FormulaStub extends Stub {
  private _fn: () => unknown;
  private _dependencies: Stub[] = [];
  private _cachedValue: unknown = undefined;
  private _dirty = true;

  constructor(name: string, fn: () => unknown) {
    super(name);
    this._fn = fn;
  }

  compute(): unknown {
    this._cachedValue = this._fn();
    this._dirty = false;
    return this._cachedValue;
  }

  getCachedValue(): unknown {
    return this._cachedValue;
  }

  markDirty(): void {
    this._dirty = true;
  }

  isDirty(): boolean {
    return this._dirty;
  }

  addDependency(stub: Stub): void {
    if (!this._dependencies.includes(stub)) {
      this._dependencies.push(stub);
      stub.addDependent(this);
    }
  }

  getDependencies(): Stub[] {
    return [...this._dependencies];
  }

  clearDependencies(): void {
    for (const dep of this._dependencies) {
      dep.removeDependent(this);
    }
    this._dependencies = [];
  }
}
