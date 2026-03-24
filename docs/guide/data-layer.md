# Data Layer

The data layer manages application state through Models (records), Stores (collections), and Proxies (server communication).

## Models

Models define the shape of your data with typed fields and validation:

```typescript
import { Model } from '@framesquared/data';

class Product extends Model {
  static fields = [
    { name: 'id', type: 'int' },
    { name: 'name', type: 'string' },
    { name: 'price', type: 'float' },
    { name: 'inStock', type: 'boolean', defaultValue: true },
    { name: 'createdAt', type: 'date' },
  ];

  static validators = {
    name: [{ type: 'presence' }, { type: 'length', min: 1, max: 100 }],
    price: [{ type: 'range', min: 0 }],
  };
}

const product = Product.create({ name: 'Widget', price: 9.99 });
product.get('name');        // 'Widget'
product.set('price', 12.99);
product.getData();          // { id: ..., name: 'Widget', price: 12.99, ... }
product.isValid();          // true
```

### Field Types

| Type | Converts to | Example |
|------|------------|---------|
| `string` | `String` | `'hello'` |
| `int` | `Number` (integer) | `42` |
| `float` | `Number` (decimal) | `3.14` |
| `boolean` | `Boolean` | `true` |
| `date` | `Date` | `new Date()` |
| `auto` | No conversion | As-is |

## Stores

Stores are observable collections of Model records:

```typescript
import { Store } from '@framesquared/data';

const store = new Store({
  model: Product,
  data: [
    { id: 1, name: 'Widget', price: 9.99 },
    { id: 2, name: 'Gadget', price: 19.99 },
  ],
});

store.getCount();           // 2
store.getAt(0);             // First record
store.getById(1);           // Record with id=1
store.getRange();           // All records
store.each(record => { }); // Iterate
```

### Sorting

```typescript
store.sort('price');                     // ASC by price
store.sort('name', 'DESC');              // DESC by name
store.sort([
  { property: 'category', direction: 'ASC' },
  { property: 'price', direction: 'DESC' },
]);
```

### Filtering

```typescript
store.filter('price', 9.99);             // Exact match
store.filter([
  { property: 'inStock', value: true },
  { property: 'price', operator: 'gt', value: 5 },
]);
store.clearFilter();
```

Filter operators: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `like`, `in`, `notin`.

### Grouping

```typescript
store.group('category');
const groups = store.getGroups();
// [{ name: 'Electronics', records: [...] }, { name: 'Books', records: [...] }]
```

### Events

| Event | When |
|-------|------|
| `add` | Records added |
| `remove` | Records removed |
| `update` | Record field changed |
| `datachanged` | Any data modification |
| `sort` | After sorting |
| `filterchange` | After filtering |
| `load` | After remote load |
| `clear` | After removeAll |

## Proxies

Proxies handle server communication:

### AjaxProxy (fetch-based)

```typescript
import { AjaxProxy } from '@framesquared/data';

const proxy = new AjaxProxy({
  model: Product,
  url: '/api/products',
  headers: { Authorization: 'Bearer token' },
});
```

### RestProxy

```typescript
import { RestProxy } from '@framesquared/data';

const proxy = new RestProxy({
  model: Product,
  url: '/api/products',
  // GET /api/products     → read
  // POST /api/products    → create
  // PUT /api/products/1   → update
  // DELETE /api/products/1 → destroy
});
```

### GraphQLProxy

```typescript
import { GraphQLProxy } from '@framesquared/data';

const proxy = new GraphQLProxy({
  model: Product,
  url: '/graphql',
  query: 'query { products { id name price } }',
  mutation: 'mutation($input: ProductInput!) { saveProduct(input: $input) { id } }',
  rootProperty: 'data.products',
});
```

### WebSocketProxy

```typescript
import { WebSocketProxy } from '@framesquared/data';

const proxy = new WebSocketProxy({
  model: Product,
  url: 'ws://localhost:8080/products',
  reconnect: true,
  reconnectInterval: 3000,
});

proxy.on('message', (data) => {
  console.log('Real-time update:', data);
});
proxy.connect();
```

## Associations

```typescript
import { HasMany, BelongsTo } from '@framesquared/data';

class Author extends Model {
  static fields = [{ name: 'id', type: 'int' }, { name: 'name', type: 'string' }];
  static associations = [
    new HasMany({ model: () => Book, foreignKey: 'authorId', name: 'books' }),
  ];
}

class Book extends Model {
  static fields = [
    { name: 'id', type: 'int' },
    { name: 'title', type: 'string' },
    { name: 'authorId', type: 'int' },
  ];
  static associations = [
    new BelongsTo({ model: () => Author, foreignKey: 'authorId', name: 'author' }),
  ];
}
```

## Connection (Centralized Fetch)

```typescript
import { Connection } from '@framesquared/data';

Connection.setDefaultHeaders({ Authorization: 'Bearer token' });
Connection.addRequestInterceptor((url, init) => {
  console.log('Request:', url);
  return [url, init];
});
Connection.setErrorHandler((err) => showNotification(err.message));
```

## Session (Batch Changes)

```typescript
import { Session, BatchProxy } from '@framesquared/data';

const session = new Session();
session.trackCreate(newProduct);
session.trackUpdate(editedProduct);
session.trackDestroy(deletedProduct);

if (session.isDirty()) {
  const result = await session.save(batchProxy);
  if (result.success) session.commit();
  else session.reject();
}
```
