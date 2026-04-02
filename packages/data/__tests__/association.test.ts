import { describe, it, expect, beforeEach } from 'vitest';
import { Model } from '../src/Model.js';
import { Schema } from '../src/Schema.js';
import { FieldType } from '../src/field/Field.js';

// ---------------------------------------------------------------------------
// Test model definitions
// ---------------------------------------------------------------------------

let Address: typeof Model;
let User: typeof Model;
let Order: typeof Model;
let Student: typeof Model;
let Course: typeof Model;
let Enrollment: typeof Model;

beforeEach(() => {
  Schema.clear();

  Address = class Address extends Model {
    static override $className = 'test.Address';
    static override fields = [
      { name: 'id', type: FieldType.INT },
      { name: 'userId', type: FieldType.INT },
      { name: 'city', type: FieldType.STRING },
      { name: 'zip', type: FieldType.STRING },
    ];
    static override idProperty = 'id';
    static belongsTo = [{ model: 'test.User', foreignKey: 'userId' }];
  };

  User = class User extends Model {
    static override $className = 'test.User';
    static override fields = [
      { name: 'id', type: FieldType.INT },
      { name: 'name', type: FieldType.STRING },
    ];
    static override idProperty = 'id';
    static hasOne = [{ model: 'test.Address', foreignKey: 'userId' }];
    static hasMany = [{ model: 'test.Order', foreignKey: 'userId' }];
  };

  Order = class Order extends Model {
    static override $className = 'test.Order';
    static override fields = [
      { name: 'id', type: FieldType.INT },
      { name: 'userId', type: FieldType.INT },
      { name: 'total', type: FieldType.FLOAT },
    ];
    static override idProperty = 'id';
    static belongsTo = [{ model: 'test.User', foreignKey: 'userId' }];
  };

  Student = class Student extends Model {
    static override $className = 'test.Student';
    static override fields = [
      { name: 'id', type: FieldType.INT },
      { name: 'name', type: FieldType.STRING },
    ];
    static override idProperty = 'id';
    static manyToMany = [
      {
        model: 'test.Course',
        through: 'test.Enrollment',
        foreignKey: 'studentId',
        otherKey: 'courseId',
      },
    ];
  };

  Course = class Course extends Model {
    static override $className = 'test.Course';
    static override fields = [
      { name: 'id', type: FieldType.INT },
      { name: 'title', type: FieldType.STRING },
    ];
    static override idProperty = 'id';
  };

  Enrollment = class Enrollment extends Model {
    static override $className = 'test.Enrollment';
    static override fields = [
      { name: 'id', type: FieldType.INT },
      { name: 'studentId', type: FieldType.INT },
      { name: 'courseId', type: FieldType.INT },
    ];
    static override idProperty = 'id';
  };

  // Register all models (order matters for forward reference test)
  Schema.register(User);
  Schema.register(Address);
  Schema.register(Order);
  Schema.register(Student);
  Schema.register(Course);
  Schema.register(Enrollment);
});

// ═══════════════════════════════════════════════════════════════════════════
// Schema
// ═══════════════════════════════════════════════════════════════════════════

