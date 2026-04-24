import { ViewModel } from '@framesquared/app';

export class MainViewModel extends ViewModel {
  constructor() {
    super({ data: { clickedId: '', clickCount: 0 } });
  }
  getClickedId():  string { return this.get('clickedId') as string; }
  getClickCount(): number { return this.get('clickCount') as number; }
}
