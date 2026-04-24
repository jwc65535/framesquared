import '@framesquared/layout';
import { TreeGrid, TreeGridGroupingSummary, TreeGridRowExpander } from '@framesquared/ui';
import { XTemplate } from '@framesquared/component';
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
          id: 'eng', text: 'Engineering', role: 'Division', salary: 285000, headcount: 3, expanded: true,
          children: [
            { id: 'alice', text: 'Alice', role: 'Lead Engineer', salary: 110000, headcount: 1,
              bio: 'Full-stack engineer with 8 years experience.', leaf: true },
            { id: 'bob',   text: 'Bob',   role: 'Engineer',      salary:  90000, headcount: 1,
              bio: 'Backend specialist, Go and TypeScript.', leaf: true },
            { id: 'carol', text: 'Carol', role: 'Engineer',      salary:  85000, headcount: 1,
              bio: 'Frontend engineer, React and framesquared.', leaf: true },
          ],
        },
        {
          id: 'mkt', text: 'Marketing', role: 'Division', salary: 170000, headcount: 2, expanded: true,
          children: [
            { id: 'dave', text: 'Dave', role: 'Director', salary: 95000, headcount: 1,
              bio: 'Demand generation and brand strategy.', leaf: true },
            { id: 'eve',  text: 'Eve',  role: 'Manager',  salary: 75000, headcount: 1,
              bio: 'Content marketing and SEO.', leaf: true },
          ],
        },
      ],
    },
  });
}

export interface MainViewRefs {
  grid:           TreeGrid;
  store:          TreeStore;
  groupSummary:   TreeGridGroupingSummary;
  rowExpander:    TreeGridRowExpander;
  viewModel:      MainViewModel;
  viewController: MainViewController;
}

export function createMainView(host: Element): MainViewRefs {
  const store        = makeOrgChartStore();
  const viewModel    = new MainViewModel();
  const groupSummary = new TreeGridGroupingSummary({
    showSummaryFor: 'nonleaf',
    summaryColumns: [
      { dataIndex: 'salary',    summaryType: 'sum',
        summaryRenderer: (v) => `$${Number(v).toLocaleString()}` },
      { dataIndex: 'headcount', summaryType: 'sum' },
    ],
  });
  const bioTpl = new XTemplate('<div class="emp-bio"><em>{bio}</em></div>');
  const rowExpander  = new TreeGridRowExpander({ rowBodyTpl: bioTpl, singleRowExpand: false });
  const viewController = new MainViewController(viewModel);

  const grid = new TreeGrid({
    renderTo: host,
    title:    'OrgChart — Grouping Summary & Row Expander',
    height:   480,
    store,
    plugins:  [groupSummary, rowExpander],
    columns: [
      { dataIndex: 'text',      text: 'Name',      flex: 1   },
      { dataIndex: 'role',      text: 'Role',      width: 150 },
      { dataIndex: 'salary',    text: 'Salary',    width: 110,
        renderer: (v: unknown) => v ? `$${Number(v).toLocaleString()}` : '' },
      { dataIndex: 'headcount', text: 'Headcount', width: 100 },
    ],
  } as any);

  viewController.initView({ grid, store, groupSummary, rowExpander, viewModel, viewController });
  groupSummary.renderGroupSummaries();

  return { grid, store, groupSummary, rowExpander, viewModel, viewController };
}
