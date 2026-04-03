/**
 * @framesquared/app – Application
 *
 * The entry point for an framesquared application.  Manages lifecycle
 * (init → beforeLaunch → launch → onLaunch), controller and
 * store registries, and provides a singleton accessor.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ViewController } from './ViewController.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface ApplicationConfig {
  name: string;
  appFolder?: string;
  controllers?: string[];
  stores?: string[];
  mainView?: string;
  launch?: () => void;
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let instance: Application | null = null;

// ---------------------------------------------------------------------------
// Application
// ---------------------------------------------------------------------------

export class Application {
  private _name: string;
  private _launchFn: (() => void) | null;
  private _controllers = new Map<string, ViewController>();
  private _stores = new Map<string, any>();

  /** Overridable lifecycle hooks. */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onInit: () => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onBeforeLaunch: () => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onLaunch: () => void = () => {};

  constructor(config: ApplicationConfig) {
    this._name = config.name;
    this._launchFn = config.launch ?? null;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    instance = this;
  }

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  start(): void {
    this.onInit();
    this.onBeforeLaunch();
    this._launchFn?.();
    this.onLaunch();
  }

  // -----------------------------------------------------------------------
  // Accessors
  // -----------------------------------------------------------------------

  getName(): string {
    return this._name;
  }

  // -----------------------------------------------------------------------
  // Controllers
  // -----------------------------------------------------------------------

  registerController(name: string, controller: ViewController): void {
    this._controllers.set(name, controller);
  }

  getController(name: string): ViewController | undefined {
    return this._controllers.get(name);
  }

  // -----------------------------------------------------------------------
  // Stores
  // -----------------------------------------------------------------------

  registerStore(name: string, store: any): void {
    this._stores.set(name, store);
  }

  getStore(name: string): any {
    return this._stores.get(name);
  }

  // -----------------------------------------------------------------------
  // Singleton
  // -----------------------------------------------------------------------

  static getInstance(): Application | null {
    return instance;
  }

  static clearInstance(): void {
    instance = null;
  }
}
