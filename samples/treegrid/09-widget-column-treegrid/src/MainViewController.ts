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
      this.handleAction(refs, node);
    });
  }

  handleAction(refs: MainViewRefs, node: NodeInterface): void {
    const id     = String((node as any).getId?.() ?? '');
    const name   = String((node as any).get?.('text')   ?? '');
    const role   = String((node as any).get?.('role')   ?? '');
    const salary = Number((node as any).get?.('salary') ?? 0);

    this.viewModel.set('clickedId',      id);
    this.viewModel.set('clickCount',     this.viewModel.getClickCount() + 1);
    this.viewModel.set('selectedName',   name);
    this.viewModel.set('selectedRole',   role);
    this.viewModel.set('selectedSalary', salary);

    refs.detailPanel.update(this._buildHtml(name, role, salary));
  }

  private _buildHtml(name: string, role: string, salary: number): string {
    const sal = salary ? `$${salary.toLocaleString()}` : '—';
    return `<strong>${name}</strong>&nbsp;&nbsp;${role}&nbsp;&nbsp;|&nbsp;&nbsp;${sal}`;
  }
}
