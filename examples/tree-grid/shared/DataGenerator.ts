/**
 * DataGenerator — Generates realistic sample datasets for TreeGrid examples.
 * All methods return arrays of plain objects suitable for TreeStore.
 */

export interface TreeNodeData {
  id: string;
  text: string;
  leaf?: boolean;
  expanded?: boolean;
  children?: TreeNodeData[];
  [key: string]: unknown;
}

export class DataGenerator {
  // File system names by category
  private static readonly DOCS = ['Q3-Report.pdf', 'Q4-Report.pdf', 'Meeting Notes.docx',
    'Budget-2025.xlsx', 'Presentation.pptx', 'Architecture-Overview.pdf',
    'User-Manual.docx', 'Release-Notes.md', 'API-Reference.pdf', 'Project-Brief.docx'];
  private static readonly IMAGES = ['vacation-beach.jpg', 'screenshot-2025.png', 'profile-photo.heic',
    'team-photo.jpg', 'product-mockup.png', 'logo-design.ai', 'banner-2025.png', 'headshot.jpg'];
  private static readonly MUSIC = ['favorite-track.mp3', 'podcast-ep42.m4a', 'album-track-01.flac',
    'morning-mix.mp3', 'work-playlist.m4a', 'classical-suite.flac'];
  private static readonly CODE = ['index.ts', 'package.json', 'tsconfig.json', 'README.md',
    '.gitignore', 'vite.config.ts', 'App.tsx', 'main.ts', 'styles.css', 'utils.ts'];
  private static readonly FOLDERS = ['Documents', 'Pictures', 'Music', 'Downloads', 'Projects',
    'Desktop', 'Work', 'Personal', 'Archive', 'Backups', 'Reports', 'Invoices'];
  private static readonly OWNERS = ['alice', 'bob', 'carol', 'dave', 'eve', 'frank', 'root'];

  private static fileSize(type: string): number {
    if (type === 'folder') return 0;
    if (type === 'image') return Math.floor(Math.random() * 30000000) + 500000;
    if (type === 'audio') return Math.floor(Math.random() * 50000000) + 3000000;
    if (type === 'code') return Math.floor(Math.random() * 50000) + 100;
    return Math.floor(Math.random() * 5000000) + 10000;
  }

  private static mimeFromExt(ext: string): string {
    const map: Record<string, string> = {
      pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', pptx: 'application/vnd.ms-powerpoint',
      md: 'text/markdown', jpg: 'image/jpeg', png: 'image/png', heic: 'image/heic',
      mp3: 'audio/mpeg', m4a: 'audio/mp4', flac: 'audio/flac', ts: 'text/typescript',
      tsx: 'text/typescript', js: 'text/javascript', css: 'text/css', json: 'application/json',
      ai: 'application/postscript', zip: 'application/zip', dmg: 'application/x-apple-diskimage',
    };
    return map[ext.toLowerCase()] ?? 'application/octet-stream';
  }

  private static recentDate(daysBack = 365): Date {
    return new Date(Date.now() - Math.random() * daysBack * 86400000);
  }

