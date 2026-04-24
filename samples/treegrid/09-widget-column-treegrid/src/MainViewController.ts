import { ViewController } from '@framesquared/app';
import type { NodeInterface } from '@framesquared/data';
import type { MainViewModel } from './MainViewModel.js';
import type { MainViewRefs } from './MainView.js';

export class MainViewController extends ViewController {
  private viewModel: MainViewModel;
  constructor(viewModel: MainViewModel) { super(); this.viewModel = viewModel; }

  initView(refs: MainViewRefs): void {
    super.init(refs.grid);
    refs.grid.on('itemclick', (_view: unknown, node: NodeInterface) => {
      this.viewModel.set('clickedId', String((node as any).getId?.() ?? ''));
      this.viewModel.set('clickCount', this.viewModel.getClickCount() + 1);
    });
  }

  handleAction(refs: MainViewRefs, node: NodeInterface): void {
    this.viewModel.set('clickedId', String((node as any).getId?.() ?? ''));
    this.viewModel.set('clickCount', this.viewModel.getClickCount() + 1);
  }
}
