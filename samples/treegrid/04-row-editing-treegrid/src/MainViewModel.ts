import { ViewModel } from '@framesquared/app';

export class MainViewModel extends ViewModel {
  constructor() {
    super({ data: { editing: false, saveCount: 0, cancelCount: 0 } });
  }
  isEditing():     boolean { return this.get('editing') as boolean; }
  getSaveCount():  number  { return this.get('saveCount') as number; }
  getCancelCount(): number { return this.get('cancelCount') as number; }
}
