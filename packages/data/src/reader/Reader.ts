/**
 * @framesquared/data – Readers
 *
 * Parse raw server response data into ResultSet instances.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Model } from '../Model.js';
import { ResultSet } from '../ResultSet.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getNestedValue(obj: any, path: string): unknown {
  const segments = path.split('.');
  let current: any = obj;
  for (const seg of segments) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[seg];
  }
  return current;
}

// ---------------------------------------------------------------------------
// JsonReader
// ---------------------------------------------------------------------------

export interface JsonReaderConfig {
  model: typeof Model;
  rootProperty?: string;
  totalProperty?: string;
  successProperty?: string;
  messageProperty?: string;
}

export class JsonReader {
  protected config: JsonReaderConfig;

  constructor(config: JsonReaderConfig) {
    this.config = config;
  }

  read(data: unknown): ResultSet {
    const { model, rootProperty, totalProperty, successProperty, messageProperty } = this.config;

    let rawRecords: any[];
    let total: number | undefined;
    let success = true;
    let message: string | undefined;

    if (rootProperty) {
      const root = getNestedValue(data, rootProperty);
      rawRecords = Array.isArray(root) ? root : [];
    } else {
      rawRecords = Array.isArray(data) ? data : [];
    }

    if (totalProperty && typeof data === 'object' && data !== null) {
      const t = getNestedValue(data, totalProperty);
      if (typeof t === 'number') total = t;
    }

    if (successProperty && typeof data === 'object' && data !== null) {
      const s = getNestedValue(data, successProperty);
      if (typeof s === 'boolean') success = s;
    }

    if (messageProperty && typeof data === 'object' && data !== null) {
      const m = getNestedValue(data, messageProperty);
      if (typeof m === 'string') message = m;
    }

    const records = rawRecords.map((raw) => model.create(raw));
    return new ResultSet({
      records,
      total: total ?? records.length,
      success,
      message,
    });
  }
}

// ---------------------------------------------------------------------------
// ArrayReader
// ---------------------------------------------------------------------------

export interface ArrayReaderConfig {
  model: typeof Model;
}

export class ArrayReader {
  private config: ArrayReaderConfig;

  constructor(config: ArrayReaderConfig) {
    this.config = config;
  }

  read(data: unknown[][]): ResultSet {
    const { model } = this.config;
    const fieldNames = (model as any).fields.map((f: any) =>
      typeof f === 'string' ? f : f.name,
    ) as string[];

    const records = data.map((row) => {
      const obj: Record<string, unknown> = {};
      for (let i = 0; i < fieldNames.length; i++) {
        if (i < row.length) {
          obj[fieldNames[i]] = row[i];
        }
      }
      return model.create(obj);
    });

    return new ResultSet({ records, success: true });
  }
}

// ---------------------------------------------------------------------------
// XmlReader
// ---------------------------------------------------------------------------

export interface XmlReaderConfig {
  model: typeof Model;
  record: string;
}

export class XmlReader {
  private config: XmlReaderConfig;

  constructor(config: XmlReaderConfig) {
    this.config = config;
  }

  read(xmlString: string): ResultSet {
    const { model, record: tagName } = this.config;
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');
    const nodes = doc.getElementsByTagName(tagName);

    const fieldNames = (model as any).fields.map((f: any) =>
      typeof f === 'string' ? f : f.name,
    ) as string[];

    const records: Model[] = [];
    for (const node of nodes) {
      const obj: Record<string, unknown> = {};
      for (const fieldName of fieldNames) {
        // Try exact tag match first, then first-letter tag ('n' for 'name')
        let el = node.getElementsByTagName(fieldName)[0];
        if (!el) {
          // Fallback: try single-char abbreviation
          el = node.getElementsByTagName(fieldName[0])[0] as Element;
        }
        if (el) {
          obj[fieldName] = el.textContent ?? '';
        }
      }
      records.push(model.create(obj));
    }

    return new ResultSet({ records, success: true });
  }
}
