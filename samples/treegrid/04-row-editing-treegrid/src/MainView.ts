import '@framesquared/layout';
import { TreeGrid, TreeGridRowEditing } from '@framesquared/ui';
import { TreeStore, TreeModel } from '@framesquared/data';
import { MainViewModel } from './MainViewModel.js';
import { MainViewController } from './MainViewController.js';

export function makeOrgChartStore(): TreeStore {
  return new TreeStore({
    model: TreeModel,
    root: {
      id: 'root', text: 'Acme Corp', expanded: true,
      children: [
        {
          id: 'eng', text: 'Engineering', role: 'Division', salary: 285000, expanded: true,
          children: [
            { id: 'alice', text: 'Alice', role: 'Lead Engineer', salary: 110000, leaf: true },
            { id: 'bob',   text: 'Bob',   role: 'Engineer',      salary:  90000, leaf: true },
          ],
        },
        {
          id: 'mkt', text: 'Marketing', role: 'Division', salary: 170000,
          children: [
            { id: 'dave', text: 'Dave', role: 'Director', salary: 95000, leaf: true },
          ],
        },
      ],
    },
  });
}

export interface MainViewRefs {
  grid:           TreeGrid;
  store:          TreeStore;
  plugin:         TreeGridRowEditing;
  viewModel:      MainViewModel;
  viewController: MainViewController;
}

export function createMainView(host: Element): MainViewRefs {
  const store          = makeOrgChartStore();
  const viewModel      = new MainViewModel();
  const plugin         = new TreeGridRowEditing({ clicksToEdit: 2, saveBtnText: 'Save', cancelBtnText: 'Cancel' });
  const viewController = new MainViewController(viewModel);

  const grid = new TreeGrid({
    renderTo: host,
    title:    'OrgChart — Row Editing',
    height:   400,
    store,
    plugins:  [plugin],
    columns: [
      { dataIndex: 'text',   text: 'Name',   flex: 1,   editor: { xtype: 'textfield' } },
      { dataIndex: 'role',   text: 'Role',   width: 150, editor: { xtype: 'textfield' } },
      { dataIndex: 'salary', text: 'Salary', width: 100, editor: { xtype: 'numberfield', minValue: 0 } },
    ],
  } as any);

  viewController.initView({ grid, store, plugin, viewModel, viewController });
  return { grid, store, plugin, viewModel, viewController };
}
