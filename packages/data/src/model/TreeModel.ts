/**
 * @framesquared/data – TreeModel
 *
 * A convenience Model subclass with NodeInterface pre-applied via create().
 */

import { Model } from '../Model.js';
import { applyNodeInterface } from '../mixin/NodeInterface.js';
import type { NodeInterface } from '../mixin/NodeInterface.js';
import { FieldType } from '../field/Field.js';

export class TreeModel extends Model {
  static override $className = 'Ext.data.TreeModel';
  static override idProperty = 'id';
  static defaultRootId = 'root';
  static defaultRootText = 'Root';

  static override fields = [
    { name: 'id', type: FieldType.AUTO },
    { name: 'text', type: FieldType.STRING, defaultValue: '' },
    { name: 'leaf', type: FieldType.BOOLEAN, defaultValue: false },
    { name: 'cls', type: FieldType.STRING, defaultValue: '' },
    { name: 'iconCls', type: FieldType.STRING, defaultValue: '' },
    { name: 'icon', type: FieldType.STRING, defaultValue: '' },
    { name: 'href', type: FieldType.STRING, defaultValue: '' },
    { name: 'hrefTarget', type: FieldType.STRING, defaultValue: '' },
    { name: 'qtip', type: FieldType.STRING, defaultValue: '' },
    { name: 'qtitle', type: FieldType.STRING, defaultValue: '' },
    { name: 'allowDrop', type: FieldType.BOOLEAN, defaultValue: true },
    { name: 'allowDrag', type: FieldType.BOOLEAN, defaultValue: true },
  ];

  /**
   * Factory method that creates a TreeModel instance with NodeInterface
   * already applied.
   */
  static override create(
    this: typeof Model,
    data?: Record<string, unknown>,
  ): InstanceType<typeof Model> & NodeInterface {
    const instance = super.create(data);
    applyNodeInterface(instance, 0);
    return instance as InstanceType<typeof Model> & NodeInterface;
  }
}
