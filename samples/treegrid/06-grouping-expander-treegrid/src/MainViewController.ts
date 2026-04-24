import { ViewController } from '@framesquared/app';
import type { NodeInterface } from '@framesquared/data';
import type { MainViewModel } from './MainViewModel.js';
import type { MainViewRefs } from './MainView.js';

export class MainViewController extends ViewController {
  private viewModel: MainViewModel;
  constructor(viewModel: MainViewModel) { super(); this.viewModel = viewModel; }

  initView(refs: MainViewRefs): void {
    super.init(refs.grid);
  }

  expandDetail(refs: MainViewRefs, node: NodeInterface): void {
    refs.rowExpander.expandRow(node);
    this.viewModel.set('expandedDetailRows', this.viewModel.getExpandedDetailRows() + 1);
    this.viewModel.set('lastExpandedId', String((node as any).getId?.() ?? ''));
  }

  collapseDetail(refs: MainViewRefs, node: NodeInterface): void {
    refs.rowExpander.collapseRow(node);
    this.viewModel.set('expandedDetailRows',
      Math.max(0, this.viewModel.getExpandedDetailRows() - 1));
  }
}
