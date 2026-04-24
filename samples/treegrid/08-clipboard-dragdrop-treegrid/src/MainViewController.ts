import { ViewController } from '@framesquared/app';
import type { MainViewModel } from './MainViewModel.js';
import type { MainViewRefs } from './MainView.js';

export class MainViewController extends ViewController {
  private viewModel: MainViewModel;
  constructor(viewModel: MainViewModel) { super(); this.viewModel = viewModel; }

  initView(refs: MainViewRefs): void {
    super.init(refs.grid);
  }

  copySelected(refs: MainViewRefs): string {
    const text = refs.clipboard.copyToClipboard();
    this.viewModel.set('copiedText', text);
    return text;
  }

  pasteText(refs: MainViewRefs, text: string): void {
    refs.clipboard.pasteFromText(text);
    this.viewModel.set('pasteCount', this.viewModel.getPasteCount() + 1);
  }
}
