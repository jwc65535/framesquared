import { ViewController } from '@framesquared/app';
import type { MainViewModel } from './MainViewModel.js';
import type { MainViewRefs } from './MainView.js';

export class MainViewController extends ViewController {
  private viewModel: MainViewModel;
  constructor(viewModel: MainViewModel) { super(); this.viewModel = viewModel; }

  initView(refs: MainViewRefs): void {
    super.init(refs.grid);
    // Seed total size from store
    this.updateTotalSize(refs);
    (refs.grid.getStore() as any).on('datachanged', () => this.updateTotalSize(refs));
  }

  filterByName(refs: MainViewRefs, text: string): void {
    this.viewModel.set('filterText', text);
    if (text.trim() === '') {
      refs.filterPlugin.clearFilters();
    } else {
      refs.filterPlugin.addFilter({ dataIndex: 'text', value: text, operator: 'contains' });
    }
    this.viewModel.set('filteredCount', refs.filterPlugin.getFilteredCount());
  }

  clearFilter(refs: MainViewRefs): void {
    refs.filterPlugin.clearFilters();
    this.viewModel.set('filterText', '');
    this.viewModel.set('filteredCount', refs.filterPlugin.getFilteredCount());
  }

  private updateTotalSize(refs: MainViewRefs): void {
    const total = refs.summaryPlugin.calculateSummary('size', 'sum');
    this.viewModel.set('totalSize', total);
  }
}
