import '@framesquared/layout';
import {
  TreeGrid, WidgetColumn,
  Button, CycleButton, SegmentedButton, Panel,
} from '@framesquared/ui';
import { Checkbox, Slider } from '@framesquared/form';
import { TreeStore, TreeModel } from '@framesquared/data';
import type { NodeInterface } from '@framesquared/data';
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
            { id: 'alice', text: 'Alice', role: 'Lead Engineer', salary: 110000, status: 'Active',   level: 'Lead',   contractor: false, score: 90, leaf: true },
            { id: 'bob',   text: 'Bob',   role: 'Engineer',      salary:  90000, status: 'Remote',   level: 'Senior', contractor: true,  score: 75, leaf: true },
            { id: 'carol', text: 'Carol', role: 'Engineer',      salary:  85000, status: 'Active',   level: 'Junior', contractor: false, score: 60, leaf: true },
          ],
        },
        {
          id: 'mkt', text: 'Marketing', role: 'Division', salary: 170000, expanded: true,
          children: [
            { id: 'dave', text: 'Dave', role: 'Director', salary: 95000, status: 'On Leave', level: 'Senior', contractor: true,  score: 80, leaf: true },
            { id: 'eve',  text: 'Eve',  role: 'Manager',  salary: 75000, status: 'Active',   level: 'Junior', contractor: false, score: 55, leaf: true },
          ],
        },
      ],
    },
  });
}

export interface MainViewRefs {
  grid:           TreeGrid;
  store:          TreeStore;
  statusCol:      WidgetColumn;
  levelCol:       WidgetColumn;
  editCol:        WidgetColumn;
  contractorCol:  WidgetColumn;
  scoreCol:       WidgetColumn;
  detailPanel:    Panel;
  viewModel:      MainViewModel;
  viewController: MainViewController;
}

export function createMainView(host: Element): MainViewRefs {
  const store          = makeOrgChartStore();
  const viewModel      = new MainViewModel();
  const viewController = new MainViewController(viewModel);

  let grid!:        TreeGrid;
  let detailPanel!: Panel;
  const makeRefs = (): MainViewRefs =>
    ({ grid, store, statusCol, levelCol, editCol, contractorCol, scoreCol, detailPanel, viewModel, viewController });

  // ── 1. Status — CycleButton: Active / On Leave / Remote ──────────────────
  const statusCol = new WidgetColumn({
    dataIndex: 'status',
    text:      'Status',
    width:     120,
    widget:    CycleButton,
    widgetConfig: (record: NodeInterface) => {
      const cur = String((record as any).get?.('status') ?? 'Active');
      return {
        items: [
          { text: 'Active',   checked: cur === 'Active'   },
          { text: 'On Leave', checked: cur === 'On Leave' },
          { text: 'Remote',   checked: cur === 'Remote'   },
        ],
        listeners: {
          change: (_btn: unknown, item: { text: string }) => {
            (record as any).set?.('status', item.text);
            viewController.handleStatusChange(makeRefs(), record, item.text);
          },
        },
      };
    },
  });

  // ── 2. Level — SegmentedButton: Jr / Sr / Lead ───────────────────────────
  const levelCol = new WidgetColumn({
    dataIndex: 'level',
    text:      'Level',
    width:     130,
    widget:    SegmentedButton,
    widgetConfig: (record: NodeInterface) => {
      const cur = String((record as any).get?.('level') ?? 'Junior');
      return {
        items: [
          new Button({ text: 'Jr',   value: 'Junior', pressed: cur === 'Junior' }),
          new Button({ text: 'Sr',   value: 'Senior', pressed: cur === 'Senior' }),
          new Button({ text: 'Lead', value: 'Lead',   pressed: cur === 'Lead'   }),
        ],
        allowDepress: false,
        listeners: {
          change: (_seg: unknown, value: string) => {
            (record as any).set?.('level', value);
            viewController.handleLevelChange(makeRefs(), record, value);
          },
        },
      };
    },
  });

  // ── 3. Edit — plain Button ───────────────────────────────────────────────
  const editCol = new WidgetColumn({
    dataIndex: 'id',
    text:      'Edit',
    width:     80,
    widget:    Button,
    widgetConfig: (record: NodeInterface) => ({
      text:    'Edit',
      handler: () => viewController.handleEdit(makeRefs(), record),
    }),
  });

  // ── 4. Contractor — Checkbox (boolean flag) ───────────────────────────────
  const contractorCol = new WidgetColumn({
    dataIndex: 'contractor',
    text:      'Contractor',
    width:     100,
    widget:    Checkbox,
    widgetConfig: (record: NodeInterface) => ({
      checked:  Boolean((record as any).get?.('contractor')),
      boxLabel: 'Yes',
      listeners: {
        change: (_cb: unknown, val: string) => {
          const isContractor = val !== '';
          (record as any).set?.('contractor', isContractor);
          viewController.handleContractor(makeRefs(), record, isContractor);
        },
      },
    }),
  });

  // ── 5. Score — Slider (0–100, step 5) ────────────────────────────────────
  const scoreCol = new WidgetColumn({
    dataIndex: 'score',
    text:      'Score',
    width:     130,
    widget:    Slider,
    widgetConfig: (record: NodeInterface) => ({
      value:     Number((record as any).get?.('score') ?? 50),
      minValue:  0,
      maxValue:  100,
      increment: 5,
      listeners: {
        changecomplete: (_sl: unknown, val: number) => {
          (record as any).set?.('score', val);
          viewController.handleScore(makeRefs(), record, val);
        },
      },
    }),
  });

  grid = new TreeGrid({
    renderTo: host,
    title:    'OrgChart — Widget Columns Demo',
    height:   420,
    store,
    columns: [
      { dataIndex: 'text',   text: 'Name',   flex: 1   },
      { dataIndex: 'role',   text: 'Role',   width: 140 },
      { dataIndex: 'salary', text: 'Salary', width: 100,
        renderer: (v: unknown) => v ? `$${Number(v).toLocaleString()}` : '' },
      statusCol,
      levelCol,
      editCol,
      contractorCol,
      scoreCol,
    ],
  } as any);

  detailPanel = new Panel({
    renderTo:    host,
    title:       'Last Interaction',
    bodyPadding: 8,
    html:        '<em>Interact with a widget to see the event here.</em>',
  });

  viewController.initView(makeRefs());
  return makeRefs();
}
