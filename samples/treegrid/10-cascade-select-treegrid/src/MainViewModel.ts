import { ViewModel } from '@framesquared/app';

export class MainViewModel extends ViewModel {
  constructor() {
    super({ data: { checkedLeafCount: 0, hasIndeterminate: false } });
  }
  getCheckedLeafCount(): number  { return this.get('checkedLeafCount') as number; }
  getHasIndeterminate(): boolean { return this.get('hasIndeterminate') as boolean; }
}
