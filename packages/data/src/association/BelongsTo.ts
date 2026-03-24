/**
 * @framesquared/data – BelongsTo association
 */
import { Association } from './Association.js';
import type { AssociationConfig } from './Association.js';

export class BelongsTo extends Association {
  constructor(ownerModelName: string, config: AssociationConfig) {
    super('belongsTo', ownerModelName, config);
  }
}
