import '@framesquared/layout';
import { TreeGrid } from '@framesquared/ui';
import { TreeGridCellEditing } from '@framesquared/ui';
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
              id: 'projects', text: 'Projects', type: 'Folder', size: 0,
              children: [
                { id: 'website', text: 'Website.psd', type: 'Image', size: 4608, leaf: true },
                { id: 'logo',    text: 'Logo.ai',      type: 'Vector', size: 256,  leaf: true },
              ],
            },
          ],
        },
        {
          id: 'photos', text: 'Photos', type: 'Folder', size: 0,
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
  plugin:         TreeGridCellEditing;
  viewModel:      MainViewModel;
  viewController: MainViewController;
}

export function createMainView(host: Element): MainViewRefs {
  const store          = makeFileSystemStore();
  const viewModel      = new MainViewModel();
  const plugin         = new TreeGridCellEditing({ clicksToEdit: 2 });
  const viewController = new MainViewController(viewModel);

  const grid = new TreeGrid({
    renderTo: host,
    title:    'File System — Cell Editing',
    height:   400,
    store,
    plugins:  [plugin],
    columns: [
      { dataIndex: 'text', text: 'Name', flex: 1,
        editor: { xtype: 'textfield' } },
      { dataIndex: 'type', text: 'Type', width: 130,
        editor: { xtype: 'combobox', options: ['Folder','PDF','Spreadsheet','Image','Vector'] } },
      { dataIndex: 'size', text: 'Size (KB)', width: 110,
        editor: { xtype: 'numberfield', minValue: 0 } },
    ],
  } as any);

  viewController.initView({ grid, store, plugin, viewModel, viewController });
  return { grid, store, plugin, viewModel, viewController };
}
