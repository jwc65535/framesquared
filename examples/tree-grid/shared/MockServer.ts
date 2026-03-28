/**
 * MockServer — Fake REST API for async loading examples.
 * Intercepts fetch() and returns simulated tree data with realistic latency.
 */

import { DataGenerator } from './DataGenerator.js';
import type { TreeNodeData } from './DataGenerator.js';

interface RequestLogEntry {
  method: string;
  url: string;
  params: Record<string, string>;
  timestamp: number;
  latency: number;
  status: number;
  count: number;
}

let originalFetch: typeof globalThis.fetch | null = null;
let _minLatency = 200;
let _maxLatency = 600;
let _failureRate = 0;
const _requestLog: RequestLogEntry[] = [];

// In-memory file system dataset, initialized on install
let _fileSystem: Map<string, TreeNodeData & { children?: TreeNodeData[] }> = new Map();
let _taskSystem: Map<string, TreeNodeData & { children?: TreeNodeData[] }> = new Map();
let _orgSystem: Map<string, TreeNodeData & { children?: TreeNodeData[] }> = new Map();

function flattenToMap(nodes: TreeNodeData[], map: Map<string, TreeNodeData>): void {
  for (const node of nodes) {
    map.set(node.id as string, node);
    if (node.children) flattenToMap(node.children, map);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomLatency(): number {
  return _minLatency + Math.floor(Math.random() * (_maxLatency - _minLatency));
}

function parseSearchParams(url: string): Record<string, string> {
  const u = new URL(url, 'http://localhost');
  const params: Record<string, string> = {};
  u.searchParams.forEach((v, k) => { params[k] = v; });
  return params;
}

async function handleRequest(url: string, init?: RequestInit): Promise<Response> {
  const method = (init?.method ?? 'GET').toUpperCase();
  const params = parseSearchParams(url);
  const lat = randomLatency();
  const start = Date.now();
  const shouldFail = Math.random() < _failureRate;
  const u = new URL(url, 'http://localhost');
  const pathname = u.pathname;

  await delay(lat);

  const actualLatency = Date.now() - start;

  const logEntry: RequestLogEntry = { method, url, params, timestamp: Date.now(), latency: actualLatency, status: 200, count: 0 };

  if (shouldFail) {
    logEntry.status = 500;
    _requestLog.unshift(logEntry);
    if (_requestLog.length > 100) _requestLog.pop();
    return new Response(JSON.stringify({ success: false, error: 'Internal Server Error' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  let responseData: unknown = { success: false, error: 'Not found' };
  let status = 404;

  if (pathname === '/api/files') {
    if (method === 'GET') {
      const nodeId = params.node ?? 'root';
      let children: TreeNodeData[];
      if (nodeId === 'root') {
        children = Array.from(_fileSystem.values()).filter(n => {
          const parent = Array.from(_fileSystem.values()).find(p => p.children?.some(c => c.id === n.id));
          return !parent;
        });
      } else {
        const node = _fileSystem.get(nodeId);
        children = node?.children ?? [];
      }
      // Strip nested children for lazy loading response
      const items = children.map(c => ({ ...c, children: undefined, hasChildren: !c.leaf && (c.children?.length ?? 0) > 0 }));
      logEntry.count = items.length;
      responseData = { success: true, children: items, total: items.length };
      status = 200;
    } else if (method === 'POST') {
      const body = JSON.parse(init?.body as string ?? '{}') as TreeNodeData;
      body.id = `new-${Date.now()}`;
      body.leaf = body.leaf ?? true;
      _fileSystem.set(body.id as string, body);
      const parent = _fileSystem.get(params.parentId ?? 'root');
      if (parent?.children) parent.children.push(body);
      responseData = { success: true, node: body };
      status = 201;
    } else if (method === 'DELETE') {
      const nodeId = pathname.split('/').pop()!;
      _fileSystem.delete(nodeId);
      responseData = { success: true };
      status = 200;
    }
  } else if (pathname === '/api/tasks') {
    const nodeId = params.node ?? 'root';
    let children: TreeNodeData[];
    if (nodeId === 'root') {
      children = Array.from(_taskSystem.values()).filter(n => {
        const parent = Array.from(_taskSystem.values()).find(p => p.children?.some(c => c.id === n.id));
        return !parent;
      });
    } else {
      children = _taskSystem.get(nodeId)?.children ?? [];
    }
    const items = children.map(c => ({ ...c, children: undefined, hasChildren: !c.leaf && (c.children?.length ?? 0) > 0 }));
    logEntry.count = items.length;
    responseData = { success: true, children: items, total: items.length };
    status = 200;
  } else if (pathname === '/api/org') {
    const nodeId = params.node ?? 'root';
    let children: TreeNodeData[];
    if (nodeId === 'root') {
      children = Array.from(_orgSystem.values()).filter(n => {
        const parent = Array.from(_orgSystem.values()).find(p => p.children?.some(c => c.id === n.id));
        return !parent;
      });
    } else {
      children = _orgSystem.get(nodeId)?.children ?? [];
    }
    const items = children.map(c => ({ ...c, children: undefined, hasChildren: !c.leaf && (c.children?.length ?? 0) > 0 }));
    logEntry.count = items.length;
    responseData = { success: true, children: items, total: items.length };
    status = 200;
  } else if (pathname === '/api/files/search') {
    const q = (params.q ?? '').toLowerCase();
    const matches = Array.from(_fileSystem.values()).filter(n => (n.text as string).toLowerCase().includes(q));
    logEntry.count = matches.length;
    responseData = { success: true, children: matches.slice(0, 50), total: matches.length };
    status = 200;
  }

  logEntry.status = status;
  _requestLog.unshift(logEntry);
  if (_requestLog.length > 100) _requestLog.pop();

  return new Response(JSON.stringify(responseData), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}

export const MockServer = {
  install(): void {
    if (originalFetch) return; // already installed

    // Initialize in-memory datasets
    _fileSystem.clear();
    _taskSystem.clear();
    _orgSystem.clear();
    const fsData = DataGenerator.fileSystem({ depth: 4, breadth: 5 });
    const taskData = DataGenerator.projectPlan({ phases: 3, tasksPerPhase: 5 });
    const orgData = DataGenerator.organization({ departments: 4, teamsPerDept: 2, membersPerTeam: 5 });
    flattenToMap(fsData, _fileSystem);
    flattenToMap(taskData, _taskSystem);
    flattenToMap(orgData, _orgSystem);

    originalFetch = globalThis.fetch;
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
      if (url.startsWith('/api/')) {
        return handleRequest(url, init);
      }
      return originalFetch!(input, init);
    };
  },

  uninstall(): void {
    if (originalFetch) {
      globalThis.fetch = originalFetch;
      originalFetch = null;
    }
  },

  setLatency(min: number, max: number): void {
    _minLatency = min;
    _maxLatency = max;
  },

  setFailureRate(rate: number): void {
    _failureRate = Math.max(0, Math.min(1, rate));
  },

  getRequestLog(): RequestLogEntry[] {
    return [..._requestLog];
  },

  clearLog(): void {
    _requestLog.length = 0;
  },
};