  static fileSystem(options: { depth?: number; breadth?: number; totalNodes?: number; includeHidden?: boolean } = {}): TreeNodeData[] {
    const { depth = 4, breadth = 5, includeHidden = false } = options;
    let idSeq = 1;

    const makeFile = (name: string, type: string): TreeNodeData => {
      const ext = name.includes('.') ? name.split('.').pop()! : '';
      const size = DataGenerator.fileSize(type);
      const modified = DataGenerator.recentDate(180);
      return {
        id: `f${idSeq++}`, text: name, leaf: true,
        size, modified: modified.toISOString(), ext,
        type, mimeType: DataGenerator.mimeFromExt(ext),
        owner: DataGenerator.OWNERS[Math.floor(Math.random() * DataGenerator.OWNERS.length)],
        permissions: ['rwxr-xr-x', 'rw-r--r--', 'rwxrwxr-x'][Math.floor(Math.random() * 3)],
        isHidden: includeHidden && Math.random() < 0.1,
      };
    };

    const makeFolder = (name: string, children: TreeNodeData[]): TreeNodeData => ({
      id: `d${idSeq++}`, text: name, leaf: false, expanded: false,
      size: 0, modified: DataGenerator.recentDate(365).toISOString(),
      type: 'folder', mimeType: '', owner: 'root', permissions: 'rwxr-xr-x',
      isHidden: includeHidden && name.startsWith('.'),
      children,
    });

    const buildLevel = (names: string[][], level: number): TreeNodeData[] => {
      if (level >= depth) return [];
      return names.slice(0, breadth).map(([name, type]) =>
        type === 'folder'
          ? makeFolder(name, buildLevel([
              ...DataGenerator.FOLDERS.slice(0, 2).map(f => [f, 'folder'] as [string, string]),
              ...DataGenerator.DOCS.slice(0, 3).map(f => [f, 'document'] as [string, string]),
            ], level + 1))
          : makeFile(name, type as string)
      );
    };

    return [
      makeFolder('Documents', [
        makeFolder('Work', [
          makeFile('Q3-Report.pdf', 'document'), makeFile('Budget-2025.xlsx', 'document'), makeFile('Meeting-Notes.docx', 'document'),
        ]),
        makeFolder('Personal', [
          makeFile('Resume.pdf', 'document'), makeFile('Notes.txt', 'document'),
        ]),
        makeFolder('Archive', [
          makeFile('Old-Report.pdf', 'document'), makeFile('2024-Taxes.pdf', 'document'),
        ]),
      ]),
      makeFolder('Pictures', [
        makeFolder('Vacation 2024', [
          makeFile('beach-morning.jpg', 'image'), makeFile('sunset-panorama.jpg', 'image'), makeFile('group-photo.jpg', 'image'),
        ]),
        makeFolder('Screenshots', [
          makeFile('screenshot-2025-01-15.png', 'image'), makeFile('screenshot-2025-03-01.png', 'image'),
        ]),
        makeFile('profile-photo.heic', 'image'),
      ]),
      makeFolder('Music', [
        makeFolder('Playlists', [
          makeFile('morning-focus.mp3', 'audio'), makeFile('coding-vibes.m4a', 'audio'),
        ]),
        makeFile('favorite-track.flac', 'audio'),
      ]),
      makeFolder('Projects', [
        makeFolder('framesquared', [
          makeFile('index.ts', 'code'), makeFile('package.json', 'code'), makeFile('README.md', 'code'), makeFile('tsconfig.json', 'code'),
        ]),
        makeFolder('website-redesign', [
          makeFile('App.tsx', 'code'), makeFile('styles.css', 'code'), makeFile('index.html', 'code'),
        ]),
      ]),
      makeFolder('Downloads', [
        makeFile('app-installer.dmg', 'archive'), makeFile('backup-2025.zip', 'archive'), makeFile('font-pack.zip', 'archive'),
      ]),
    ];
  }

