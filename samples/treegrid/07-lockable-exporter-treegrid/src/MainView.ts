import '@framesquared/layout';
import { TreeGrid, TreeGridLockable, TreeGridExporter, TreeGridColumn, Button, Column } from '@framesquared/ui';
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
          id: 'electronics', text: 'Electronics', category: 'Category',
          price: 0, stock: 0, sku: '', rating: '', country: '', brand: '', warranty: 0,
          expanded: true,
          children: [
            { id: 'laptop',  text: 'Laptop Pro',  category: 'Laptop',  price: 1299, stock: 45,
              sku: 'LP-2024', rating: '4.8 ★', country: 'USA',     brand: 'Apex',    warranty: 24, leaf: true },
            { id: 'tablet',  text: 'Tablet X',    category: 'Tablet',  price: 599,  stock: 120,
              sku: 'TX-500',  rating: '4.5 ★', country: 'China',   brand: 'Apex',    warranty: 12, leaf: true },
            { id: 'phone',   text: 'Phone Z',     category: 'Phone',   price: 899,  stock: 75,
              sku: 'PZ-900',  rating: '4.2 ★', country: 'Korea',   brand: 'ZenTech', warranty: 12, leaf: true },
          ],
        },
        {
          id: 'accessories', text: 'Accessories', category: 'Category',
          price: 0, stock: 0, sku: '', rating: '', country: '', brand: '', warranty: 0,
          expanded: true,
          children: [
            { id: 'case',    text: 'Carry Case',  category: 'Case',    price: 49,  stock: 300,
              sku: 'CC-104',  rating: '4.0 ★', country: 'China',   brand: 'PackPro', warranty: 6,  leaf: true },
            { id: 'charger', text: 'USB Charger', category: 'Charger', price: 29,  stock: 500,
              sku: 'UC-205',  rating: '3.9 ★', country: 'Japan',   brand: 'VoltUp',  warranty: 6,  leaf: true },
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

  csvBtn  = new Button({ text: 'Export CSV',  handler: () => {
    const data = viewController.exportCsv(makeRefs());
    TreeGridExporter.download(data, 'products.csv', 'text/csv');
  }});
  tsvBtn  = new Button({ text: 'Export TSV',  handler: () => {
    const data = viewController.exportTsv(makeRefs());
    TreeGridExporter.download(data, 'products.tsv', 'text/tab-separated-values');
  }});
  jsonBtn = new Button({ text: 'Export JSON', handler: () => {
    const data = viewController.exportJson(makeRefs());
    TreeGridExporter.download(data, 'products.json', 'application/json');
  }});

  // Explicit TreeGridColumn for the locked (frozen) left panel.
  // Must have an explicit width so TreeGridLockable can size the locked panel correctly
  // (flex columns default to width=100 which is too narrow for tree chrome + text).
  const nameCol     = new TreeGridColumn({ dataIndex: 'text',     text: 'Name',        width: 220 });

  // Explicit Column instances for the scrollable right panel.
  // Each must be a Column instance (not a config object) so TreeGridLockable
  // recognises them as user-defined rather than auto-created.
  const categoryCol = new Column({ dataIndex: 'category', text: 'Category',    width: 130 });
  const skuCol      = new Column({ dataIndex: 'sku',      text: 'SKU',         width: 120 });
  const priceCol    = new Column({ dataIndex: 'price',    text: 'Price',       width: 110,
    renderer: (v: unknown) => v ? `$${Number(v).toLocaleString()}` : '' });
  const ratingCol   = new Column({ dataIndex: 'rating',   text: 'Rating',      width: 100 });
  const stockCol    = new Column({ dataIndex: 'stock',    text: 'Stock',       width: 100 });
  const countryCol  = new Column({ dataIndex: 'country',  text: 'Country',     width: 130 });
  const brandCol    = new Column({ dataIndex: 'brand',    text: 'Brand',       width: 130 });
  const warrantyCol = new Column({ dataIndex: 'warranty', text: 'Warranty (mo)', width: 130 });

  grid = new TreeGrid({
    renderTo: host,
    title:    'Product Catalog — Lockable & Exporter',
    height:   400,
    store,
    plugins:  [lockable],
    tbar:     [csvBtn, tsvBtn, jsonBtn],
    columns:  [nameCol, categoryCol, skuCol, priceCol, ratingCol, stockCol, countryCol, brandCol, warrantyCol],
  } as any);

  viewController.initView(makeRefs());
  return makeRefs();
}
