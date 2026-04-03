/**
 * @framesquared/ui – MenuManager
 *
 * Singleton that tracks all open menus and closes them when the
 * user clicks outside of any menu.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export class MenuManager {
  private static instance: MenuManager | null = null;
  private menus: any[] = [];
  private listening = false;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  static getInstance(): MenuManager {
    if (!MenuManager.instance) {
      MenuManager.instance = new MenuManager();
    }
    return MenuManager.instance;
  }

  register(menu: any): void {
    if (!this.menus.includes(menu)) {
      this.menus.push(menu);
    }
    this.startListening();
  }

  unregister(menu: any): void {
    const idx = this.menus.indexOf(menu);
    if (idx !== -1) this.menus.splice(idx, 1);
    if (this.menus.length === 0) this.stopListening();
  }

  getOpenMenus(): any[] {
    return [...this.menus];
  }

  closeAll(): void {
    const snapshot = [...this.menus];
    for (const menu of snapshot) {
      if (typeof menu.hide === 'function') menu.hide();
    }
    this.menus.length = 0;
    this.stopListening();
  }

  private onDocumentMouseDown = (e: MouseEvent): void => {
    const snapshot = [...this.menus];
    for (const menu of snapshot) {
      if (menu.el && !menu.el.contains(e.target as Node)) {
        menu.hide();
      }
    }
  };

  private startListening(): void {
    if (this.listening) return;
    this.listening = true;
    document.addEventListener('mousedown', this.onDocumentMouseDown);
  }

  private stopListening(): void {
    if (!this.listening) return;
    this.listening = false;
    document.removeEventListener('mousedown', this.onDocumentMouseDown);
  }
}
