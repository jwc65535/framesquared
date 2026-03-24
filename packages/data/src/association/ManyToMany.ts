/**
 * @framesquared/data – ManyToMany association
 */
import { Association } from './Association.js';
import type { AssociationConfig } from './Association.js';

export class ManyToMany extends Association {
  constructor(ownerModelName: string, config: AssociationConfig) {
    super('manyToMany', ownerModelName, config);
  }

  get through(): string {
    return this.config.through ?? '';
  }

  get otherKey(): string {
    return this.config.otherKey ?? '';
  }
}
