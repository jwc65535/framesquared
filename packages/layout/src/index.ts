/**
 * @framesquared/layout
 * Layout managers
 */

import { registerLayout } from '@framesquared/component';
import { HBoxLayout } from './box/HBoxLayout.js';
import { VBoxLayout } from './box/VBoxLayout.js';
import { FitLayout } from './FitLayout.js';
import { CardLayout } from './CardLayout.js';
import { AnchorLayout } from './AnchorLayout.js';
import { BorderLayout } from './BorderLayout.js';
import { ColumnLayout } from './ColumnLayout.js';
import { TableLayout } from './TableLayout.js';
import { AbsoluteLayout } from './AbsoluteLayout.js';
import { AccordionLayout } from './AccordionLayout.js';

registerLayout('hbox',     HBoxLayout);
registerLayout('vbox',     VBoxLayout);
registerLayout('fit',      FitLayout);
registerLayout('card',     CardLayout);
registerLayout('anchor',   AnchorLayout);
registerLayout('border',   BorderLayout);
registerLayout('column',   ColumnLayout);
registerLayout('table',    TableLayout);
registerLayout('absolute', AbsoluteLayout);
registerLayout('accordion',AccordionLayout);

export { Layout } from './Layout.js';
export type { SizePolicy, LayoutConfig } from './Layout.js';
export { AutoLayout } from './AutoLayout.js';
export { LayoutContext } from './LayoutContext.js';
export { LayoutRunner } from './LayoutRunner.js';

// Box layouts
export { BoxLayout } from './box/BoxLayout.js';
export type { BoxLayoutConfig, BoxAlign, BoxPack, BoxOverflow } from './box/BoxLayout.js';
export { HBoxLayout, HBoxLayout as HBox } from './box/HBoxLayout.js';
export { VBoxLayout, VBoxLayout as VBox } from './box/VBoxLayout.js';

// Additional layouts
export { FitLayout } from './FitLayout.js';
export { CardLayout } from './CardLayout.js';
export type { CardLayoutConfig } from './CardLayout.js';
export { AnchorLayout } from './AnchorLayout.js';
export { BorderLayout } from './BorderLayout.js';
export type { BorderLayoutConfig } from './BorderLayout.js';
export { ColumnLayout } from './ColumnLayout.js';
export { TableLayout } from './TableLayout.js';
export type { TableLayoutConfig } from './TableLayout.js';
export { AbsoluteLayout } from './AbsoluteLayout.js';
export { AccordionLayout } from './AccordionLayout.js';
export type { AccordionLayoutConfig } from './AccordionLayout.js';

// Responsive
export { ResponsivePlugin } from './ResponsivePlugin.js';
export type { ResponsiveConfig } from './ResponsivePlugin.js';
export { ResponsiveColumnLayout } from './ResponsiveColumnLayout.js';
export type { ResponsiveColumnLayoutConfig } from './ResponsiveColumnLayout.js';
