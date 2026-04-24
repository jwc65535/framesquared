import { ViewModel } from '@framesquared/app';

export class MainViewModel extends ViewModel {
  constructor() {
    super({ data: { filterText: '', filteredCount: 0, totalSize: 0 } });
  }
  getFilterText():    string { return this.get('filterText') as string; }
  getFilteredCount(): number { return this.get('filteredCount') as number; }
  getTotalSize():     number { return this.get('totalSize') as number; }
}
