/**
 * @framesquared/data
 * Models, stores, and proxies
 */

export { Model } from './Model.js';
export type { ValidationResult, ValidationError } from './Model.js';

export {
  FieldType,
  Field,
  StringField,
  IntField,
  FloatField,
  BooleanField,
  DateField,
  AutoField,
  createField,
} from './field/Field.js';
export type { FieldDefinition, Validator } from './field/Field.js';

export {
  presence,
  length,
  formatValidator,
  inclusion,
  exclusion,
  rangeValidator,
  email,
} from './validators.js';

export { Schema } from './Schema.js';

export { Association } from './association/Association.js';
export type { AssociationConfig, AssociationType } from './association/Association.js';
export { HasOne } from './association/HasOne.js';
export { HasMany } from './association/HasMany.js';
export { BelongsTo } from './association/BelongsTo.js';
export { ManyToMany } from './association/ManyToMany.js';

export { ModelCollection, ManyToManyCollection } from './ModelCollection.js';

export { Store } from './store/Store.js';
export type { Sorter, Filter, FilterOperator, Group, StoreConfig } from './store/Store.js';
export { Collection } from './store/Collection.js';

// Operation & ResultSet
export { Operation } from './Operation.js';
export type { OperationAction, OperationConfig } from './Operation.js';
export { ResultSet } from './ResultSet.js';
export type { ResultSetConfig } from './ResultSet.js';

// Readers
export { JsonReader, ArrayReader, XmlReader } from './reader/Reader.js';
export type { JsonReaderConfig, ArrayReaderConfig, XmlReaderConfig } from './reader/Reader.js';

// Writers
export { JsonWriter, XmlWriter } from './writer/Writer.js';
export type { JsonWriterConfig, XmlWriterConfig } from './writer/Writer.js';

// Proxies
export { Proxy } from './proxy/Proxy.js';
export type { ProxyConfig, BatchOptions, Batch } from './proxy/Proxy.js';
export { MemoryProxy, LocalStorageProxy, SessionStorageProxy } from './proxy/ClientProxy.js';
export type { MemoryProxyConfig, WebStorageProxyConfig } from './proxy/ClientProxy.js';
export { AjaxProxy, RestProxy } from './proxy/ServerProxy.js';
export type { AjaxProxyConfig, RestProxyConfig } from './proxy/ServerProxy.js';

// Tree
export { TreeStore } from './store/TreeStore.js';
export type { TreeStoreConfig } from './store/TreeStore.js';
export { applyNodeInterface } from './mixin/NodeInterface.js';
export type { NodeInterface } from './mixin/NodeInterface.js';

// Buffered
export { BufferedStore } from './store/BufferedStore.js';
export type { BufferedStoreConfig } from './store/BufferedStore.js';

// Advanced Proxies
export { GraphQLProxy } from './proxy/GraphQLProxy.js';
export type { GraphQLProxyConfig } from './proxy/GraphQLProxy.js';
export { WebSocketProxy } from './proxy/WebSocketProxy.js';
export type { WebSocketProxyConfig } from './proxy/WebSocketProxy.js';
export { BatchProxy } from './proxy/BatchProxy.js';
export type { BatchProxyConfig } from './proxy/BatchProxy.js';

// Connection & Session
export { Connection } from './data/Connection.js';
export { Session } from './data/Session.js';
export type { SessionChanges } from './data/Session.js';
