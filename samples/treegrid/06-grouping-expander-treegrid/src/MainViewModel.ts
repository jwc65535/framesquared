import { ViewModel } from '@framesquared/app';

export class MainViewModel extends ViewModel {
  constructor() {
    super({ data: { expandedDetailRows: 0, lastExpandedId: '' } });
  }
  getExpandedDetailRows(): number { return this.get('expandedDetailRows') as number; }
  getLastExpandedId():     string { return this.get('lastExpandedId') as string; }
}
