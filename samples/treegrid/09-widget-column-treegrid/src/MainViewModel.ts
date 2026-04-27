import { ViewModel } from '@framesquared/app';

export class MainViewModel extends ViewModel {
  constructor() {
    super({ data: {
      clickedId:      '',
      clickCount:     0,
      selectedName:   '',
      selectedRole:   '',
      selectedSalary: 0,
    }});
  }
  getClickedId():      string { return this.get('clickedId')      as string; }
  getClickCount():     number { return this.get('clickCount')      as number; }
  getSelectedName():   string { return this.get('selectedName')    as string; }
  getSelectedRole():   string { return this.get('selectedRole')    as string; }
  getSelectedSalary(): number { return this.get('selectedSalary')  as number; }
}
