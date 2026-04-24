import { ViewController } from '@framesquared/app';
import { TreeGridExporter } from '@framesquared/ui';
import type { MainViewModel } from './MainViewModel.js';
import type { MainViewRefs } from './MainView.js';

export class MainViewController extends ViewController {
  private viewModel: MainViewModel;
  constructor(viewModel: MainViewModel) { super(); this.viewModel = viewModel; }

  initView(refs: MainViewRefs): void {
    super.init(refs.grid);
  }

  exportCsv(refs: MainViewRefs): string {
    const result = TreeGridExporter.exportToCsv(refs.grid);
    this.viewModel.set('lastExportFormat', 'csv');
    this.viewModel.set('exportCount', this.viewModel.getExportCount() + 1);
    return result;
  }

  exportTsv(refs: MainViewRefs): string {
    const result = TreeGridExporter.exportToTsv(refs.grid);
    this.viewModel.set('lastExportFormat', 'tsv');
    this.viewModel.set('exportCount', this.viewModel.getExportCount() + 1);
    return result;
  }

  exportJson(refs: MainViewRefs): string {
    const result = TreeGridExporter.exportToJson(refs.grid);
    this.viewModel.set('lastExportFormat', 'json');
    this.viewModel.set('exportCount', this.viewModel.getExportCount() + 1);
    return result;
  }
}
