import '@framesquared/layout';
import { TreeGrid, WidgetColumn, Button } from '@framesquared/ui';
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
            { id: 'carol', text: 'Carol', role: 'Engineer',      salary:  85000, leaf: true },
          ],
        },
        {
          id: 'mkt', text: 'Marketing', role: 'Division', salary: 170000, expanded: true,
          children: [
            { id: 'dave', text: 'Dave', role: 'Director', salary: 95000, leaf: true },
            { id: 'eve',  text: 'Eve',  role: 'Manager',  salary: 75000, leaf: true },
          ],
        },
      ],
    },
  });
}

export interface MainViewRefs {
  grid:           TreeGrid;
  store:          TreeStore;
  actionColumn:   WidgetColumn;
  viewModel:      MainViewModel;
  viewController: MainViewController;
}

export function createMainView(host: Element): MainViewRefs {
  const store          = makeOrgChartStore();
  const viewModel      = new MainViewModel();
  const viewController = new MainViewController(viewModel);

  const actionColumn = new WidgetColumn({
    dataIndex: 'id',
    text:      'Action',
    width:     100,
    widget:    Button,
  });

  const grid = new TreeGrid({
    renderTo: host,
    title:    'OrgChart — Widget Column',
    height:   400,
    store,
    columns: [
      { dataIndex: 'text',   text: 'Name',   flex: 1   },
      { dataIndex: 'role',   text: 'Role',   width: 150 },
      { dataIndex: 'salary', text: 'Salary', width: 100,
        renderer: (v: unknown) => v ? `$${Number(v).toLocaleString()}` : '' },
      actionColumn,
    ],
  } as any);

  viewController.initView({ grid, store, actionColumn, viewModel, viewController });
  return { grid, store, actionColumn, viewModel, viewController };
}
