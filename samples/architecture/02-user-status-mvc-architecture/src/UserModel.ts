import { Model } from '@framesquared/data';

export class UserModel extends Model {
  static override $className = 'UserModel';

  static override fields = [
    { name: 'id',         type: 'string' },
    { name: 'name',       type: 'string' },
    { name: 'department', type: 'string' },
    { name: 'status',     type: 'string' }, // 'Active' | 'Inactive'
  ];
}
