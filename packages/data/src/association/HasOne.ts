/**
 * @framesquared/data – HasOne association
 */
import { Association } from './Association.js';
import type { AssociationConfig } from './Association.js';

export class HasOne extends Association {
  constructor(ownerModelName: string, config: AssociationConfig) {
    super('hasOne', ownerModelName, config);
  }
}
