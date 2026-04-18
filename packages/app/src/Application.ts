/**
 * @framesquared/app – Application
 *
 * The entry point for an framesquared application.  Manages lifecycle
 * (init → beforeLaunch → launch → onLaunch), controller and
 * store registries, and provides a singleton accessor.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ViewController } from './ViewController.js';
import { ThemeManager } from '@framesquared/theme';
import type { Theme } from '@framesquared/theme';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface ApplicationConfig {
  name: string;
  appFolder?: string;
  controllers?: string[];
  stores?: string[];
  mainView?: string;
  /**
   * Theme to activate before launch.  Pass a Theme instance to register and
   * activate it in one step, or a string to activate an already-registered
   * theme by name.
   */
  theme?: Theme | string;
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
  private _theme: Theme | string | null;
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
    this._theme = config.theme ?? null;
    if (config.launch) {
      this.launch = config.launch;
    }
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    instance = this;
  }

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  /** Called after theme activation and before onLaunch. Override in subclasses or supply via config. */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  launch(): void {}

  start(): void {
    if (this._theme) {
      if (typeof this._theme === 'string') {
        ThemeManager.setTheme(this._theme);
      } else {
        ThemeManager.register(this._theme);
        ThemeManager.setTheme(this._theme.getName());
      }
    }
    this.onInit();
    this.onBeforeLaunch();
    this.launch();
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
