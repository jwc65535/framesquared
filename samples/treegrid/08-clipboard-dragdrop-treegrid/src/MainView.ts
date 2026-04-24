import '@framesquared/layout';
import { TreeGrid, TreeGridClipboard, TreeGridDragDrop } from '@framesquared/ui';
import { TreeStore, TreeModel } from '@framesquared/data';
import { MainViewModel } from './MainViewModel.js';
import { MainViewController } from './MainViewController.js';

export function makeTaskStore(): TreeStore {
  return new TreeStore({
    model: TreeModel,
    root: {
      id: 'root', text: 'Projects', expanded: true,
      children: [
        {
          id: 'webapp', text: 'Web App', status: 'Active', priority: 'High', expanded: true,
          children: [
            { id: 'task1', text: 'Setup repo',  status: 'Done',        priority: 'High',   leaf: true },
            { id: 'task2', text: 'Design UI',   status: 'In Progress', priority: 'Medium', leaf: true },
            { id: 'task3', text: 'Write tests', status: 'Todo',        priority: 'High',   leaf: true },
          ],
        },
        {
          id: 'mobile', text: 'Mobile App', status: 'Active', priority: 'Medium', expanded: true,
          children: [
            { id: 'task4', text: 'Prototype', status: 'Done', priority: 'High', leaf: true },
            { id: 'task5', text: 'Review',    status: 'Todo', priority: 'Low',  leaf: true },
          ],
        },
      ],
    },
  });
}

export interface MainViewRefs {
  grid:           TreeGrid;
  store:          TreeStore;
  clipboard:      TreeGridClipboard;
  dragDrop:       TreeGridDragDrop;
  viewModel:      MainViewModel;
  viewController: MainViewController;
}

export function createMainView(host: Element): MainViewRefs {
  const store          = makeTaskStore();
  const viewModel      = new MainViewModel();
  const clipboard      = new TreeGridClipboard({ copyHierarchy: false });
  const dragDrop       = new TreeGridDragDrop({ enableDrag: true, enableDrop: true, sortOnDrop: true });
  const viewController = new MainViewController(viewModel);

  const grid = new TreeGrid({
    renderTo: host,
    title:    'Task Manager — Clipboard & Drag-Drop',
    height:   400,
    store,
    plugins:  [clipboard, dragDrop],
    columns: [
      { dataIndex: 'text',     text: 'Task',     flex: 1   },
      { dataIndex: 'status',   text: 'Status',   width: 130 },
      { dataIndex: 'priority', text: 'Priority', width: 100 },
    ],
  } as any);

  viewController.initView({ grid, store, clipboard, dragDrop, viewModel, viewController });
  return { grid, store, clipboard, dragDrop, viewModel, viewController };
}
