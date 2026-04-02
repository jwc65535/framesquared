/**
 * @framesquared/data – Writers
 *
 * Serialize Model records for transport to the server.
 */

 

import type { Model } from '../Model.js';

// ---------------------------------------------------------------------------
// JsonWriter
// ---------------------------------------------------------------------------

export interface JsonWriterConfig {
  writeAllFields?: boolean;
  allowSingle?: boolean;
  encode?: boolean;
  rootProperty?: string;
}

export class JsonWriter {
  private config: JsonWriterConfig;

  constructor(config: JsonWriterConfig) {
    this.config = {
      writeAllFields: true,
      allowSingle: false,
      encode: false,
      ...config,
    };
  }

  write(records: Model[]): unknown {
    const serialized = records.map((r) => this.serializeRecord(r));

    let result: unknown;

    // allowSingle: unwrap single-element array
    if (this.config.allowSingle && serialized.length === 1) {
      result = serialized[0];
    } else {
      result = serialized;
    }

    // rootProperty: wrap under a key
    if (this.config.rootProperty) {
      result = { [this.config.rootProperty]: result };
    }

    // encode: convert to JSON string
    if (this.config.encode) {
      return JSON.stringify(result);
    }

    return result;
  }

  private serializeRecord(record: Model): Record<string, unknown> {
    if (this.config.writeAllFields) {
      return record.getData({ serialize: true });
    }

    // writeAllFields=false: only send changed fields + id
    const Ctor = record.constructor as typeof Model;
    const changes = record.getChanges();
    const result: Record<string, unknown> = {};

    // Always include the ID
    const idProp = Ctor.idProperty;
    result[idProp] = record.get(idProp);

    // Add changed fields
    for (const [key, value] of Object.entries(changes)) {
      result[key] = value;
    }

    return result;
  }
}

// ---------------------------------------------------------------------------
// XmlWriter
// ---------------------------------------------------------------------------

export interface XmlWriterConfig {
  documentRoot?: string;
  record?: string;
}

export class XmlWriter {
  private config: XmlWriterConfig;

  constructor(config: XmlWriterConfig) {
    this.config = {
      documentRoot: 'xmlData',
      record: 'record',
      ...config,
    };
  }

  write(records: Model[]): string {
    const root = this.config.documentRoot!;
    const tag = this.config.record!;
    const parts: string[] = [`<${root}>`];

    for (const record of records) {
      parts.push(`<${tag}>`);
      const data = record.getData({ serialize: true });
      for (const [key, value] of Object.entries(data)) {
        parts.push(`<${key}>${escapeXml(String(value ?? ''))}</${key}>`);
      }
      parts.push(`</${tag}>`);
    }

    parts.push(`</${root}>`);
    return parts.join('');
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