  static projectPlan(options: { phases?: number; tasksPerPhase?: number; subtaskDepth?: number } = {}): TreeNodeData[] {
    const { phases = 4, tasksPerPhase = 6 } = options;
    let idSeq = 1;

    const ASSIGNEES = ['Alice Chen', 'Bob Martinez', 'Carol Johnson', 'David Kim', 'Emma Wilson',
      'Frank Patel', 'Grace Lee', 'Henry Brown', 'Iris Nakamura', 'James O\'Brien',
      'Kira Okonkwo', 'Liam Thompson', 'Maya Singh', 'Noah Garcia', 'Olivia Zhang'];
    const STATUSES = ['Not Started', 'In Progress', 'Completed', 'Blocked', 'Review'];
    const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
    const TAGS = [['frontend'], ['backend'], ['design'], ['devops'], ['testing'], ['frontend', 'backend'], ['design', 'frontend']];

    const statusWeights = [0.20, 0.25, 0.30, 0.10, 0.15]; // weights for each status
    const pickStatus = () => {
      const r = Math.random();
      let acc = 0;
      for (let i = 0; i < STATUSES.length; i++) {
        acc += statusWeights[i];
        if (r < acc) return STATUSES[i];
      }
      return STATUSES[2];
    };

    const baseDate = new Date('2025-01-01');
    const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
    const fmt = (d: Date) => d.toISOString().split('T')[0];

    const PHASE_NAMES = ['Phase 1: Planning & Discovery', 'Phase 2: Design & Architecture', 'Phase 3: Implementation', 'Phase 4: Testing & Launch'];
    const TASK_SETS: string[][] = [
      ['Define Requirements', 'Interview Stakeholders', 'Document User Stories', 'Create Project Charter', 'Risk Assessment', 'Resource Planning'],
      ['System Architecture', 'Database Schema Design', 'Create Wireframes', 'UI Component Library', 'API Contract Definition', 'Security Architecture'],
      ['Set Up CI/CD', 'Frontend Development', 'Backend API', 'Database Implementation', 'Integration Layer', 'Mobile Responsive Design'],
      ['Unit Test Suite', 'Integration Testing', 'Performance Testing', 'Security Audit', 'UAT', 'Production Deployment'],
    ];

    let dayOffset = 0;

    return Array.from({ length: Math.min(phases, 4) }, (_, pi) => {
      const phaseStart = addDays(baseDate, dayOffset);
      const tasksInPhase = Math.min(tasksPerPhase, TASK_SETS[pi]?.length ?? tasksPerPhase);
      let phaseEstHours = 0;
      let phaseActHours = 0;
      let phasePct = 0;

      const tasks = Array.from({ length: tasksInPhase }, (_, ti) => {
        const taskName = TASK_SETS[pi]?.[ti] ?? `Task ${ti + 1}`;
        const status = pickStatus();
        const est = Math.floor(Math.random() * 40) + 8;
        const pct = status === 'Completed' ? 100 : status === 'Not Started' ? 0 : Math.floor(Math.random() * 80) + 10;
        const act = status === 'Not Started' ? 0 : Math.floor(est * (pct / 100) * (0.8 + Math.random() * 0.5));
        const taskStart = addDays(phaseStart, ti * 5);
        const taskEnd = addDays(taskStart, 10 + Math.floor(Math.random() * 10));
        const priority = PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)];
        const subtasks = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, si) => ({
          id: `t${idSeq++}`, text: `${taskName} — Step ${si + 1}`, leaf: true,
          assignee: ASSIGNEES[Math.floor(Math.random() * ASSIGNEES.length)],
          status: pickStatus(),
          priority: PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)],
          estimatedHours: Math.floor(est / 3),
          actualHours: Math.floor(act / 3),
          percentComplete: pct,
          startDate: fmt(addDays(taskStart, si * 2)),
          endDate: fmt(addDays(taskStart, si * 2 + 5)),
          notes: `Subtask details for step ${si + 1} of ${taskName}.`,
          tags: TAGS[Math.floor(Math.random() * TAGS.length)],
          dependencies: [],
        }));

        phaseEstHours += est;
        phaseActHours += act;
        phasePct += pct;

        return {
          id: `t${idSeq++}`, text: taskName, leaf: false, expanded: false,
          assignee: ASSIGNEES[Math.floor(Math.random() * ASSIGNEES.length)],
          status, priority,
          estimatedHours: est, actualHours: act, percentComplete: pct,
          startDate: fmt(taskStart), endDate: fmt(taskEnd),
          notes: `Implementation notes for ${taskName}. This task covers the core work needed.`,
          tags: TAGS[Math.floor(Math.random() * TAGS.length)],
          dependencies: ti > 0 ? [`t${idSeq - 2}`] : [],
          children: subtasks,
        };
      });

      dayOffset += 45;
      return {
        id: `p${idSeq++}`, text: PHASE_NAMES[pi] ?? `Phase ${pi + 1}`, leaf: false, expanded: pi === 0,
        estimatedHours: phaseEstHours, actualHours: phaseActHours,
        percentComplete: Math.floor(phasePct / tasksInPhase),
        startDate: fmt(phaseStart), endDate: fmt(addDays(phaseStart, 40)),
        children: tasks,
      };
    });
  }

  static organization(options: { departments?: number; teamsPerDept?: number; membersPerTeam?: number } = {}): TreeNodeData[] {
    const { departments = 6, teamsPerDept = 3, membersPerTeam = 5 } = options;
    let idSeq = 1;

    const DEPTS = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'Operations'];
    const TEAM_NAMES: Record<string, string[]> = {
      Engineering: ['Frontend Team', 'Backend Team', 'Mobile Team', 'Infrastructure', 'Security'],
      Product: ['Product Strategy', 'Growth Product', 'Platform Product'],
      Design: ['UX Research', 'Visual Design', 'Design Systems'],
      Marketing: ['Content Marketing', 'Performance Marketing', 'Brand'],
      Sales: ['Enterprise Sales', 'SMB Sales', 'Sales Operations'],
      Operations: ['HR', 'Finance', 'Legal', 'IT Operations'],
    };
    const TITLES_BY_DEPT: Record<string, string[]> = {
      Engineering: ['Software Engineer', 'Senior Engineer', 'Staff Engineer', 'Engineering Manager', 'Principal Engineer'],
      Product: ['Product Manager', 'Senior PM', 'Director of Product', 'VP of Product'],
      Design: ['UX Designer', 'Senior Designer', 'Design Lead', 'Head of Design'],
      Marketing: ['Marketing Manager', 'Content Strategist', 'Growth Manager', 'CMO'],
      Sales: ['Account Executive', 'Sales Manager', 'VP of Sales', 'SDR'],
      Operations: ['Operations Manager', 'HR Business Partner', 'Finance Analyst', 'Legal Counsel'],
    };
    const FIRST = ['Alice', 'Bob', 'Carol', 'David', 'Emma', 'Frank', 'Grace', 'Henry', 'Iris', 'James',
      'Kira', 'Liam', 'Maya', 'Noah', 'Olivia', 'Paulo', 'Quinn', 'Raj', 'Sara', 'Tom',
      'Uma', 'Victor', 'Wendy', 'Xavier', 'Yuki', 'Zara'];
    const LAST = ['Chen', 'Martinez', 'Johnson', 'Kim', 'Wilson', 'Patel', 'Lee', 'Brown', 'Nakamura',
      "O'Brien", 'Okonkwo', 'Thompson', 'Singh', 'Garcia', 'Zhang', 'Andersen', 'Ferreira',
      'Müller', 'Kowalski', 'Dubois', 'Tanaka', 'Petrov', 'Osei', 'Hoffman'];
    const LOCATIONS = ['San Francisco', 'San Francisco', 'San Francisco', 'London', 'London', 'Tokyo', 'Remote', 'Remote'];
    const SKILLS_BY_DEPT: Record<string, string[]> = {
      Engineering: ['TypeScript', 'React', 'Node.js', 'Python', 'Go', 'Rust', 'PostgreSQL', 'Redis', 'Kubernetes'],
      Product: ['Strategy', 'Roadmapping', 'OKRs', 'User Research', 'A/B Testing', 'Figma'],
      Design: ['Figma', 'UX Research', 'Prototyping', 'CSS', 'Illustration', 'Accessibility'],
      Marketing: ['SEO', 'Content Strategy', 'Analytics', 'Email Marketing', 'Social Media', 'Copywriting'],
      Sales: ['CRM', 'Negotiation', 'Pipeline Management', 'Cold Outreach', 'Enterprise Sales'],
      Operations: ['Process Improvement', 'Project Management', 'Compliance', 'Financial Modeling'],
    };

    const namePicker = (() => {
      let fi = 0, li = 0;
      return () => {
        const name = `${FIRST[fi % FIRST.length]} ${LAST[li % LAST.length]}`;
        fi++; li += 3;
        return name;
      };
    })();

    const hireDateBase = new Date('2018-01-01');
    const deptNodes = Array.from({ length: Math.min(departments, DEPTS.length) }, (_, di) => {
      const deptName = DEPTS[di];
      const titles = TITLES_BY_DEPT[deptName] ?? ['Manager', 'Specialist'];
      const skills = SKILLS_BY_DEPT[deptName] ?? [];
      const teams = (TEAM_NAMES[deptName] ?? [`${deptName} Team`]).slice(0, teamsPerDept).map(teamName => {
        const members = Array.from({ length: membersPerTeam }, (_, mi) => {
          const fullName = namePicker();
          const email = `${fullName.toLowerCase().replace(/[^a-z]/g, '.')}@acme.com`;
          const title = titles[Math.floor(Math.random() * titles.length)];
          const isManager = mi === 0;
          const hireDate = new Date(hireDateBase.getTime() + Math.random() * 5 * 365 * 86400000);
          const salaryBase = isManager ? 140000 : 90000;
          const salary = salaryBase + Math.floor(Math.random() * 60000);
          const numSkills = 3 + Math.floor(Math.random() * 4);
          const personSkills = [...skills].sort(() => Math.random() - 0.5).slice(0, numSkills);
          return {
            id: `e${idSeq++}`, text: fullName, leaf: true,
            name: fullName, title, email, phone: `+1-555-${String(1000 + idSeq).slice(-4)}`,
            department: deptName, team: teamName,
            location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
            hireDate: hireDate.toISOString().split('T')[0],
            salary, isManager, skills: personSkills,
            performanceRating: 1 + Math.floor(Math.random() * 5),
          };
        });
        return { id: `team${idSeq++}`, text: teamName, leaf: false, expanded: false, department: deptName, children: members };
      });
      return { id: `dept${idSeq++}`, text: deptName, leaf: false, expanded: di === 0, department: deptName, children: teams };
    });

    return deptNodes;
  }

  static categoryTree(options: { categories?: number; subcategories?: number; items?: number } = {}): TreeNodeData[] {
    const { categories = 4, subcategories = 3, items = 5 } = options;
    let idSeq = 1;
    const CATS = [
      { name: 'Electronics', subs: ['Computers', 'Phones', 'Audio', 'Cameras', 'Gaming'] },
      { name: 'Clothing', subs: ["Men's", "Women's", "Kids'", 'Accessories', 'Shoes'] },
      { name: 'Home & Garden', subs: ['Furniture', 'Kitchen', 'Bedding', 'Tools', 'Plants'] },
      { name: 'Sports', subs: ['Fitness', 'Outdoor', 'Team Sports', 'Water Sports'] },
    ];
    const ITEMS_BY_CAT: Record<string, string[]> = {
      Computers: ['MacBook Pro 14"', 'ThinkPad X1 Carbon', 'Dell XPS 15', 'Surface Laptop 5', 'ASUS ZenBook'],
      Phones: ['iPhone 16 Pro', 'Samsung Galaxy S25', 'Google Pixel 9', 'OnePlus 13', 'Sony Xperia 1 VI'],
      "Men's": ['Oxford Shirt', 'Slim Chinos', 'Leather Oxford Shoes', 'Wool Blazer', 'Denim Jeans'],
      Fitness: ['Adjustable Dumbbells', 'Resistance Bands', 'Yoga Mat', 'Pull-up Bar', 'Jump Rope'],
    };
    return CATS.slice(0, categories).map(cat => ({
      id: `cat${idSeq++}`, text: cat.name, leaf: false, expanded: false,
      children: cat.subs.slice(0, subcategories).map(sub => ({
        id: `sub${idSeq++}`, text: sub, leaf: false, expanded: false,
        children: (ITEMS_BY_CAT[sub] ?? Array.from({ length: items }, (_, i) => `${sub} Item ${i + 1}`))
          .slice(0, items).map(itemName => ({
            id: `item${idSeq++}`, text: itemName, leaf: true,
            sku: `SKU-${String(10000 + idSeq).slice(-5)}`,
            price: (9.99 + Math.random() * 990).toFixed(2),
            stock: Math.floor(Math.random() * 500),
            rating: (3 + Math.random() * 2).toFixed(1),
            reviewCount: Math.floor(Math.random() * 5000),
          })),
      })),
    }));
  }

  static largeDataset(totalNodes: number, maxDepth = 6, maxChildren = 15): TreeNodeData[] {
    let idSeq = 0;
    const baseDate = Date.now() - 365 * 86400000;

    const buildNodes = (depth: number, remaining: { count: number }): TreeNodeData[] => {
      if (depth >= maxDepth || remaining.count <= 0) return [];
      const childCount = Math.min(Math.floor(Math.random() * maxChildren) + 1, remaining.count);
      const nodes: TreeNodeData[] = [];
      for (let i = 0; i < childCount; i++) {
        if (remaining.count <= 0) break;
        const id = ++idSeq;
        remaining.count--;
        const isLeaf = depth >= maxDepth - 1 || remaining.count <= 0 || Math.random() < 0.4;
        const node: TreeNodeData = {
          id: `n${id}`, text: `Node ${id}`,
          leaf: isLeaf,
          value: Math.floor(Math.random() * 1000),
          score: Math.floor(Math.random() * 100),
          active: Math.random() > 0.3,
          created: new Date(baseDate + Math.random() * 365 * 86400000).toISOString().split('T')[0],
        };
        if (!isLeaf) {
          node.expanded = false;
          node.children = buildNodes(depth + 1, remaining);
        }
        nodes.push(node);
      }
      return nodes;
    };

    return buildNodes(0, { count: totalNodes });
  }
}
