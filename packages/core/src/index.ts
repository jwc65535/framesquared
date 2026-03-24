/**
 * @ext-ts/core
 * Class system, events, and utilities
 */

export const VERSION = '0.0.1';

// General utilities
export {
  identity,
  emptyFn,
  applyIf,
  apply,
  clone,
  isObject,
  isString,
  isNumber,
  isBoolean,
  isFunction,
  isArray,
  isDefined,
  isEmpty,
  isIterable,
  isPrimitive,
  namespace,
  defer,
  interval,
  now,
  generateId,
} from './util/index.js';

// String utilities
export {
  capitalize,
  uncapitalize,
  ellipsis,
  escapeHtml,
  unescapeHtml,
  escapeRegex,
  format,
  repeat,
  trim,
  leftPad,
  toggle,
  splitWords,
  camelCase,
  kebabCase,
  pascalCase,
  htmlEncode,
  htmlDecode,
} from './util/String.js';

// Array utilities
export {
  from,
  contains,
  include,
  remove,
  clean,
  unique,
  flatten,
  pluck,
  sum,
  mean,
  min,
  max,
  groupBy,
  partition,
  chunk,
  difference,
  intersection,
  sortBy,
  findBy,
  range,
} from './util/Array.js';

// Object utilities
export {
  keys,
  values,
  entries,
  fromEntries,
  merge,
  pick,
  omit,
  mapValues,
  mapKeys,
  freeze,
  equals,
  getNestedValue,
  setNestedValue,
  flattenObject,
  unflattenObject,
} from './util/Object.js';

// Function utilities
export {
  bind,
  createBuffered,
  createDelayed,
  createThrottled,
  createBarrier,
  interceptBefore,
  interceptAfter,
  createSequence,
  memoize,
  once,
  negate,
  compose,
  pipe,
} from './util/Function.js';

// Class system
export { Base, ClassManager, define } from './class/index.js';
export type { ClassDefinition } from './class/index.js';

// Decorators & Configurator
export { config, observable, alias, mixin, override, Configurator } from './class/index.js';
export type { ConfigMeta } from './class/index.js';

// Mixins
export {
  Identifiable,
  IdentityMap,
  Factoryable,
  Inheritable,
  Hookable,
  Pluggable,
} from './mixin/index.js';

// Plugin
export { Plugin } from './Plugin.js';

// Event system
export { ExtEvent, Observable, DestroyableUtil, EventDomain, EventBus, EventManager, GestureRecognizer, KeyMap } from './event/index.js';
export type { ListenerOptions, Destroyable, ListenerConfig, TypedObservable, EventMap, KeyBinding, KeyMapConfig } from './event/index.js';

// ARIA / Accessibility
export { AriaManager } from './aria/AriaManager.js';
export { FocusManager } from './aria/FocusManager.js';

// Locale / i18n
export { Locale } from './locale/Locale.js';
export type { LocaleConfig, NumberFormatOptions } from './locale/Locale.js';
export { LocaleManager } from './locale/LocaleManager.js';
export { enUS } from './locale/bundles/en-US.js';
export { esES } from './locale/bundles/es-ES.js';
export { arSA } from './locale/bundles/ar-SA.js';

// Security / Sanitization
export { Sanitizer } from './util/Sanitizer.js';
