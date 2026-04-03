/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Model } from '../src/Model.js';
import { FieldType } from '../src/field/Field.js';
import { Operation } from '../src/Operation.js';
import { ResultSet } from '../src/ResultSet.js';
import { JsonReader } from '../src/reader/Reader.js';
import { ArrayReader } from '../src/reader/Reader.js';
import { XmlReader } from '../src/reader/Reader.js';
import { JsonWriter } from '../src/writer/Writer.js';
import { XmlWriter } from '../src/writer/Writer.js';
import { MemoryProxy } from '../src/proxy/ClientProxy.js';
import { LocalStorageProxy } from '../src/proxy/ClientProxy.js';
import { SessionStorageProxy } from '../src/proxy/ClientProxy.js';
import { AjaxProxy } from '../src/proxy/ServerProxy.js';
import { RestProxy } from '../src/proxy/ServerProxy.js';

// ---------------------------------------------------------------------------
// Shared test model
// ---------------------------------------------------------------------------
class User extends Model {
  static override $className = 'proxy.test.User';
  static override fields = [
    { name: 'id', type: FieldType.INT },
    { name: 'name', type: FieldType.STRING },
    { name: 'age', type: FieldType.INT },
  ];
  static override idProperty = 'id';
}

function u(data: Record<string, unknown>) {
  return User.create(data);
}

