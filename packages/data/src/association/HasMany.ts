/**
 * @framesquared/data – HasMany association
 */
import { Association } from './Association.js';
import type { AssociationConfig } from './Association.js';

export class HasMany extends Association {
  constructor(ownerModelName: string, config: AssociationConfig) {
    super('hasMany', ownerModelName, config);
  }
}
