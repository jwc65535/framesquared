import '@framesquared/layout';
import { TreeGrid, TreeGridLockable, Button, Column } from '@framesquared/ui';
import { TreeStore, TreeModel } from '@framesquared/data';
import { MainViewModel } from './MainViewModel.js';
import { MainViewController } from './MainViewController.js';

export function makeProductStore(): TreeStore {
  return new TreeStore({
    model: TreeModel,
    root: {
      id: 'root', text: 'Catalog', expanded: true,
      children: [
        {
          id: 'electronics', text: 'Electronics', category: 'Category', price: 0, stock: 0, expanded: true,
          children: [
            { id: 'laptop',  text: 'Laptop Pro', category: 'Laptop',  price: 1299, stock: 45,  leaf: true },
            { id: 'tablet',  text: 'Tablet X',   category: 'Tablet',  price: 599,  stock: 120, leaf: true },
            { id: 'phone',   text: 'Phone Z',    category: 'Phone',   price: 899,  stock: 75,  leaf: true },
          ],
        },
        {
          id: 'accessories', text: 'Accessories', category: 'Category', price: 0, stock: 0, expanded: true,
          children: [
            { id: 'case',    text: 'Carry Case',  category: 'Case',    price: 49,  stock: 300, leaf: true },
            { id: 'charger', text: 'USB Charger', category: 'Charger', price: 29,  stock: 500, leaf: true },
          ],
        },
      ],
    },
  });
}

export interface MainViewRefs {
  grid:           TreeGrid;
  store:          TreeStore;
  lockable:       TreeGridLockable;
  csvBtn:         Button;
  tsvBtn:         Button;
  jsonBtn:        Button;
  viewModel:      MainViewModel;
  viewController: MainViewController;
}

export function createMainView(host: Element): MainViewRefs {
  const store          = makeProductStore();
  const viewModel      = new MainViewModel();
  const lockable       = new TreeGridLockable();
  const viewController = new MainViewController(viewModel);

  let grid!:    TreeGrid;
  let csvBtn!:  Button;
  let tsvBtn!:  Button;
  let jsonBtn!: Button;
  const makeRefs = (): MainViewRefs =>
    ({ grid, store, lockable, csvBtn, tsvBtn, jsonBtn, viewModel, viewController });

  csvBtn  = new Button({ text: 'Export CSV',  handler: () => viewController.exportCsv(makeRefs()) });
  tsvBtn  = new Button({ text: 'Export TSV',  handler: () => viewController.exportTsv(makeRefs()) });
  jsonBtn = new Button({ text: 'Export JSON', handler: () => viewController.exportJson(makeRefs()) });

  // Explicit Column instances so TreeGridLockable recognises them as user-defined
  // (config-object columns get _autoCreated=true and are skipped by the plugin).
  const categoryCol = new Column({ dataIndex: 'category', text: 'Category', width: 120 });
  const priceCol    = new Column({ dataIndex: 'price',    text: 'Price',    width: 90,
    renderer: (v: unknown) => v ? `$${Number(v).toLocaleString()}` : '' } as any);
  const stockCol    = new Column({ dataIndex: 'stock',    text: 'Stock',    width: 80 });

  grid = new TreeGrid({
    renderTo: host,
    title:    'Product Catalog — Lockable & Exporter',
    height:   400,
    store,
    plugins:  [lockable],
    tbar:     [csvBtn, tsvBtn, jsonBtn],
    columns: [
      { dataIndex: 'text', text: 'Name', flex: 1 },
      categoryCol,
      priceCol,
      stockCol,
    ],
  } as any);

  viewController.initView(makeRefs());
  return makeRefs();
}
