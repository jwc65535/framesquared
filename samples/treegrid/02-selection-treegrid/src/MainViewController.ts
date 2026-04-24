import { ViewController } from '@framesquared/app';
import type { MainViewModel } from './MainViewModel.js';
import type { MainViewRefs } from './MainView.js';

export class MainViewController extends ViewController {
  private viewModel: MainViewModel;

  constructor(viewModel: MainViewModel) {
    super();
    this.viewModel = viewModel;
  }

  initView(refs: MainViewRefs): void {
    super.init(refs.grid);

    refs.grid.on('selectionchange', (_sm: unknown, selection: import('@framesquared/data').NodeInterface[]) => {
      this.viewModel.set('selectedCount', selection.length);
      this.viewModel.set(
        'lastSelected',
        selection.length > 0 ? (selection[selection.length - 1].get('text') as string) : '',
      );
    });
  }

  clearSelection(refs: MainViewRefs): void {
    refs.grid.deselectAll();
    refs.grid.uncheckAll();
    this.viewModel.set('selectedCount', 0);
    this.viewModel.set('lastSelected', '');
  }
}