// ═══════════════════════════════════════════════════════════════════════════
// Operation
// ═══════════════════════════════════════════════════════════════════════════
describe('Operation', () => {
  it('stores action and params', () => {
    const op = new Operation({ action: 'read', params: { page: 1 } });
    expect(op.action).toBe('read');
    expect(op.params).toEqual({ page: 1 });
  });

  it('stores records', () => {
    const r = u({ id: 1, name: 'A', age: 20 });
    const op = new Operation({ action: 'create', records: [r] });
    expect(op.records.length).toBe(1);
  });

  it('stores paging info', () => {
    const op = new Operation({ action: 'read', start: 0, limit: 25, page: 1 });
    expect(op.start).toBe(0);
    expect(op.limit).toBe(25);
    expect(op.page).toBe(1);
  });

  it('stores sorters and filters', () => {
    const op = new Operation({
      action: 'read',
      sorters: [{ property: 'name', direction: 'ASC' }],
      filters: [{ property: 'age', value: 30, operator: '>' }],
    });
    expect(op.sorters!.length).toBe(1);
    expect(op.filters!.length).toBe(1);
  });

  it('result is null initially', () => {
    const op = new Operation({ action: 'read' });
    expect(op.result).toBeNull();
  });

  it('setResult stores the ResultSet', () => {
    const op = new Operation({ action: 'read' });
    const rs = new ResultSet({ records: [], total: 0, success: true });
    op.setResult(rs);
    expect(op.result).toBe(rs);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ResultSet
// ═══════════════════════════════════════════════════════════════════════════
describe('ResultSet', () => {
  it('stores records, total, success', () => {
    const rs = new ResultSet({
      records: [u({ id: 1, name: 'A', age: 20 })],
      total: 1,
      success: true,
    });
    expect(rs.records.length).toBe(1);
    expect(rs.total).toBe(1);
    expect(rs.success).toBe(true);
  });

  it('stores optional message', () => {
    const rs = new ResultSet({ records: [], total: 0, success: false, message: 'Error!' });
    expect(rs.message).toBe('Error!');
  });

  it('defaults total to records.length', () => {
    const rs = new ResultSet({
      records: [u({ id: 1, name: 'A', age: 20 }), u({ id: 2, name: 'B', age: 25 })],
      success: true,
    });
    expect(rs.total).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// JsonReader
// ═══════════════════════════════════════════════════════════════════════════
describe('JsonReader', () => {
  it('parses flat JSON array', () => {
    const reader = new JsonReader({ model: User });
    const rs = reader.read([
      { id: 1, name: 'A', age: 20 },
      { id: 2, name: 'B', age: 25 },
    ]);
    expect(rs.success).toBe(true);
    expect(rs.records.length).toBe(2);
    expect(rs.records[0].get('name')).toBe('A');
  });

  it('extracts data from rootProperty', () => {
    const reader = new JsonReader({ model: User, rootProperty: 'data' });
    const rs = reader.read({ data: [{ id: 1, name: 'A', age: 20 }], total: 100 });
    expect(rs.records.length).toBe(1);
  });

  it('extracts totalProperty', () => {
    const reader = new JsonReader({ model: User, rootProperty: 'data', totalProperty: 'total' });
    const rs = reader.read({ data: [{ id: 1, name: 'A', age: 20 }], total: 100 });
    expect(rs.total).toBe(100);
  });

  it('extracts successProperty', () => {
    const reader = new JsonReader({
      model: User,
      rootProperty: 'data',
      successProperty: 'success',
    });
    const rs = reader.read({ data: [], success: false });
    expect(rs.success).toBe(false);
  });

  it('extracts messageProperty', () => {
    const reader = new JsonReader({
      model: User,
      rootProperty: 'data',
      messageProperty: 'msg',
    });
    const rs = reader.read({ data: [], msg: 'All good' });
    expect(rs.message).toBe('All good');
  });

  it('handles nested rootProperty', () => {
    const reader = new JsonReader({ model: User, rootProperty: 'response.items' });
    const rs = reader.read({ response: { items: [{ id: 1, name: 'A', age: 20 }] } });
    expect(rs.records.length).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ArrayReader
// ═══════════════════════════════════════════════════════════════════════════
describe('ArrayReader', () => {
  it('parses array-of-arrays using field order', () => {
    const reader = new ArrayReader({ model: User });
    const rs = reader.read([
      [1, 'Alice', 30],
      [2, 'Bob', 25],
    ]);
    expect(rs.records.length).toBe(2);
    expect(rs.records[0].get('id')).toBe(1);
    expect(rs.records[0].get('name')).toBe('Alice');
    expect(rs.records[0].get('age')).toBe(30);
  });

  it('handles rows with fewer values than fields', () => {
    const reader = new ArrayReader({ model: User });
    const rs = reader.read([[1, 'Alice']]);
    expect(rs.records[0].get('id')).toBe(1);
    expect(rs.records[0].get('name')).toBe('Alice');
    expect(rs.records[0].get('age')).toBe(0); // INT default
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// XmlReader
// ═══════════════════════════════════════════════════════════════════════════
describe('XmlReader', () => {
  it('parses XML string into records', () => {
    const reader = new XmlReader({ model: User, record: 'user' });
    const xml = `<users><user><id>1</id><name>Alice</name><age>30</age></user><user><id>2</id><name>Bob</name><age>25</age></user></users>`;
    const rs = reader.read(xml);
    expect(rs.records.length).toBe(2);
    expect(rs.records[0].get('name')).toBe('Alice');
    expect(rs.records[1].get('age')).toBe(25);
  });

  it('handles empty XML', () => {
    const reader = new XmlReader({ model: User, record: 'user' });
    const rs = reader.read('<users></users>');
    expect(rs.records.length).toBe(0);
    expect(rs.success).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// JsonWriter
// ═══════════════════════════════════════════════════════════════════════════
describe('JsonWriter', () => {
  it('serializes record to JSON object', () => {
    const writer = new JsonWriter({});
    const r = u({ id: 1, name: 'Alice', age: 30 });
    const data = writer.write([r]);
    expect(data).toEqual([{ id: 1, name: 'Alice', age: 30 }]);
  });

  it('writeAllFields=false only sends modified fields + id', () => {
    const writer = new JsonWriter({ writeAllFields: false });
    const r = u({ id: 1, name: 'Alice', age: 30 });
    r.set('name', 'Bob');
    const data = writer.write([r]);
    expect(data).toEqual([{ id: 1, name: 'Bob' }]);
  });

  it('allowSingle=true unwraps single record', () => {
    const writer = new JsonWriter({ allowSingle: true });
    const r = u({ id: 1, name: 'Alice', age: 30 });
    const data = writer.write([r]);
    expect(data).toEqual({ id: 1, name: 'Alice', age: 30 });
  });

  it('rootProperty wraps data under a key', () => {
    const writer = new JsonWriter({ rootProperty: 'data' });
    const r = u({ id: 1, name: 'Alice', age: 30 });
    const data = writer.write([r]);
    expect(data).toEqual({ data: [{ id: 1, name: 'Alice', age: 30 }] });
  });

  it('encode=true returns JSON string', () => {
    const writer = new JsonWriter({ encode: true });
    const r = u({ id: 1, name: 'Alice', age: 30 });
    const data = writer.write([r]);
    expect(typeof data).toBe('string');
    expect(JSON.parse(data as string)).toEqual([{ id: 1, name: 'Alice', age: 30 }]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// XmlWriter
// ═══════════════════════════════════════════════════════════════════════════
describe('XmlWriter', () => {
  it('serializes records to XML string', () => {
    const writer = new XmlWriter({ documentRoot: 'users', record: 'user' });
    const r = u({ id: 1, name: 'Alice', age: 30 });
    const xml = writer.write([r]) as string;
    expect(xml).toContain('<users>');
    expect(xml).toContain('<user>');
    expect(xml).toContain('<name>Alice</name>');
    expect(xml).toContain('</users>');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// MemoryProxy
// ═══════════════════════════════════════════════════════════════════════════
describe('MemoryProxy', () => {
  let proxy: InstanceType<typeof MemoryProxy>;

  beforeEach(() => {
    proxy = new MemoryProxy({
      model: User,
      data: [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Carol', age: 35 },
      ],
    });
  });

  it('read returns all records', async () => {
    const op = new Operation({ action: 'read' });
    const rs = await proxy.read(op);
    expect(rs.success).toBe(true);
    expect(rs.records.length).toBe(3);
  });

  it('read with paging (start/limit)', async () => {
    const op = new Operation({ action: 'read', start: 0, limit: 2 });
    const rs = await proxy.read(op);
    expect(rs.records.length).toBe(2);
    expect(rs.total).toBe(3);
  });

  it('read with paging page 2', async () => {
    const op = new Operation({ action: 'read', start: 2, limit: 2 });
    const rs = await proxy.read(op);
    expect(rs.records.length).toBe(1);
    expect(rs.total).toBe(3);
  });

  it('read with local sorting', async () => {
    const op = new Operation({
      action: 'read',
      sorters: [{ property: 'age', direction: 'ASC' }],
    });
    const rs = await proxy.read(op);
    expect(rs.records[0].get('name')).toBe('Bob');
    expect(rs.records[2].get('name')).toBe('Carol');
  });

  it('read with local filtering', async () => {
    const op = new Operation({
      action: 'read',
      filters: [{ property: 'age', value: 30, operator: '>=' }],
    });
    const rs = await proxy.read(op);
    expect(rs.records.length).toBe(2);
  });

  it('create adds records', async () => {
    const r = u({ name: 'Dave', age: 28 });
    const op = new Operation({ action: 'create', records: [r] });
    const rs = await proxy.create(op);
    expect(rs.success).toBe(true);
    // Verify it's in the store now
    const readRs = await proxy.read(new Operation({ action: 'read' }));
    expect(readRs.records.length).toBe(4);
  });

  it('update modifies records', async () => {
    const readRs = await proxy.read(new Operation({ action: 'read' }));
    const alice = readRs.records.find((r) => r.get('name') === 'Alice')!;
    alice.set('age', 31);
    const op = new Operation({ action: 'update', records: [alice] });
    const rs = await proxy.update(op);
    expect(rs.success).toBe(true);
  });

  it('destroy removes records', async () => {
    const readRs = await proxy.read(new Operation({ action: 'read' }));
    const bob = readRs.records.find((r) => r.get('name') === 'Bob')!;
    const op = new Operation({ action: 'destroy', records: [bob] });
    const rs = await proxy.destroy(op);
    expect(rs.success).toBe(true);
    const afterRs = await proxy.read(new Operation({ action: 'read' }));
    expect(afterRs.records.length).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// LocalStorageProxy
// ═══════════════════════════════════════════════════════════════════════════
describe('LocalStorageProxy', () => {
  let proxy: InstanceType<typeof LocalStorageProxy>;

  beforeEach(() => {
    localStorage.clear();
    proxy = new LocalStorageProxy({ model: User, id: 'test-users' });
  });

  it('create persists and read retrieves', async () => {
    const r = u({ id: 1, name: 'Alice', age: 30 });
    await proxy.create(new Operation({ action: 'create', records: [r] }));
    const rs = await proxy.read(new Operation({ action: 'read' }));
    expect(rs.records.length).toBe(1);
    expect(rs.records[0].get('name')).toBe('Alice');
  });

  it('data persists across proxy instances', async () => {
    await proxy.create(
      new Operation({ action: 'create', records: [u({ id: 1, name: 'A', age: 20 })] }),
    );
    const proxy2 = new LocalStorageProxy({ model: User, id: 'test-users' });
    const rs = await proxy2.read(new Operation({ action: 'read' }));
    expect(rs.records.length).toBe(1);
  });

  it('destroy removes from persistence', async () => {
    const r = u({ id: 1, name: 'Alice', age: 30 });
    await proxy.create(new Operation({ action: 'create', records: [r] }));
    await proxy.destroy(new Operation({ action: 'destroy', records: [r] }));
    const rs = await proxy.read(new Operation({ action: 'read' }));
    expect(rs.records.length).toBe(0);
  });

  it('update modifies persisted data', async () => {
    const r = u({ id: 1, name: 'Alice', age: 30 });
    await proxy.create(new Operation({ action: 'create', records: [r] }));
    r.set('age', 31);
    await proxy.update(new Operation({ action: 'update', records: [r] }));
    const rs = await proxy.read(new Operation({ action: 'read' }));
    expect(rs.records[0].get('age')).toBe(31);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SessionStorageProxy
// ═══════════════════════════════════════════════════════════════════════════
describe('SessionStorageProxy', () => {
  it('uses sessionStorage instead of localStorage', async () => {
    sessionStorage.clear();
    const proxy = new SessionStorageProxy({ model: User, id: 'sess-users' });
    await proxy.create(
      new Operation({ action: 'create', records: [u({ id: 1, name: 'A', age: 20 })] }),
    );
    const raw = sessionStorage.getItem('sess-users');
    expect(raw).not.toBeNull();
    const rs = await proxy.read(new Operation({ action: 'read' }));
    expect(rs.records.length).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// AjaxProxy (mocked fetch)
// ═══════════════════════════════════════════════════════════════════════════
describe('AjaxProxy', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockResponse(body: unknown, status = 200) {
    return {
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
    };
  }

  it('read sends GET request', async () => {
    fetchMock.mockResolvedValue(mockResponse([{ id: 1, name: 'A', age: 20 }]));
    const proxy = new AjaxProxy({ url: '/api/users', model: User });
    const rs = await proxy.read(new Operation({ action: 'read' }));
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][1].method).toBe('GET');
    expect(rs.records.length).toBe(1);
  });

  it('create sends POST request', async () => {
    fetchMock.mockResolvedValue(mockResponse({ id: 10, name: 'New', age: 20 }));
    const proxy = new AjaxProxy({ url: '/api/users', model: User });
    const r = u({ name: 'New', age: 20 });
    const rs = await proxy.create(new Operation({ action: 'create', records: [r] }));
    expect(fetchMock.mock.calls[0][1].method).toBe('POST');
    expect(rs.success).toBe(true);
  });

  it('update sends PUT request', async () => {
    fetchMock.mockResolvedValue(mockResponse({ id: 1, name: 'Updated', age: 30 }));
    const proxy = new AjaxProxy({ url: '/api/users', model: User });
    const r = u({ id: 1, name: 'Updated', age: 30 });
    await proxy.update(new Operation({ action: 'update', records: [r] }));
    expect(fetchMock.mock.calls[0][1].method).toBe('PUT');
  });

  it('destroy sends DELETE request', async () => {
    fetchMock.mockResolvedValue(mockResponse({ success: true }));
    const proxy = new AjaxProxy({ url: '/api/users', model: User });
    const r = u({ id: 1, name: 'A', age: 20 });
    await proxy.destroy(new Operation({ action: 'destroy', records: [r] }));
    expect(fetchMock.mock.calls[0][1].method).toBe('DELETE');
  });

  it('sends custom headers', async () => {
    fetchMock.mockResolvedValue(mockResponse([]));
    const proxy = new AjaxProxy({
      url: '/api/users',
      model: User,
      headers: { 'X-Token': 'abc123' },
    });
    await proxy.read(new Operation({ action: 'read' }));
    expect(fetchMock.mock.calls[0][1].headers['X-Token']).toBe('abc123');
  });

  it('uses custom api URLs per action', async () => {
    fetchMock.mockResolvedValue(mockResponse([]));
    const proxy = new AjaxProxy({
      url: '/api/users',
      model: User,
      api: { read: '/api/users/list', create: '/api/users/new' },
    });
    await proxy.read(new Operation({ action: 'read' }));
    expect(fetchMock.mock.calls[0][0]).toContain('/api/users/list');
  });

  it('handles server error response', async () => {
    fetchMock.mockResolvedValue(mockResponse({ message: 'Server Error' }, 500));
    const proxy = new AjaxProxy({ url: '/api/users', model: User });
    const rs = await proxy.read(new Operation({ action: 'read' }));
    expect(rs.success).toBe(false);
  });

  it('handles network failure', async () => {
    fetchMock.mockRejectedValue(new Error('Network error'));
    const proxy = new AjaxProxy({ url: '/api/users', model: User });
    const rs = await proxy.read(new Operation({ action: 'read' }));
    expect(rs.success).toBe(false);
    expect(rs.message).toContain('Network error');
  });

  it('supports AbortController cancellation', async () => {
    const controller = new AbortController();
    fetchMock.mockImplementation(
      () =>
        new Promise((_, reject) => {
          controller.signal.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        }),
    );
    const proxy = new AjaxProxy({ url: '/api/users', model: User });
    const promise = proxy.read(new Operation({ action: 'read' }), controller.signal);
    controller.abort();
    const rs = await promise;
    expect(rs.success).toBe(false);
  });

  it('read includes params in query string', async () => {
    fetchMock.mockResolvedValue(mockResponse([]));
    const proxy = new AjaxProxy({ url: '/api/users', model: User });
    await proxy.read(new Operation({ action: 'read', params: { status: 'active' } }));
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('status=active');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// RestProxy
// ═══════════════════════════════════════════════════════════════════════════
describe('RestProxy', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 1, name: 'A', age: 20 }),
      text: () => Promise.resolve('{}'),
    });
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('read uses GET /users', async () => {
    const proxy = new RestProxy({ url: '/api/users', model: User });
    await proxy.read(new Operation({ action: 'read' }));
    const [url, opts] = fetchMock.mock.calls[0];
    expect(opts.method).toBe('GET');
    expect(url).toContain('/api/users');
  });

  it('read single record uses GET /users/1', async () => {
    const proxy = new RestProxy({ url: '/api/users', model: User, appendId: true });
    const r = u({ id: 1, name: 'A', age: 20 });
    await proxy.read(new Operation({ action: 'read', records: [r] }));
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('/api/users/1');
  });

  it('create uses POST /users', async () => {
    const proxy = new RestProxy({ url: '/api/users', model: User });
    await proxy.create(new Operation({ action: 'create', records: [u({ name: 'New', age: 20 })] }));
    expect(fetchMock.mock.calls[0][1].method).toBe('POST');
  });

  it('update uses PUT /users/1', async () => {
    const proxy = new RestProxy({ url: '/api/users', model: User, appendId: true });
    const r = u({ id: 1, name: 'A', age: 20 });
    await proxy.update(new Operation({ action: 'update', records: [r] }));
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('/api/users/1');
    expect(fetchMock.mock.calls[0][1].method).toBe('PUT');
  });

  it('destroy uses DELETE /users/1', async () => {
    const proxy = new RestProxy({ url: '/api/users', model: User, appendId: true });
    const r = u({ id: 1, name: 'A', age: 20 });
    await proxy.destroy(new Operation({ action: 'destroy', records: [r] }));
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('/api/users/1');
    expect(fetchMock.mock.calls[0][1].method).toBe('DELETE');
  });

  it('appendId=false does not append id to URL', async () => {
    const proxy = new RestProxy({ url: '/api/users', model: User, appendId: false });
    const r = u({ id: 1, name: 'A', age: 20 });
    await proxy.update(new Operation({ action: 'update', records: [r] }));
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toBe('/api/users');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Batch
// ═══════════════════════════════════════════════════════════════════════════
describe('Batch operations', () => {
  it('batch executes create + update + destroy in one call', async () => {
    const proxy = new MemoryProxy({
      model: User,
      data: [{ id: 1, name: 'Alice', age: 30 }],
    });
    const toCreate = u({ name: 'New', age: 20 });
    const existing = (await proxy.read(new Operation({ action: 'read' }))).records[0];
    existing.set('age', 31);

    const batch = await proxy.batch({
      create: [toCreate],
      update: [existing],
      destroy: [],
    });

    expect(batch.success).toBe(true);
    expect(batch.operations.length).toBeGreaterThan(0);
  });
});
