/**
 * SampleData — Pre-generated static datasets for TreeGrid examples.
 * Uses realistic data — no placeholder text.
 */

import type { TreeNodeData } from './DataGenerator.js';

export const smallFileSystem: TreeNodeData[] = [
  { id: 'docs', text: 'Documents', leaf: false, expanded: true, type: 'folder', size: 0, modified: '2025-03-01', children: [
    { id: 'work', text: 'Work', leaf: false, expanded: false, type: 'folder', size: 0, modified: '2025-03-10', children: [
      { id: 'f1', text: 'Q3-Report.pdf', leaf: true, type: 'document', size: 245760, modified: '2025-03-01', ext: 'pdf', owner: 'alice', permissions: 'rw-r--r--' },
      { id: 'f2', text: 'Meeting-Notes.docx', leaf: true, type: 'document', size: 32768, modified: '2025-03-10', ext: 'docx', owner: 'alice', permissions: 'rw-r--r--' },
      { id: 'f3', text: 'Budget-2025.xlsx', leaf: true, type: 'document', size: 98304, modified: '2025-02-28', ext: 'xlsx', owner: 'bob', permissions: 'rw-r--r--' },
    ]},
    { id: 'personal', text: 'Personal', leaf: false, expanded: false, type: 'folder', size: 0, modified: '2025-02-15', children: [
      { id: 'f4', text: 'Resume.pdf', leaf: true, type: 'document', size: 184320, modified: '2025-02-15', ext: 'pdf', owner: 'alice', permissions: 'rw-------' },
      { id: 'f5', text: 'Notes.txt', leaf: true, type: 'document', size: 4096, modified: '2025-03-20', ext: 'txt', owner: 'alice', permissions: 'rw-r--r--' },
    ]},
  ]},
  { id: 'pics', text: 'Pictures', leaf: false, expanded: false, type: 'folder', size: 0, modified: '2025-03-15', children: [
    { id: 'vacation', text: 'Vacation 2024', leaf: false, expanded: false, type: 'folder', size: 0, modified: '2025-01-20', children: [
      { id: 'f6', text: 'beach-morning.jpg', leaf: true, type: 'image', size: 4194304, modified: '2024-07-15', ext: 'jpg', owner: 'alice', permissions: 'rw-r--r--' },
      { id: 'f7', text: 'sunset-panorama.jpg', leaf: true, type: 'image', size: 6291456, modified: '2024-07-16', ext: 'jpg', owner: 'alice', permissions: 'rw-r--r--' },
    ]},
    { id: 'f8', text: 'profile-photo.heic', leaf: true, type: 'image', size: 2097152, modified: '2025-01-05', ext: 'heic', owner: 'alice', permissions: 'rw-r--r--' },
  ]},
  { id: 'music', text: 'Music', leaf: false, expanded: false, type: 'folder', size: 0, modified: '2025-02-01', children: [
    { id: 'f9', text: 'morning-focus.flac', leaf: true, type: 'audio', size: 52428800, modified: '2025-01-10', ext: 'flac', owner: 'alice', permissions: 'rw-r--r--' },
    { id: 'f10', text: 'coding-vibes.mp3', leaf: true, type: 'audio', size: 8388608, modified: '2025-01-20', ext: 'mp3', owner: 'alice', permissions: 'rw-r--r--' },
  ]},
  { id: 'projects', text: 'Projects', leaf: false, expanded: false, type: 'folder', size: 0, modified: '2025-03-25', children: [
    { id: 'framesquared', text: 'framesquared', leaf: false, expanded: false, type: 'folder', size: 0, modified: '2025-03-25', children: [
      { id: 'f11', text: 'index.ts', leaf: true, type: 'code', size: 2048, modified: '2025-03-25', ext: 'ts', owner: 'alice', permissions: 'rw-r--r--' },
      { id: 'f12', text: 'package.json', leaf: true, type: 'code', size: 1024, modified: '2025-03-24', ext: 'json', owner: 'alice', permissions: 'rw-r--r--' },
      { id: 'f13', text: 'README.md', leaf: true, type: 'code', size: 8192, modified: '2025-03-20', ext: 'md', owner: 'alice', permissions: 'rw-r--r--' },
    ]},
  ]},
  { id: 'downloads', text: 'Downloads', leaf: false, expanded: false, type: 'folder', size: 0, modified: '2025-03-18', children: [
    { id: 'f14', text: 'app-installer.dmg', leaf: true, type: 'archive', size: 209715200, modified: '2025-03-18', ext: 'dmg', owner: 'alice', permissions: 'rw-r--r--' },
    { id: 'f15', text: 'backup-2025.zip', leaf: true, type: 'archive', size: 524288000, modified: '2025-03-01', ext: 'zip', owner: 'alice', permissions: 'rw-r--r--' },
  ]},
];

