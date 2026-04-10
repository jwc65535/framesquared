/**
 * @framesquared/component
 * Component model, lifecycle, and rendering
 */

import './styles.js';

export { Component } from './Component.js';
export type { ComponentConfig } from './Component.js';
export { Controller } from './Controller.js';
export type { ControllerConfig, EventMap } from './Controller.js';
export { Template } from './Template.js';
export { Container } from './Container.js';
export type { ContainerConfig } from './Container.js';
export { ComponentQuery, matchesCQ } from './ComponentQuery.js';
export { Layout, resolveLayout } from './Layout.js';
export type { LayoutConfig } from './Layout.js';

// New CQ engine
export { CQParser } from './query/CQParser.js';
export type {
  SelectorNode,
  CompoundSelectorNode,
  CombinatorNode,
  SelectorListNode,
} from './query/CQParser.js';
export { CQMatcher } from './query/CQMatcher.js';
export { CQ } from './query/ComponentQuery.js';

// XTemplate
export { XTemplate } from './template/XTemplate.js';
