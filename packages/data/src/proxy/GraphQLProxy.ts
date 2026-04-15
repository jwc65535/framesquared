/**
 * @framesquared/data – GraphQLProxy
 *
 * Sends GraphQL queries for read and mutations for CUD operations.
 * Parses response using a rootProperty path into the GraphQL data.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Model } from '../Model.js';
import { ResultSet } from '../ResultSet.js';
import { Proxy } from './Proxy.js';
import type { ProxyConfig } from './Proxy.js';

export interface GraphQLProxyConfig extends ProxyConfig {
  url: string;
  query?: string;
  mutation?: string;
  rootProperty?: string;
  headers?: Record<string, string>;
}

export class GraphQLProxy extends Proxy {
  private url: string;
  private query: string;
  private mutation: string;
  private rootProperty: string;
  private headers: Record<string, string>;

  constructor(config: GraphQLProxyConfig) {
    super(config);
    this.url = config.url;
    this.query = config.query ?? '';
    this.mutation = config.mutation ?? '';
    this.rootProperty = config.rootProperty ?? 'data';
    this.headers = config.headers ?? {};
  }

  async read(_records: Model[] = [], options: { params?: Record<string, unknown> } = {}): Promise<ResultSet> {
    return this.doRequest(this.query, options.params ?? {});
  }

  async create(records: Model[]): Promise<ResultSet> {
    const variables: Record<string, unknown> = {};
    if (records.length > 0) variables.input = records[0].getData();
    return this.doRequest(this.mutation, variables);
  }

  async update(records: Model[]): Promise<ResultSet> {
    const variables: Record<string, unknown> = {};
    if (records.length > 0) variables.input = records[0].getData();
    return this.doRequest(this.mutation, variables);
  }

  async patch(records: Model[]): Promise<ResultSet> {
    return this.update(records);
  }

  async destroy(records: Model[]): Promise<ResultSet> {
    const variables: Record<string, unknown> = {};
    if (records.length > 0) variables.id = records[0].getId();
    return this.doRequest(this.mutation, variables);
  }

  private async doRequest(
    queryStr: string,
    variables: Record<string, unknown>,
  ): Promise<ResultSet> {
    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.headers },
        body: JSON.stringify({ query: queryStr, variables }),
      });

      const data = await response.json();

      if (data.errors && data.errors.length > 0) {
        return new ResultSet({ records: [], success: false, message: data.errors[0].message });
      }

      const raw   = this.extractByPath(data, this.rootProperty);
      const items = Array.isArray(raw) ? raw : raw ? [raw] : [];
      const records = items.map((item: any) => this.model.create(item));

      return new ResultSet({ records, success: true });
    } catch (err: any) {
      return new ResultSet({ records: [], success: false, message: err?.message ?? 'GraphQL request failed' });
    }
  }

  private extractByPath(obj: any, path: string): unknown {
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current == null) return undefined;
      current = current[part];
    }
    return current;
  }
}
