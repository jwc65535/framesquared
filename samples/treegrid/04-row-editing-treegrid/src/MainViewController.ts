import { ViewController } from '@framesquared/app';
import type { MainViewModel } from './MainViewModel.js';
import type { MainViewRefs } from './MainView.js';

export class MainViewController extends ViewController {
  private viewModel: MainViewModel;
  constructor(viewModel: MainViewModel) { super(); this.viewModel = viewModel; }

  initView(refs: MainViewRefs): void {
    super.init(refs.grid);
    const { plugin } = refs;

    const origStart    = plugin.startEdit.bind(plugin);
    const origComplete = plugin.completeEdit.bind(plugin);
    const origCancel   = plugin.cancelEdit.bind(plugin);

    plugin.startEdit = (record) => {
      origStart(record);
      this.viewModel.set('editing', true);
    };
    plugin.completeEdit = () => {
      origComplete();
      this.viewModel.set('editing', false);
      this.viewModel.set('saveCount', this.viewModel.getSaveCount() + 1);
    };
    plugin.cancelEdit = () => {
      origCancel();
      this.viewModel.set('editing', false);
      this.viewModel.set('cancelCount', this.viewModel.getCancelCount() + 1);
    };
  }
}
