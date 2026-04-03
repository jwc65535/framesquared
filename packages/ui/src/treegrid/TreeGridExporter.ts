/**
 * @framesquared/ui – TreeGridExporter
 *
 * Exports TreeGrid data to CSV, JSON, TSV, and XLSX formats.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { NodeInterface } from '@framesquared/data';
import type { TreeGrid } from './TreeGrid.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExportOptions {
  includeHeaders?: boolean;
  includeHidden?: boolean;
  expandedOnly?: boolean;
  allNodes?: boolean;
  indentCharacter?: string;
  indentMultiplier?: number;
  columns?: string[];
  filename?: string;
}

// ---------------------------------------------------------------------------
// TreeGridExporter
// ---------------------------------------------------------------------------

export class TreeGridExporter {
  /**
   * Exports the TreeGrid to CSV format.
   */
  static exportToCsv(treeGrid: TreeGrid, options: ExportOptions = {}): string {
    const rows = TreeGridExporter._buildRows(treeGrid, options, '\t', true);
    return rows.map((r) => r.join(',')).join('\n');
  }

  /**
   * Exports the TreeGrid to TSV format.
   */
  static exportToTsv(treeGrid: TreeGrid, options: ExportOptions = {}): string {
    const rows = TreeGridExporter._buildRows(treeGrid, options, '\t', false);
    return rows.map((r) => r.join('\t')).join('\n');
  }

  /**
   * Exports the TreeGrid to nested JSON preserving hierarchy.
   */
  static exportToJson(treeGrid: TreeGrid, options: ExportOptions = {}): string {
    const columns = TreeGridExporter._getColumns(treeGrid, options);
    const root = treeGrid.getRootNode();

    const serializeNode = (node: NodeInterface): Record<string, unknown> => {
      const data: Record<string, unknown> = {};
      for (const col of columns) {
        data[col.dataIndex] = (node as any).get?.(col.dataIndex);
      }
      if (!node.isLeaf() && node.childNodes.length > 0) {
        const childrenToInclude = options.expandedOnly
          ? node.childNodes.filter((c) => c.isExpanded() || c.isLeaf())
          : node.childNodes;
        if (childrenToInclude.length > 0) {
          data.children = childrenToInclude.map(serializeNode);
        }
      }
      return data;
    };

    const childrenToExport = options.expandedOnly
      ? root.childNodes.filter((c) => c.isExpanded() || c.isLeaf())
      : root.childNodes;

    if (childrenToExport.length === 1 && !treeGrid.isRootVisible()) {
      return JSON.stringify(serializeNode(childrenToExport[0]), null, 2);
    }

    return JSON.stringify(childrenToExport.map(serializeNode), null, 2);
  }

  /**
   * Exports the TreeGrid to XLSX format.
   * Returns an ArrayBuffer with the XLSX bytes.
   */
  static exportToXlsx(treeGrid: TreeGrid, options: ExportOptions = {}): ArrayBuffer {
    // Simple XLSX implementation using the SpreadsheetML format
    const rows = TreeGridExporter._buildRows(treeGrid, options, '  ', false);

    // Build a minimal xlsx file
    const xmlRows = rows
      .map((row, rowIdx) => {
        const cells = row
          .map((cell, colIdx) => {
            const colLetter = String.fromCharCode(65 + colIdx);
            return `<c r="${colLetter}${rowIdx + 1}" t="inlineStr"><is><t>${_escapeXml(cell)}</t></is></c>`;
          })
          .join('');
        return `<row r="${rowIdx + 1}">${cells}</row>`;
      })
      .join('');

    const sheetXml = `<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetData>${xmlRows}</sheetData>
</worksheet>`;

    // Encode to ArrayBuffer — create a proper ArrayBuffer in the current realm
    const bytes: number[] = [];
    for (let i = 0; i < sheetXml.length; i++) {
      const code = sheetXml.charCodeAt(i);
      if (code < 0x80) {
        bytes.push(code);
      } else if (code < 0x800) {
        bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
      } else {
        bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
      }
    }
    const buffer = new ArrayBuffer(bytes.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) view[i] = bytes[i];
    return buffer;
  }

  /**
   * Triggers a browser download with the given content.
   */
  static download(content: string | ArrayBuffer, filename: string, mimeType: string): void {
    const blob =
      content instanceof ArrayBuffer
        ? new Blob([content], { type: mimeType })
        : new Blob([content], { type: mimeType });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private static _buildRows(
    treeGrid: TreeGrid,
    options: ExportOptions,
    indentChar: string,
    indentTreeCol: boolean,
  ): string[][] {
    const columns = TreeGridExporter._getColumns(treeGrid, options);
    const nodes = TreeGridExporter._getNodes(treeGrid, options);
    const rows: string[][] = [];

    if (options.includeHeaders !== false) {
      rows.push(columns.map((c) => c.text));
    }

    const treeCol = treeGrid.getTreeColumn();
    const indentMultiplier = options.indentMultiplier ?? 1;

    for (const node of nodes) {
      const row: string[] = [];
      const depth = node.depth ?? 0;
      for (const col of columns) {
        let value = String((node as any).get?.(col.dataIndex) ?? '');
        if (indentTreeCol && col === treeCol) {
          value = (options.indentCharacter ?? indentChar).repeat(depth * indentMultiplier) + value;
        }
        row.push(value);
      }
      rows.push(row);
    }

    return rows;
  }

  private static _getColumns(treeGrid: TreeGrid, options: ExportOptions) {
    const allColumns = treeGrid.getColumns();
    let cols = options.includeHidden ? allColumns : allColumns.filter((c) => !c.hidden);
    if (options.columns) {
      const allowedSet = new Set(options.columns);
      cols = cols.filter((c) => allowedSet.has(c.dataIndex));
    }
    return cols;
  }

  private static _getNodes(treeGrid: TreeGrid, options: ExportOptions): NodeInterface[] {
    if (options.expandedOnly) {
      return (treeGrid.getStore().flattenNodes() as NodeInterface[]).filter((n) => !n.isRoot());
    }
    // All nodes (default)
    const all: NodeInterface[] = [];
    treeGrid.getRootNode().cascadeBy((n) => {
      if (!n.isRoot()) all.push(n);
    });
    return all;
  }
}

function _escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
