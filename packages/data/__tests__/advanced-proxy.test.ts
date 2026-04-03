import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GraphQLProxy } from '../src/proxy/GraphQLProxy.js';
import { WebSocketProxy } from '../src/proxy/WebSocketProxy.js';
import { BatchProxy } from '../src/proxy/BatchProxy.js';
import { Connection } from '../src/data/Connection.js';
import { Session } from '../src/data/Session.js';
import { Operation } from '../src/Operation.js';
import { Model } from '../src/Model.js';

// ---------------------------------------------------------------------------
// Minimal Model subclass for tests
// ---------------------------------------------------------------------------

class TestModel extends Model {
  static override fields = [
    { name: 'id', type: 'int' as const },
    { name: 'name', type: 'string' as const },
  ];
}

// ---------------------------------------------------------------------------
// Mock fetch
// ---------------------------------------------------------------------------

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).fetch = fetchMock;
});
afterEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (globalThis as any).fetch;
  Connection.reset();
});

function mockFetchResponse(data: unknown, ok = true, status = 200) {
  fetchMock.mockResolvedValueOnce({
    ok,
    status,
    json: async () => data,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// GraphQLProxy
// ═══════════════════════════════════════════════════════════════════════════

describe('GraphQLProxy', () => {
  it('sends GraphQL query for read', async () => {
    mockFetchResponse({ data: { users: [{ id: 1, name: 'Alice' }] } });
    const proxy = new GraphQLProxy({
      model: TestModel,
      url: '/graphql',
      query: 'query { users { id name } }',
      rootProperty: 'data.users',
    });
    const op = new Operation({ action: 'read' });
    const _result = await proxy.read(op);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/graphql');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body);
    expect(body.query).toContain('users');
  });

  it('parses GraphQL response into ResultSet', async () => {
    mockFetchResponse({
      data: {
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
      },
    });
    const proxy = new GraphQLProxy({
      model: TestModel,
      url: '/graphql',
      query: 'query { users { id name } }',
      rootProperty: 'data.users',
    });
    const op = new Operation({ action: 'read' });
    const result = await proxy.read(op);
    expect(result.success).toBe(true);
    expect(result.records.length).toBe(2);
  });

  it('sends mutation for create', async () => {
    mockFetchResponse({ data: { createUser: { id: 3, name: 'Charlie' } } });
    const proxy = new GraphQLProxy({
      model: TestModel,
      url: '/graphql',
      mutation: 'mutation($input: UserInput!) { createUser(input: $input) { id name } }',
      rootProperty: 'data.createUser',
    });
    const rec = TestModel.create({ name: 'Charlie' });
    const op = new Operation({ action: 'create', records: [rec] });
    const _result = await proxy.create(op);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.query).toContain('mutation');
  });

  it('passes variables from operation params', async () => {
    mockFetchResponse({ data: { user: { id: 1, name: 'Alice' } } });
    const proxy = new GraphQLProxy({
      model: TestModel,
      url: '/graphql',
      query: 'query($id: Int!) { user(id: $id) { id name } }',
      rootProperty: 'data.user',
    });
    const op = new Operation({ action: 'read', params: { id: 42 } });
    await proxy.read(op);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.variables.id).toBe(42);
  });

  it('handles GraphQL errors', async () => {
    mockFetchResponse({ errors: [{ message: 'Not found' }] });
    const proxy = new GraphQLProxy({
      model: TestModel,
      url: '/graphql',
      query: 'query { users { id } }',
      rootProperty: 'data.users',
    });
    const op = new Operation({ action: 'read' });
    const result = await proxy.read(op);
    expect(result.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// WebSocketProxy
// ═══════════════════════════════════════════════════════════════════════════

describe('WebSocketProxy', () => {
  // Mock WebSocket
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let wsMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let wsInstances: any[];

  beforeEach(() => {
    wsInstances = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).WebSocket = class MockWS {
      url: string;
      onopen: ((...args: unknown[]) => unknown) | null = null;
      onclose: ((...args: unknown[]) => unknown) | null = null;
      onerror: ((...args: unknown[]) => unknown) | null = null;
      onmessage: ((...args: unknown[]) => unknown) | null = null;
      readyState = 1; // OPEN
      sent: string[] = [];
      constructor(url: string) {
        this.url = url;
        wsInstances.push(this);
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        wsMock = this;
        setTimeout(() => this.onopen?.({ type: 'open' }), 0);
      }
      send(data: string) {
        this.sent.push(data);
      }
      close() {
        this.readyState = 3;
        this.onclose?.({ type: 'close' });
      }
    };
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).WebSocket;
  });

  it('connects to WebSocket URL', () => {
    const proxy = new WebSocketProxy({
      model: TestModel,
      url: 'ws://localhost:8080',
    });
    proxy.connect();
    expect(wsInstances.length).toBe(1);
    expect(wsInstances[0].url).toBe('ws://localhost:8080');
    proxy.disconnect();
  });

  it('sends CRUD operation as JSON message', () => {
    const proxy = new WebSocketProxy({
      model: TestModel,
      url: 'ws://localhost:8080',
    });
    proxy.connect();
    const rec = TestModel.create({ id: 1, name: 'Alice' });
    const op = new Operation({ action: 'create', records: [rec] });
    proxy.send(op);
    expect(wsMock.sent.length).toBe(1);
    const msg = JSON.parse(wsMock.sent[0]);
    expect(msg.action).toBe('create');
    proxy.disconnect();
  });

  it('fires message event on incoming data', async () => {
    const spy = vi.fn();
    const proxy = new WebSocketProxy({
      model: TestModel,
      url: 'ws://localhost:8080',
    });
    proxy.on('message', spy);
    proxy.connect();
    // Wait for onopen
    await new Promise((r) => setTimeout(r, 10));
    // Simulate incoming message
    wsMock.onmessage?.({ data: JSON.stringify({ records: [{ id: 1, name: 'Alice' }] }) });
    expect(spy).toHaveBeenCalled();
    proxy.disconnect();
  });

  it('fires open event on connection', async () => {
    const spy = vi.fn();
    const proxy = new WebSocketProxy({
      model: TestModel,
      url: 'ws://localhost:8080',
    });
    proxy.on('open', spy);
    proxy.connect();
    await new Promise((r) => setTimeout(r, 10));
    expect(spy).toHaveBeenCalled();
    proxy.disconnect();
  });

  it('auto-reconnect on disconnect', async () => {
    const proxy = new WebSocketProxy({
      model: TestModel,
      url: 'ws://localhost:8080',
      reconnect: true,
      reconnectInterval: 50,
    });
    proxy.connect();
    await new Promise((r) => setTimeout(r, 10));
    expect(wsInstances.length).toBe(1);
    // Trigger close
    wsMock.readyState = 3;
    wsMock.onclose?.({ type: 'close' });
    // Wait for reconnect
    await new Promise((r) => setTimeout(r, 100));
    expect(wsInstances.length).toBe(2);
    proxy.disconnect();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BatchProxy
// ═══════════════════════════════════════════════════════════════════════════

describe('BatchProxy', () => {
  it('combines multiple operations into one HTTP request', async () => {
    mockFetchResponse({
      results: [
        { success: true, records: [{ id: 1, name: 'A' }] },
        { success: true, records: [{ id: 2, name: 'B' }] },
        { success: true, records: [] },
      ],
    });
    const proxy = new BatchProxy({
      model: TestModel,
      url: '/batch',
    });
    const ops = [
      new Operation({ action: 'create', records: [TestModel.create({ name: 'A' })] }),
      new Operation({ action: 'update', records: [TestModel.create({ id: 2, name: 'B' })] }),
      new Operation({ action: 'destroy', records: [TestModel.create({ id: 3, name: 'C' })] }),
    ];
    const results = await proxy.sendBatch(ops);
    // Only one fetch call
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(results.length).toBe(3);
  });

  it('batch request body contains all operations', async () => {
    mockFetchResponse({ results: [{ success: true, records: [] }] });
    const proxy = new BatchProxy({ model: TestModel, url: '/batch' });
    const ops = [new Operation({ action: 'read', params: { page: 1 } })];
    await proxy.sendBatch(ops);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.operations).toHaveLength(1);
    expect(body.operations[0].action).toBe('read');
  });

  it('unwraps batch response into individual ResultSets', async () => {
    mockFetchResponse({
      results: [
        { success: true, records: [{ id: 1, name: 'X' }] },
        { success: false, message: 'Failed' },
      ],
    });
    const proxy = new BatchProxy({ model: TestModel, url: '/batch' });
    const ops = [
      new Operation({ action: 'create', records: [TestModel.create({ name: 'X' })] }),
      new Operation({ action: 'update', records: [TestModel.create({ id: 2, name: 'Y' })] }),
    ];
    const results = await proxy.sendBatch(ops);
    expect(results[0].success).toBe(true);
    expect(results[0].records.length).toBe(1);
    expect(results[1].success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Connection
// ═══════════════════════════════════════════════════════════════════════════

describe('Connection', () => {
  it('request interceptor modifies request', async () => {
    mockFetchResponse({ ok: true });
    Connection.addRequestInterceptor((url, init) => {
      init.headers = { ...(init.headers as Record<string, string>), 'X-Custom': 'value' };
      return [url, init];
    });
    await Connection.fetch('/api/test');
    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers['X-Custom']).toBe('value');
  });

  it('response interceptor transforms response', async () => {
    mockFetchResponse({ data: 'original' });
    Connection.addResponseInterceptor((response) => {
      return { ...response, transformed: true };
    });
    const result = await Connection.fetch('/api/test');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result as any).transformed).toBe(true);
  });

  it('default headers are applied', async () => {
    mockFetchResponse({ ok: true });
    Connection.setDefaultHeaders({ Authorization: 'Bearer token123' });
    await Connection.fetch('/api/test');
    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers['Authorization']).toBe('Bearer token123');
  });

  it('error handler is called on fetch failure', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));
    const errorSpy = vi.fn();
    Connection.setErrorHandler(errorSpy);
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    await Connection.fetch('/api/test').catch(() => {});
    expect(errorSpy).toHaveBeenCalled();
  });

  it('multiple request interceptors chain', async () => {
    mockFetchResponse({ ok: true });
    Connection.addRequestInterceptor((url, init) => {
      init.headers = { ...(init.headers as Record<string, string>), 'X-First': '1' };
      return [url, init];
    });
    Connection.addRequestInterceptor((url, init) => {
      init.headers = { ...(init.headers as Record<string, string>), 'X-Second': '2' };
      return [url, init];
    });
    await Connection.fetch('/api/test');
    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers['X-First']).toBe('1');
    expect(headers['X-Second']).toBe('2');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Session
// ═══════════════════════════════════════════════════════════════════════════

describe('Session', () => {
  it('tracks created records', () => {
    const session = new Session();
    const rec = TestModel.create({ name: 'Alice' });
    session.trackCreate(rec);
    expect(session.getCreated().length).toBe(1);
  });

  it('tracks updated records', () => {
    const session = new Session();
    const rec = TestModel.create({ id: 1, name: 'Alice' });
    session.trackUpdate(rec);
    expect(session.getUpdated().length).toBe(1);
  });

  it('tracks destroyed records', () => {
    const session = new Session();
    const rec = TestModel.create({ id: 1, name: 'Alice' });
    session.trackDestroy(rec);
    expect(session.getDestroyed().length).toBe(1);
  });

  it('getChanges returns all tracked changes', () => {
    const session = new Session();
    session.trackCreate(TestModel.create({ name: 'New' }));
    session.trackUpdate(TestModel.create({ id: 2, name: 'Updated' }));
    session.trackDestroy(TestModel.create({ id: 3, name: 'Deleted' }));
    const changes = session.getChanges();
    expect(changes.create.length).toBe(1);
    expect(changes.update.length).toBe(1);
    expect(changes.destroy.length).toBe(1);
  });

  it('save sends batch of all changes via proxy', async () => {
    mockFetchResponse({
      results: [
        { success: true, records: [{ id: 10, name: 'New' }] },
        { success: true, records: [{ id: 2, name: 'Updated' }] },
        { success: true, records: [] },
      ],
    });
    const proxy = new BatchProxy({ model: TestModel, url: '/batch' });
    const session = new Session();
    session.trackCreate(TestModel.create({ name: 'New' }));
    session.trackUpdate(TestModel.create({ id: 2, name: 'Updated' }));
    session.trackDestroy(TestModel.create({ id: 3, name: 'Deleted' }));
    const result = await session.save(proxy);
    expect(result.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('commit clears all tracked changes', () => {
    const session = new Session();
    session.trackCreate(TestModel.create({ name: 'A' }));
    session.trackUpdate(TestModel.create({ id: 1, name: 'B' }));
    session.commit();
    expect(session.getCreated().length).toBe(0);
    expect(session.getUpdated().length).toBe(0);
    expect(session.getDestroyed().length).toBe(0);
  });

  it('reject clears all tracked changes', () => {
    const session = new Session();
    session.trackCreate(TestModel.create({ name: 'A' }));
    session.reject();
    expect(session.getCreated().length).toBe(0);
  });

  it('isDirty returns true when changes exist', () => {
    const session = new Session();
    expect(session.isDirty()).toBe(false);
    session.trackCreate(TestModel.create({ name: 'A' }));
    expect(session.isDirty()).toBe(true);
  });

  it('conflict detection: same record tracked twice', () => {
    const session = new Session();
    const rec = TestModel.create({ id: 1, name: 'Alice' });
    session.trackUpdate(rec);
    session.trackUpdate(rec); // duplicate
    expect(session.getUpdated().length).toBe(1); // deduplicated
  });
});
