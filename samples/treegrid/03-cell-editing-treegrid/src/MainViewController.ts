import { ViewController } from '@framesquared/app';
import type { MainViewModel } from './MainViewModel.js';
import type { MainViewRefs } from './MainView.js';

export class MainViewController extends ViewController {
  private viewModel: MainViewModel;
  constructor(viewModel: MainViewModel) { super(); this.viewModel = viewModel; }

  initView(refs: MainViewRefs): void {
    super.init(refs.grid);
    const { plugin } = refs;
    // Track when editing starts
    const origStart = plugin.startEdit.bind(plugin);
    plugin.startEdit = (record, dataIndex) => {
      origStart(record, dataIndex);
      this.viewModel.set('editing', true);
      this.viewModel.set('lastEditedField', dataIndex);
    };
    // Track when editing completes
    const origComplete = plugin.completeEdit.bind(plugin);
    plugin.completeEdit = () => {
      origComplete();
      this.viewModel.set('editing', false);
      this.viewModel.set('editCount', (this.viewModel.getEditCount() as number) + 1);
    };
  }
}
