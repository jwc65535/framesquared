# 19 · Org Chart

## Overview

An organizational chart showing company hierarchy from CEO down to individual contributors. Department-colored avatar circles, a profile card panel, and filter controls make this a practical HR directory tool.

## Key Concepts

- **Avatar renderer** — the tree column renderer returns an HTML `<span class="avatar">` with initials, colored by department.
- **Profile card panel** — `itemclick` event updates a right-side panel with the selected person's full profile.
- **Department color mapping** — `DEPT_COLORS` maps department names to hex colors, applied both to avatars and profile headers.
- **Multi-filter** — search text, department dropdown, and location dropdown all filter simultaneously on each change.
- **`rootVisible: true`** — shows the company name as the root node.

## Try It

1. Expand **Engineering** → **Frontend Team** — see team members with initials in colored circles.
2. Click any person — the profile card on the right shows their full details (email, salary, rating, skills).
3. Type "Alice" in the search box — only rows containing "Alice" are visible.
4. Select "London" in Location filter — shows only London-based employees.
5. Expand all departments to see the full hierarchy.

## Source Highlights

1. `avatarHtml(node)` — returns `<span class="avatar" style="background:${color}">AJ</span>` prepended to the name.
2. `skillsHtml(skills)` — renders the first 3 skills as pills with "+N" overflow count.
3. `applyFilters()` — called on every input/change event, walks all `tr` rows and sets `display`.

## Real-World Use

Org chart viewers, employee directories, team management tools, and HR dashboards.

## Related Examples

- [08 · Selection Modes](#selection) — multi-select employees for batch operations
- [06 · Drag & Drop](#drag-drop) — drag employees between teams to reorganize
