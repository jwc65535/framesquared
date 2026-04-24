import { ViewController } from '@framesquared/app';
import type { NodeInterface } from '@framesquared/data';
import type { MainViewModel } from './MainViewModel.js';
import type { MainViewRefs } from './MainView.js';

export class MainViewController extends ViewController {
  private viewModel: MainViewModel;
  constructor(viewModel: MainViewModel) { super(); this.viewModel = viewModel; }

  initView(refs: MainViewRefs): void {
    super.init(refs.grid);
    refs.grid.on('checkchange', () => this._syncViewModel(refs));
  }

  private _syncViewModel(refs: MainViewRefs): void {
    this.viewModel.set('checkedLeafCount', refs.grid.getCheckedLeaves().length);
    this.viewModel.set('hasIndeterminate', this._anyIndeterminate(refs));
  }

  private _anyIndeterminate(refs: MainViewRefs): boolean {
    let found = false;
    refs.store.getRootNode().cascadeBy((n) => {
      if (!n.isRoot() && !n.isLeaf() && (n as any).$checked === null) found = true;
    });
    return found;
  }

  checkBranch(refs: MainViewRefs, node: NodeInterface): void {
    refs.grid.setChecked(node, true);
    this._syncViewModel(refs);
  }

  uncheckBranch(refs: MainViewRefs, node: NodeInterface): void {
    refs.grid.setChecked(node, false);
    this._syncViewModel(refs);
  }

  clearAll(refs: MainViewRefs): void {
    refs.grid.uncheckAll();
    this.viewModel.set('checkedLeafCount', 0);
    this.viewModel.set('hasIndeterminate', false);
  }
}
