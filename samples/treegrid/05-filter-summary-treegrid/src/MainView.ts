import '@framesquared/layout';
import { TreeGrid, TreeGridFilterPlugin, TreeGridSummary, Button } from '@framesquared/ui';
import { TreeStore, TreeModel } from '@framesquared/data';
import { MainViewModel } from './MainViewModel.js';
import { MainViewController } from './MainViewController.js';

export function makeFileSystemStore(): TreeStore {
  return new TreeStore({
    model: TreeModel,
    root: {
      id: 'root', text: 'My Computer', expanded: true,
      children: [
        {
          id: 'docs', text: 'Documents', type: 'Folder', size: 0, expanded: true,
          children: [
            { id: 'resume',  text: 'Resume.pdf',   type: 'PDF',         size: 128,  leaf: true },
            { id: 'budget',  text: 'Budget.xlsx',   type: 'Spreadsheet', size: 256,  leaf: true },
            {
              id: 'projects', text: 'Projects', type: 'Folder', size: 0, expanded: true,
              children: [
                { id: 'website', text: 'Website.psd', type: 'Image', size: 4608, leaf: true },
                { id: 'logo',    text: 'Logo.ai',      type: 'Vector', size: 256,  leaf: true },
              ],
            },
          ],
        },
        {
          id: 'photos', text: 'Photos', type: 'Folder', size: 0, expanded: true,
          children: [
            { id: 'vacation', text: 'Vacation.jpg', type: 'Image', size: 2150, leaf: true },
            { id: 'family',   text: 'Family.png',   type: 'Image', size: 1840, leaf: true },
          ],
        },
      ],
    },
  });
}

export interface MainViewRefs {
  grid:           TreeGrid;
  store:          TreeStore;
  filterPlugin:   TreeGridFilterPlugin;
  summaryPlugin:  TreeGridSummary;
  clearFilterBtn: Button;
  viewModel:      MainViewModel;
  viewController: MainViewController;
}

export function createMainView(host: Element): MainViewRefs {
  const store          = makeFileSystemStore();
  const viewModel      = new MainViewModel();
  const filterPlugin   = new TreeGridFilterPlugin({ filterer: 'bottomup', showFilterRow: true });
  const summaryPlugin  = new TreeGridSummary({
    position: 'bottom',
    treeColumnSummaryText: 'Totals',
    summaryColumns: [
      { dataIndex: 'type', summaryType: 'count',
        summaryRenderer: (_v, count) => `${count} items` },
      { dataIndex: 'size', summaryType: 'sum',
        summaryRenderer: (sum) => `${sum.toLocaleString()} KB` },
    ],
  });
  const viewController = new MainViewController(viewModel);

  let grid!: TreeGrid;
  const clearFilterBtn = new Button({
    text:    'Clear Filter',
    handler: () => viewController.clearFilter({ grid, store, filterPlugin, summaryPlugin, clearFilterBtn, viewModel, viewController }),
  });

  grid = new TreeGrid({
    renderTo: host,
    title:    'File System — Filter & Summary',
    height:   480,
    store,
    tbar:     [clearFilterBtn],
    plugins:  [filterPlugin, summaryPlugin],
    columns: [
      { dataIndex: 'text', text: 'Name', flex: 1 },
      { dataIndex: 'type', text: 'Type', width: 130 },
      { dataIndex: 'size', text: 'Size (KB)', width: 110 },
    ],
  } as any);

  viewController.initView({ grid, store, filterPlugin, summaryPlugin, clearFilterBtn, viewModel, viewController });
  summaryPlugin.renderSummary();

  return { grid, store, filterPlugin, summaryPlugin, clearFilterBtn, viewModel, viewController };
}