export const smallProjectPlan: TreeNodeData[] = [
  { id: 'p1', text: 'Phase 1: Planning & Discovery', leaf: false, expanded: true, estimatedHours: 120, actualHours: 90, percentComplete: 75, startDate: '2025-01-06', endDate: '2025-02-14', children: [
    { id: 't1', text: 'Define Requirements', leaf: false, expanded: false, assignee: 'Alice Chen', status: 'Completed', priority: 'Critical', estimatedHours: 40, actualHours: 42, percentComplete: 100, startDate: '2025-01-06', endDate: '2025-01-31', notes: 'Gather all stakeholder requirements and document user stories.', tags: ['strategy'], dependencies: [], children: [
      { id: 't1a', text: 'Interview Stakeholders', leaf: true, assignee: 'Alice Chen', status: 'Completed', priority: 'High', estimatedHours: 16, actualHours: 18, percentComplete: 100, startDate: '2025-01-06', endDate: '2025-01-15', notes: '', tags: ['strategy'], dependencies: [] },
      { id: 't1b', text: 'Document User Stories', leaf: true, assignee: 'Bob Martinez', status: 'Completed', priority: 'High', estimatedHours: 24, actualHours: 24, percentComplete: 100, startDate: '2025-01-16', endDate: '2025-01-31', notes: '', tags: ['strategy'], dependencies: ['t1a'] },
    ]},
    { id: 't2', text: 'Create Project Charter', leaf: false, expanded: false, assignee: 'Carol Johnson', status: 'Completed', priority: 'High', estimatedHours: 24, actualHours: 20, percentComplete: 100, startDate: '2025-01-20', endDate: '2025-02-07', notes: 'Define project scope, timeline, and resource requirements.', tags: ['strategy', 'documentation'], dependencies: ['t1'], children: [
      { id: 't2a', text: 'Risk Assessment', leaf: true, assignee: 'Carol Johnson', status: 'Completed', priority: 'Medium', estimatedHours: 8, actualHours: 6, percentComplete: 100, startDate: '2025-01-20', endDate: '2025-01-24', notes: '', tags: ['strategy'], dependencies: [] },
      { id: 't2b', text: 'Resource Planning', leaf: true, assignee: 'David Kim', status: 'Completed', priority: 'Medium', estimatedHours: 16, actualHours: 14, percentComplete: 100, startDate: '2025-01-27', endDate: '2025-02-07', notes: '', tags: ['strategy'], dependencies: ['t2a'] },
    ]},
    { id: 't3', text: 'Technical Discovery', leaf: true, assignee: 'Emma Wilson', status: 'Review', priority: 'High', estimatedHours: 56, actualHours: 28, percentComplete: 50, startDate: '2025-02-03', endDate: '2025-02-14', notes: 'Evaluate technical stack options and architecture approaches.', tags: ['engineering'], dependencies: ['t1'] },
  ]},
  { id: 'p2', text: 'Phase 2: Design & Architecture', leaf: false, expanded: false, estimatedHours: 160, actualHours: 64, percentComplete: 40, startDate: '2025-02-17', endDate: '2025-03-28', children: [
    { id: 't4', text: 'System Architecture', leaf: false, expanded: false, assignee: 'Frank Patel', status: 'In Progress', priority: 'Critical', estimatedHours: 48, actualHours: 32, percentComplete: 65, startDate: '2025-02-17', endDate: '2025-03-07', notes: 'Define system components, data flows, and API contracts.', tags: ['engineering'], dependencies: ['t3'], children: [
      { id: 't4a', text: 'Database Schema Design', leaf: true, assignee: 'Frank Patel', status: 'Completed', priority: 'Critical', estimatedHours: 16, actualHours: 18, percentComplete: 100, startDate: '2025-02-17', endDate: '2025-02-21', notes: '', tags: ['backend'], dependencies: [] },
      { id: 't4b', text: 'API Contract Definition', leaf: true, assignee: 'Grace Lee', status: 'In Progress', priority: 'High', estimatedHours: 32, actualHours: 14, percentComplete: 45, startDate: '2025-02-24', endDate: '2025-03-07', notes: '', tags: ['backend'], dependencies: ['t4a'] },
    ]},
    { id: 't5', text: 'UI Design', leaf: false, expanded: false, assignee: 'Henry Brown', status: 'In Progress', priority: 'High', estimatedHours: 80, actualHours: 24, percentComplete: 30, startDate: '2025-02-24', endDate: '2025-03-21', notes: 'Create wireframes, mockups, and design system components.', tags: ['design'], dependencies: ['t4'], children: [
      { id: 't5a', text: 'Wireframes', leaf: true, assignee: 'Henry Brown', status: 'Completed', priority: 'High', estimatedHours: 24, actualHours: 22, percentComplete: 100, startDate: '2025-02-24', endDate: '2025-03-07', notes: '', tags: ['design'], dependencies: [] },
      { id: 't5b', text: 'High-Fidelity Mockups', leaf: true, assignee: 'Iris Nakamura', status: 'In Progress', priority: 'High', estimatedHours: 40, actualHours: 0, percentComplete: 0, startDate: '2025-03-10', endDate: '2025-03-21', notes: '', tags: ['design'], dependencies: ['t5a'] },
      { id: 't5c', text: 'Design System', leaf: true, assignee: 'Henry Brown', status: 'Not Started', priority: 'Medium', estimatedHours: 16, actualHours: 0, percentComplete: 0, startDate: '2025-03-17', endDate: '2025-03-21', notes: '', tags: ['design', 'frontend'], dependencies: ['t5b'] },
    ]},
    { id: 't6', text: 'Security Architecture', leaf: true, assignee: 'James O\'Brien', status: 'Not Started', priority: 'Critical', estimatedHours: 32, actualHours: 0, percentComplete: 0, startDate: '2025-03-24', endDate: '2025-03-28', notes: 'Define authentication, authorization, and data security strategy.', tags: ['security'], dependencies: ['t4'] },
  ]},
  { id: 'p3', text: 'Phase 3: Implementation', leaf: false, expanded: false, estimatedHours: 320, actualHours: 0, percentComplete: 0, startDate: '2025-03-31', endDate: '2025-06-06', children: [
    { id: 't7', text: 'Backend Development', leaf: false, expanded: false, assignee: 'Kira Okonkwo', status: 'Not Started', priority: 'Critical', estimatedHours: 160, actualHours: 0, percentComplete: 0, startDate: '2025-03-31', endDate: '2025-05-09', notes: 'Implement all API endpoints and business logic.', tags: ['backend'], dependencies: ['t4b'], children: [
      { id: 't7a', text: 'Authentication Service', leaf: true, assignee: 'Kira Okonkwo', status: 'Not Started', priority: 'Critical', estimatedHours: 40, actualHours: 0, percentComplete: 0, startDate: '2025-03-31', endDate: '2025-04-11', notes: '', tags: ['backend', 'security'], dependencies: [] },
      { id: 't7b', text: 'Core API Endpoints', leaf: true, assignee: 'Liam Thompson', status: 'Not Started', priority: 'Critical', estimatedHours: 80, actualHours: 0, percentComplete: 0, startDate: '2025-04-14', endDate: '2025-05-02', notes: '', tags: ['backend'], dependencies: ['t7a'] },
      { id: 't7c', text: 'Data Migration', leaf: true, assignee: 'Maya Singh', status: 'Not Started', priority: 'High', estimatedHours: 40, actualHours: 0, percentComplete: 0, startDate: '2025-04-28', endDate: '2025-05-09', notes: '', tags: ['backend'], dependencies: ['t7b'] },
    ]},
    { id: 't8', text: 'Frontend Development', leaf: true, assignee: 'Noah Garcia', status: 'Blocked', priority: 'Critical', estimatedHours: 160, actualHours: 0, percentComplete: 0, startDate: '2025-04-14', endDate: '2025-06-06', notes: 'Waiting on design mockup approval before starting.', tags: ['frontend'], dependencies: ['t5b'] },
  ]},
  { id: 'p4', text: 'Phase 4: Testing & Launch', leaf: false, expanded: false, estimatedHours: 120, actualHours: 0, percentComplete: 0, startDate: '2025-06-09', endDate: '2025-07-04', children: [
    { id: 't9', text: 'QA Testing', leaf: true, assignee: 'Olivia Zhang', status: 'Not Started', priority: 'High', estimatedHours: 60, actualHours: 0, percentComplete: 0, startDate: '2025-06-09', endDate: '2025-06-27', notes: 'Comprehensive testing across all features and edge cases.', tags: ['testing'], dependencies: ['t7c', 't8'] },
    { id: 't10', text: 'Production Deployment', leaf: true, assignee: 'Paulo Andersen', status: 'Not Started', priority: 'Critical', estimatedHours: 40, actualHours: 0, percentComplete: 0, startDate: '2025-06-30', endDate: '2025-07-04', notes: 'Deploy to production with blue-green deployment strategy.', tags: ['devops'], dependencies: ['t9'] },
    { id: 't11', text: 'Post-Launch Monitoring', leaf: true, assignee: 'Quinn Ferreira', status: 'Not Started', priority: 'High', estimatedHours: 20, actualHours: 0, percentComplete: 0, startDate: '2025-07-07', endDate: '2025-07-11', notes: 'Monitor metrics, error rates, and user feedback.', tags: ['devops'], dependencies: ['t10'] },
  ]},
];

