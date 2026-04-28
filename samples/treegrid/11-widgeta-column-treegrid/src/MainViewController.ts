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

  handleStatusChange(refs: MainViewRefs, node: NodeInterface, status: string): void {
    const name = String((node as any).get?.('text') ?? '');
    this._log(refs, `${name} status → ${status}`);
  }

  handleLevelChange(refs: MainViewRefs, node: NodeInterface, level: string): void {
    const name = String((node as any).get?.('text') ?? '');
    this._log(refs, `${name} level → ${level}`);
  }

  handleEdit(refs: MainViewRefs, node: NodeInterface): void {
    const name = String((node as any).get?.('text') ?? '');
    this._log(refs, `Editing ${name}…`);
  }

  handleContractor(refs: MainViewRefs, node: NodeInterface, isContractor: boolean): void {
    const name = String((node as any).get?.('text') ?? '');
    this._log(refs, `${name} contractor → ${isContractor}`);
  }

  handleScore(refs: MainViewRefs, node: NodeInterface, score: number): void {
    const name = String((node as any).get?.('text') ?? '');
    this._log(refs, `${name} score → ${score}`);
  }

  private _log(refs: MainViewRefs, msg: string): void {
    this.viewModel.set('lastEvent',  msg);
    this.viewModel.set('eventCount', this.viewModel.getEventCount() + 1);
    refs.detailPanel.update(msg);
  }
}
