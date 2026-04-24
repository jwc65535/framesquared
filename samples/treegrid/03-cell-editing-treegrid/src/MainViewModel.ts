import { ViewModel } from '@framesquared/app';

export class MainViewModel extends ViewModel {
  constructor() {
    super({ data: { editing: false, editCount: 0, lastEditedField: '' } });
  }
  isEditing():      boolean { return this.get('editing') as boolean; }
  getEditCount():   number  { return this.get('editCount') as number; }
  getLastField():   string  { return this.get('lastEditedField') as string; }
}