export const smallOrganization: TreeNodeData[] = [
  { id: 'eng', text: 'Engineering', leaf: false, expanded: true, department: 'Engineering', children: [
    { id: 'fe-team', text: 'Frontend Team', leaf: false, expanded: false, department: 'Engineering', children: [
      { id: 'e1', text: 'Alice Chen', leaf: true, name: 'Alice Chen', title: 'Engineering Manager', email: 'alice.chen@acme.com', phone: '+1-555-1001', location: 'San Francisco', hireDate: '2019-03-15', salary: 185000, isManager: true, skills: ['TypeScript', 'React', 'Leadership'], performanceRating: 5, department: 'Engineering', team: 'Frontend Team' },
      { id: 'e2', text: 'Bob Martinez', leaf: true, name: 'Bob Martinez', title: 'Senior Engineer', email: 'bob.martinez@acme.com', phone: '+1-555-1002', location: 'San Francisco', hireDate: '2020-06-01', salary: 165000, isManager: false, skills: ['TypeScript', 'React', 'CSS'], performanceRating: 4, department: 'Engineering', team: 'Frontend Team' },
      { id: 'e3', text: 'Carol Johnson', leaf: true, name: 'Carol Johnson', title: 'Software Engineer', email: 'carol.johnson@acme.com', phone: '+1-555-1003', location: 'Remote', hireDate: '2021-09-13', salary: 135000, isManager: false, skills: ['Vue.js', 'TypeScript', 'Testing'], performanceRating: 4, department: 'Engineering', team: 'Frontend Team' },
    ]},
    { id: 'be-team', text: 'Backend Team', leaf: false, expanded: false, department: 'Engineering', children: [
      { id: 'e4', text: 'David Kim', leaf: true, name: 'David Kim', title: 'Staff Engineer', email: 'david.kim@acme.com', phone: '+1-555-1004', location: 'San Francisco', hireDate: '2018-02-20', salary: 210000, isManager: false, skills: ['Go', 'PostgreSQL', 'Kubernetes'], performanceRating: 5, department: 'Engineering', team: 'Backend Team' },
      { id: 'e5', text: 'Emma Wilson', leaf: true, name: 'Emma Wilson', title: 'Senior Engineer', email: 'emma.wilson@acme.com', phone: '+1-555-1005', location: 'London', hireDate: '2019-11-04', salary: 155000, isManager: false, skills: ['Python', 'FastAPI', 'Redis'], performanceRating: 4, department: 'Engineering', team: 'Backend Team' },
    ]},
  ]},
  { id: 'product', text: 'Product', leaf: false, expanded: false, department: 'Product', children: [
    { id: 'prod-team', text: 'Product Strategy', leaf: false, expanded: false, department: 'Product', children: [
      { id: 'p1', text: 'Frank Patel', leaf: true, name: 'Frank Patel', title: 'VP of Product', email: 'frank.patel@acme.com', phone: '+1-555-2001', location: 'San Francisco', hireDate: '2017-08-14', salary: 250000, isManager: true, skills: ['Strategy', 'Roadmapping', 'OKRs'], performanceRating: 5, department: 'Product', team: 'Product Strategy' },
      { id: 'p2', text: 'Grace Lee', leaf: true, name: 'Grace Lee', title: 'Senior PM', email: 'grace.lee@acme.com', phone: '+1-555-2002', location: 'San Francisco', hireDate: '2020-03-02', salary: 175000, isManager: false, skills: ['User Research', 'A/B Testing', 'Analytics'], performanceRating: 4, department: 'Product', team: 'Product Strategy' },
    ]},
  ]},
  { id: 'design', text: 'Design', leaf: false, expanded: false, department: 'Design', children: [
    { id: 'ux-team', text: 'UX Design', leaf: false, expanded: false, department: 'Design', children: [
      { id: 'd1', text: 'Henry Brown', leaf: true, name: 'Henry Brown', title: 'Head of Design', email: 'henry.brown@acme.com', phone: '+1-555-3001', location: 'London', hireDate: '2019-05-20', salary: 195000, isManager: true, skills: ['Figma', 'UX Research', 'Design Systems'], performanceRating: 5, department: 'Design', team: 'UX Design' },
      { id: 'd2', text: 'Iris Nakamura', leaf: true, name: 'Iris Nakamura', title: 'UX Designer', email: 'iris.nakamura@acme.com', phone: '+1-555-3002', location: 'Tokyo', hireDate: '2021-01-11', salary: 125000, isManager: false, skills: ['Figma', 'Prototyping', 'Illustration'], performanceRating: 4, department: 'Design', team: 'UX Design' },
    ]},
  ]},
];

