/**
 * @framesquared/core – class system barrel
 */

export { Base } from './Base.js';
export { ClassManager, define } from './ClassManager.js';
export type { ClassDefinition } from './ClassManager.js';

export { Configurator } from './Configurator.js';
export type { ConfigMeta } from './Configurator.js';

export { config, observable, alias, mixin, override } from './decorators.js';
