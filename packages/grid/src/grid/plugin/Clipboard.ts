/**
 * @ext-ts/grid – Clipboard plugin
 *
 * Copies grid data to the clipboard in TSV (tab-separated) format
 * for spreadsheet compatibility.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export class GridClipboard {
  private grid: any = null;

  init(grid: any): void {
    this.grid = grid;
  }

  getGridText(): string {
    if (!this.grid) return '';
    const store = this.grid.getStore();
    const records = store.getRange();
    const columns = this.grid.getColumns();

    const lines: string[] = [];

    // Header
    lines.push(columns.map((c: any) => c.text).join('\t'));

    // Data
    for (const rec of records) {
      const cells = columns.map((c: any) => {
        const val = c.getCellValue(rec);
        return val === null || val === undefined ? '' : String(val);
      });
      lines.push(cells.join('\t'));
    }

    return lines.join('\n');
  }

  async doCopy(): Promise<void> {
    const text = this.getGridText();
    this.grid?.fire?.('beforecopy', this.grid, text);

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      // Clipboard API may not be available
    }

    this.grid?.fire?.('copy', this.grid, text);
  }
}