describe('Schema', () => {
  it('registers and retrieves models by class name', () => {
    expect(Schema.get('test.User')).toBe(User);
    expect(Schema.get('test.Address')).toBe(Address);
  });

  it('returns undefined for unregistered model', () => {
    expect(Schema.get('nonexistent')).toBeUndefined();
  });

  it('resolves forward references (Address refs User before User registered)', () => {
    Schema.clear();

    // Register Address first (it references User which isn't registered yet)
    const Addr = class extends Model {
      static override $className = 'fwd.Address';
      static override fields = [
        { name: 'id', type: FieldType.INT },
        { name: 'userId', type: FieldType.INT },
      ];
      static belongsTo = [{ model: 'fwd.User', foreignKey: 'userId' }];
    };
    Schema.register(Addr);

    // Now register User — forward references should resolve
    const Usr = class extends Model {
      static override $className = 'fwd.User';
      static override fields = [
        { name: 'id', type: FieldType.INT },
        { name: 'name', type: FieldType.STRING },
      ];
      static hasOne = [{ model: 'fwd.Address', foreignKey: 'userId' }];
    };
    Schema.register(Usr);

    // Associations should be resolved
    const assocs = Schema.getAssociations('fwd.User');
    expect(assocs.length).toBeGreaterThan(0);
    expect(assocs[0].associatedModel).toBe(Addr);
  });

  it('getAssociations returns all associations for a model', () => {
    const assocs = Schema.getAssociations('test.User');
    expect(assocs.length).toBe(2); // hasOne Address + hasMany Order
  });

  it('clear removes all registrations', () => {
    Schema.clear();
    expect(Schema.get('test.User')).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// HasOne
// ═══════════════════════════════════════════════════════════════════════════

describe('HasOne', () => {
  it('creates getter and setter on the parent model instance', () => {
    const user = User.create({ id: 1, name: 'Alice' });
    expect(typeof (user as any).getAddress).toBe('function');
    expect(typeof (user as any).setAddress).toBe('function');
  });

  it('getter returns null when no associated record is set', () => {
    const user = User.create({ id: 1, name: 'Alice' });
    expect((user as any).getAddress()).toBeNull();
  });

  it('setter stores the associated record', () => {
    const user = User.create({ id: 1, name: 'Alice' });
    const addr = Address.create({ id: 10, userId: 1, city: 'NYC', zip: '10001' });
    (user as any).setAddress(addr);
    expect((user as any).getAddress()).toBe(addr);
  });

  it('setter sets the foreignKey on the child', () => {
    const user = User.create({ id: 1, name: 'Alice' });
    const addr = Address.create({ id: 10, city: 'NYC', zip: '10001' });
    (user as any).setAddress(addr);
    expect(addr.get('userId')).toBe(1);
  });

  it('loads from nested JSON data', () => {
    const user = User.create({
      id: 1,
      name: 'Alice',
      address: { id: 10, city: 'NYC', zip: '10001' },
    });
    const addr = (user as any).getAddress();
    expect(addr).not.toBeNull();
    expect(addr.get('city')).toBe('NYC');
    expect(addr.get('userId')).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// HasMany
// ═══════════════════════════════════════════════════════════════════════════

describe('HasMany', () => {
  it('creates a getter for the collection on the parent', () => {
    const user = User.create({ id: 1, name: 'Alice' });
    expect(typeof (user as any).orders).toBe('function');
  });

  it('getter returns an empty collection initially', () => {
    const user = User.create({ id: 1, name: 'Alice' });
    const orders = (user as any).orders();
    expect(orders.getCount()).toBe(0);
  });

  it('add() adds a child record and sets the foreignKey', () => {
    const user = User.create({ id: 1, name: 'Alice' });
    const order = Order.create({ id: 100, total: 49.99 });
    const orders = (user as any).orders();
    orders.add(order);
    expect(orders.getCount()).toBe(1);
    expect(order.get('userId')).toBe(1);
  });

  it('getAll() returns all child records', () => {
    const user = User.create({ id: 1, name: 'Alice' });
    const o1 = Order.create({ id: 100, total: 10 });
    const o2 = Order.create({ id: 101, total: 20 });
    const orders = (user as any).orders();
    orders.add(o1);
    orders.add(o2);
    expect(orders.getAll().length).toBe(2);
  });

  it('remove() removes a child record', () => {
    const user = User.create({ id: 1, name: 'Alice' });
    const order = Order.create({ id: 100, total: 49.99 });
    const orders = (user as any).orders();
    orders.add(order);
    orders.remove(order);
    expect(orders.getCount()).toBe(0);
  });

  it('loads from nested JSON data', () => {
    const user = User.create({
      id: 1,
      name: 'Alice',
      orders: [
        { id: 100, total: 10 },
        { id: 101, total: 20 },
      ],
    });
    const orders = (user as any).orders();
    expect(orders.getCount()).toBe(2);
    expect(orders.getAll()[0].get('total')).toBe(10);
    expect(orders.getAll()[0].get('userId')).toBe(1);
  });

  it('getById returns a specific child record', () => {
    const user = User.create({
      id: 1,
      name: 'Alice',
      orders: [
        { id: 100, total: 10 },
        { id: 101, total: 20 },
      ],
    });
    const orders = (user as any).orders();
    const found = orders.getById(101);
    expect(found).toBeDefined();
    expect(found.get('total')).toBe(20);
  });

  it('filter returns matching child records', () => {
    const user = User.create({
      id: 1,
      name: 'Alice',
      orders: [
        { id: 100, total: 10 },
        { id: 101, total: 50 },
        { id: 102, total: 5 },
      ],
    });
    const orders = (user as any).orders();
    const expensive = orders.filter((o: Model) => (o.get('total') as number) >= 10);
    expect(expensive.length).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BelongsTo
// ═══════════════════════════════════════════════════════════════════════════

describe('BelongsTo', () => {
  it('creates getter and setter on the child model', () => {
    const order = Order.create({ id: 100, userId: 1, total: 49.99 });
    expect(typeof (order as any).getUser).toBe('function');
    expect(typeof (order as any).setUser).toBe('function');
  });

  it('getter returns null when no parent is set', () => {
    const order = Order.create({ id: 100, userId: 1, total: 49.99 });
    expect((order as any).getUser()).toBeNull();
  });

  it('setter stores the parent record', () => {
    const user = User.create({ id: 1, name: 'Alice' });
    const order = Order.create({ id: 100, total: 49.99 });
    (order as any).setUser(user);
    expect((order as any).getUser()).toBe(user);
  });

  it('setter updates the foreignKey on the child', () => {
    const user = User.create({ id: 1, name: 'Alice' });
    const order = Order.create({ id: 100, total: 49.99 });
    (order as any).setUser(user);
    expect(order.get('userId')).toBe(1);
  });

  it('loads parent from nested JSON data', () => {
    const order = Order.create({
      id: 100,
      userId: 1,
      total: 49.99,
      user: { id: 1, name: 'Alice' },
    });
    const user = (order as any).getUser();
    expect(user).not.toBeNull();
    expect(user.get('name')).toBe('Alice');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ManyToMany
// ═══════════════════════════════════════════════════════════════════════════

describe('ManyToMany', () => {
  it('creates a getter for the associated collection', () => {
    const student = Student.create({ id: 1, name: 'Alice' });
    expect(typeof (student as any).courses).toBe('function');
  });

  it('getter returns empty collection initially', () => {
    const student = Student.create({ id: 1, name: 'Alice' });
    const courses = (student as any).courses();
    expect(courses.getCount()).toBe(0);
  });

  it('link() creates a junction record and adds the associated model', () => {
    const student = Student.create({ id: 1, name: 'Alice' });
    const course = Course.create({ id: 10, title: 'Math' });
    const courses = (student as any).courses();
    courses.link(course);
    expect(courses.getCount()).toBe(1);
    expect(courses.getAll()[0]).toBe(course);
  });

  it('unlink() removes the association', () => {
    const student = Student.create({ id: 1, name: 'Alice' });
    const course = Course.create({ id: 10, title: 'Math' });
    const courses = (student as any).courses();
    courses.link(course);
    courses.unlink(course);
    expect(courses.getCount()).toBe(0);
  });

  it('loads from nested JSON via junction data', () => {
    const student = Student.create({
      id: 1,
      name: 'Alice',
      courses: [
        { id: 10, title: 'Math' },
        { id: 20, title: 'Science' },
      ],
    });
    const courses = (student as any).courses();
    expect(courses.getCount()).toBe(2);
    expect(courses.getAll()[0].get('title')).toBe('Math');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Cascade destroy
// ═══════════════════════════════════════════════════════════════════════════

describe('Cascade destroy', () => {
  it('destroying a hasOne parent with cascade destroys the child', () => {
    // Re-register with cascade: true
    Schema.clear();
    const CascadeUser = class extends Model {
      static override $className = 'cascade.User';
      static override fields = [
        { name: 'id', type: FieldType.INT },
        { name: 'name', type: FieldType.STRING },
      ];
      static hasOne = [{ model: 'cascade.Address', foreignKey: 'userId', cascade: true }];
    };
    const CascadeAddr = class extends Model {
      static override $className = 'cascade.Address';
      static override fields = [
        { name: 'id', type: FieldType.INT },
        { name: 'userId', type: FieldType.INT },
        { name: 'city', type: FieldType.STRING },
      ];
    };
    Schema.register(CascadeUser);
    Schema.register(CascadeAddr);

    const user = CascadeUser.create({
      id: 1,
      name: 'Alice',
      address: { id: 10, city: 'NYC' },
    });
    const addr = (user as any).getAddress();
    expect(addr).not.toBeNull();

    user.destroy();
    expect(addr.isDestroyed).toBe(true);
  });

  it('destroying a hasMany parent with cascade destroys all children', () => {
    Schema.clear();
    const CascadeUser = class extends Model {
      static override $className = 'cascadeM.User';
      static override fields = [
        { name: 'id', type: FieldType.INT },
        { name: 'name', type: FieldType.STRING },
      ];
      static hasMany = [{ model: 'cascadeM.Order', foreignKey: 'userId', cascade: true }];
    };
    const CascadeOrder = class extends Model {
      static override $className = 'cascadeM.Order';
      static override fields = [
        { name: 'id', type: FieldType.INT },
        { name: 'userId', type: FieldType.INT },
        { name: 'total', type: FieldType.FLOAT },
      ];
    };
    Schema.register(CascadeUser);
    Schema.register(CascadeOrder);

    const user = CascadeUser.create({
      id: 1,
      name: 'Alice',
      orders: [
        { id: 100, total: 10 },
        { id: 101, total: 20 },
      ],
    });
    const orders = (user as any).orders();
    const all = orders.getAll();
    expect(all.length).toBe(2);

    user.destroy();
    expect(all[0].isDestroyed).toBe(true);
    expect(all[1].isDestroyed).toBe(true);
  });
});