export const productCategories: TreeNodeData[] = [
  { id: 'electronics', text: 'Electronics', leaf: false, expanded: false, children: [
    { id: 'computers', text: 'Computers', leaf: false, expanded: false, children: [
      { id: 'e1', text: 'MacBook Pro 14"', leaf: true, sku: 'SKU-10001', price: '1999.00', stock: 150, rating: '4.8', reviewCount: 3420 },
      { id: 'e2', text: 'ThinkPad X1 Carbon', leaf: true, sku: 'SKU-10002', price: '1599.00', stock: 89, rating: '4.6', reviewCount: 2104 },
      { id: 'e3', text: 'Dell XPS 15', leaf: true, sku: 'SKU-10003', price: '1799.00', stock: 234, rating: '4.5', reviewCount: 1876 },
    ]},
    { id: 'phones', text: 'Smartphones', leaf: false, expanded: false, children: [
      { id: 'e4', text: 'iPhone 16 Pro', leaf: true, sku: 'SKU-10004', price: '999.00', stock: 445, rating: '4.9', reviewCount: 8734 },
      { id: 'e5', text: 'Samsung Galaxy S25', leaf: true, sku: 'SKU-10005', price: '849.00', stock: 312, rating: '4.7', reviewCount: 5621 },
    ]},
  ]},
  { id: 'clothing', text: 'Clothing', leaf: false, expanded: false, children: [
    { id: 'mens', text: "Men's", leaf: false, expanded: false, children: [
      { id: 'c1', text: 'Oxford Shirt', leaf: true, sku: 'SKU-20001', price: '79.00', stock: 589, rating: '4.4', reviewCount: 892 },
      { id: 'c2', text: 'Slim Chinos', leaf: true, sku: 'SKU-20002', price: '89.00', stock: 421, rating: '4.3', reviewCount: 654 },
      { id: 'c3', text: 'Leather Oxford Shoes', leaf: true, sku: 'SKU-20003', price: '189.00', stock: 187, rating: '4.6', reviewCount: 432 },
    ]},
    { id: 'womens', text: "Women's", leaf: false, expanded: false, children: [
      { id: 'c4', text: 'Silk Wrap Dress', leaf: true, sku: 'SKU-20004', price: '129.00', stock: 245, rating: '4.7', reviewCount: 1243 },
      { id: 'c5', text: 'Cashmere Cardigan', leaf: true, sku: 'SKU-20005', price: '159.00', stock: 178, rating: '4.8', reviewCount: 876 },
    ]},
  ]},
];
