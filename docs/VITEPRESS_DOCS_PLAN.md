# Bento — VitePress Documentation Master Plan

> **This file is the sole source of truth for the author model.** Every `.md` file under `website/` MUST be generated from this plan. Do not invent sections, URLs, endpoints, CLI flags, env vars, or screenshots that are not listed here. If something is missing, emit a `<!-- TODO: confirm -->` comment inline — do not guess.

---

## 0. Hard rules for the author model

These rules apply to **every** file you produce. Read them before generating anything.

1. **Scope** — Generate only the files listed in §4 "File manifest". Do not create extra pages, indexes, or aggregator files not listed there.
2. **Path & filename** — Use the exact path and filename given. All filenames are lowercase, words separated by `-` (kebab-case). Extension is always `.md`.
3. **Frontmatter** — Every page MUST start with this exact frontmatter block (no extra keys, no missing keys):
   ```yaml
   ---
   title: <Page Title>
   description: <one-sentence SEO description, max 160 chars>
   outline: [2, 3]
   ---
   ```
   The `title` MUST match the `# H1` on line 1 of the body.
4. **Heading hierarchy** — Exactly one `# H1` per page (matches `title`). Use `##` for top sections, `###` for subsections. Never skip a level. Never use `####` or deeper.
5. **Screenshots** — Reference images via `![alt](/images/<exact-filename>.png)`. Every image referenced MUST appear in §5 "Screenshot manifest". Do not invent filenames. If a page needs an image not yet shot, write `<!-- SCREENSHOT: images/<filename>.png — <what to capture> -->` and continue — do not leave an `<img>` tag pointing at a missing file.
6. **Code blocks** — Always specify a language (`bash`, `yaml`, `json`, `ts`, `tsx`, `java`, `http`, `sql`, `dockerfile`). Never use a bare triple-fence.
7. **Factual anchors** — Only reference services, ports, env vars, endpoints, entities, and features from §6 "Factual anchors". If a fact is not in §6, write `<!-- TODO: confirm with maintainer -->` instead of inventing one.
8. **Length budget** — Each page: 250–900 words, unless §4 marks it `(short)` (≤ 200 words) or `(long)` (900–1800 words).
9. **Cross-links** — Use relative links with explicit `.md`: `[Quickstart](../guide/quickstart.md)`. Never link to external marketing sites. Never hard-code `localhost:3000` in prose (say "the app URL").
10. **No marketing voice** — Write for developers and operators. Second person ("you"), present tense, short sentences. No "seamlessly", "powerful", "cutting-edge", "revolutionary". No emojis unless the section below explicitly asks for one (only §1 hero and §4/guide/introduction.md may use up to 3).
11. **No fabricated screenshots or UI text** — If a UI element's label is not in §6.8, write the control by function (e.g., "the primary action button in the column header") rather than guessing its label.
12. **VitePress features to use** — Use `::: tip`, `::: warning`, `::: danger`, `::: info`, `::: details` containers where helpful. Use GitHub-flavored tables for reference matrices. No custom Vue components.
13. **Do NOT write** — No "Conclusion" sections, no "In this guide you learned…" recaps, no changelogs inside pages (except `changelog.md`), no author bios, no roadmap speculation.

---

## 1. Site configuration (`website/.vitepress/config.ts`)

The author model produces this file **verbatim** from the spec below (substitute only values inside `<< >>`):

```ts
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Bento',
  description: 'Open-source project management — self-host or cloud.',
  lang: 'en-US',
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ['link', { rel: 'icon', href: '/images/favicon.png' }],
    ['meta', { name: 'theme-color', content: '#0ea5e9' }],
  ],
  themeConfig: {
    logo: '/images/logo.svg',
    siteTitle: 'Bento',
    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'Self-Host', link: '/self-host/overview' },
      { text: 'User Guide', link: '/user-guide/overview' },
      { text: 'Architecture', link: '/architecture/overview' },
      { text: 'API', link: '/api/overview' },
      { text: 'Changelog', link: '/changelog' },
    ],
    sidebar: {
      '/guide/':       << SIDEBAR FROM §3.1 >>,
      '/self-host/':   << SIDEBAR FROM §3.2 >>,
      '/user-guide/':  << SIDEBAR FROM §3.3 >>,
      '/architecture/':<< SIDEBAR FROM §3.4 >>,
      '/api/':         << SIDEBAR FROM §3.5 >>,
      '/contributing/':<< SIDEBAR FROM §3.6 >>,
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/andreibel/bento' },
    ],
    editLink: {
      pattern: 'https://github.com/andreibel/bento/edit/main/website/:path',
      text: 'Edit this page on GitHub',
    },
    search: { provider: 'local' },
    footer: {
      message: 'Released under the AGPL-3.0 License.',
      copyright: 'Copyright © 2026 Andrei Beloziorov',
    },
  },
})
```

Package setup (root `website/package.json`):
- `vitepress` ^1.5.0
- scripts: `dev` = `vitepress dev`, `build` = `vitepress build`, `preview` = `vitepress preview`

Node version: 20+.

---

## 2. Directory layout (must match exactly)

```
website/
├── package.json
├── .vitepress/
│   └── config.ts
├── public/
│   └── images/                    ← all screenshots & logo go here
├── index.md                       ← homepage (hero)
├── changelog.md
├── guide/
│   ├── introduction.md
│   ├── quickstart.md
│   ├── concepts.md
│   └── faq.md
├── self-host/
│   ├── overview.md
│   ├── requirements.md
│   ├── docker-compose.md
│   ├── environment.md
│   ├── profiles.md
│   ├── reverse-proxy.md
│   ├── email.md
│   ├── storage-minio.md
│   ├── backup.md
│   ├── updates.md
│   ├── scaling.md
│   └── troubleshooting.md
├── user-guide/
│   ├── overview.md
│   ├── accounts/
│   │   ├── register.md
│   │   ├── verify-email.md
│   │   ├── login.md
│   │   ├── forgot-password.md
│   │   └── profile.md
│   ├── organizations/
│   │   ├── create.md
│   │   ├── invite-members.md
│   │   ├── roles.md
│   │   └── switch-org.md
│   ├── boards/
│   │   ├── create.md
│   │   ├── columns.md
│   │   ├── labels.md
│   │   └── permissions.md
│   ├── issues/
│   │   ├── create.md
│   │   ├── edit.md
│   │   ├── assign.md
│   │   ├── comments.md
│   │   ├── attachments.md
│   │   ├── dependencies.md
│   │   ├── time-tracking.md
│   │   └── my-issues.md
│   ├── sprints/
│   │   ├── overview.md
│   │   ├── plan.md
│   │   ├── start.md
│   │   └── close.md
│   ├── backlog.md
│   ├── timeline.md
│   ├── global-timeline.md
│   ├── calendar.md
│   ├── inbox.md
│   ├── analytics/
│   │   ├── reports.md
│   │   └── time-tracking.md
│   └── settings/
│       ├── profile.md
│       ├── security.md
│       ├── preferences.md
│       ├── members.md
│       ├── labels.md
│       ├── integrations.md
│       ├── automations.md
│       ├── org-general.md
│       └── org-advanced.md
├── architecture/
│   ├── overview.md
│   ├── services.md
│   ├── data-model.md
│   ├── auth-flow.md
│   ├── events.md
│   ├── realtime.md
│   └── multi-tenancy.md
├── api/
│   ├── overview.md
│   ├── conventions.md
│   ├── auth.md
│   ├── org.md
│   ├── board.md
│   ├── task.md
│   ├── notification.md
│   ├── realtime.md
│   └── attachment.md
└── contributing/
    ├── setup.md
    ├── code-style.md
    ├── testing.md
    ├── commits.md
    └── pull-requests.md
```

---

## 3. Sidebars

Each sidebar block is given verbatim — paste into `config.ts`.

### 3.1 `/guide/`
```ts
[{ text: 'Getting Started', items: [
  { text: 'Introduction', link: '/guide/introduction' },
  { text: 'Quickstart', link: '/guide/quickstart' },
  { text: 'Core Concepts', link: '/guide/concepts' },
  { text: 'FAQ', link: '/guide/faq' },
]}]
```

### 3.2 `/self-host/`
```ts
[{ text: 'Self-Host', items: [
  { text: 'Overview', link: '/self-host/overview' },
  { text: 'Requirements', link: '/self-host/requirements' },
  { text: 'Docker Compose', link: '/self-host/docker-compose' },
  { text: 'Environment Variables', link: '/self-host/environment' },
  { text: 'Deployment Profiles', link: '/self-host/profiles' },
  { text: 'Reverse Proxy & TLS', link: '/self-host/reverse-proxy' },
  { text: 'Email (SMTP)', link: '/self-host/email' },
  { text: 'File Storage (MinIO)', link: '/self-host/storage-minio' },
  { text: 'Backup & Restore', link: '/self-host/backup' },
  { text: 'Updates', link: '/self-host/updates' },
  { text: 'Scaling', link: '/self-host/scaling' },
  { text: 'Troubleshooting', link: '/self-host/troubleshooting' },
]}]
```

### 3.3 `/user-guide/`
```ts
[
  { text: 'User Guide', items: [
    { text: 'Overview', link: '/user-guide/overview' },
  ]},
  { text: 'Account', collapsed: false, items: [
    { text: 'Register', link: '/user-guide/accounts/register' },
    { text: 'Verify Email', link: '/user-guide/accounts/verify-email' },
    { text: 'Login', link: '/user-guide/accounts/login' },
    { text: 'Forgot Password', link: '/user-guide/accounts/forgot-password' },
    { text: 'Profile', link: '/user-guide/accounts/profile' },
  ]},
  { text: 'Organizations', collapsed: true, items: [
    { text: 'Create', link: '/user-guide/organizations/create' },
    { text: 'Invite Members', link: '/user-guide/organizations/invite-members' },
    { text: 'Roles & Permissions', link: '/user-guide/organizations/roles' },
    { text: 'Switch Org', link: '/user-guide/organizations/switch-org' },
  ]},
  { text: 'Boards', collapsed: true, items: [
    { text: 'Create a Board', link: '/user-guide/boards/create' },
    { text: 'Columns & Workflow', link: '/user-guide/boards/columns' },
    { text: 'Labels', link: '/user-guide/boards/labels' },
    { text: 'Board Permissions', link: '/user-guide/boards/permissions' },
  ]},
  { text: 'Issues', collapsed: true, items: [
    { text: 'Create an Issue', link: '/user-guide/issues/create' },
    { text: 'Edit an Issue', link: '/user-guide/issues/edit' },
    { text: 'Assign & Estimate', link: '/user-guide/issues/assign' },
    { text: 'Comments & Mentions', link: '/user-guide/issues/comments' },
    { text: 'Attachments', link: '/user-guide/issues/attachments' },
    { text: 'Dependencies', link: '/user-guide/issues/dependencies' },
    { text: 'Time Tracking', link: '/user-guide/issues/time-tracking' },
    { text: 'My Issues', link: '/user-guide/issues/my-issues' },
  ]},
  { text: 'Sprints', collapsed: true, items: [
    { text: 'Overview', link: '/user-guide/sprints/overview' },
    { text: 'Plan a Sprint', link: '/user-guide/sprints/plan' },
    { text: 'Start a Sprint', link: '/user-guide/sprints/start' },
    { text: 'Close a Sprint', link: '/user-guide/sprints/close' },
  ]},
  { text: 'Views', collapsed: true, items: [
    { text: 'Backlog', link: '/user-guide/backlog' },
    { text: 'Timeline (Gantt)', link: '/user-guide/timeline' },
    { text: 'Global Timeline', link: '/user-guide/global-timeline' },
    { text: 'Calendar', link: '/user-guide/calendar' },
    { text: 'Inbox', link: '/user-guide/inbox' },
  ]},
  { text: 'Analytics', collapsed: true, items: [
    { text: 'Reports', link: '/user-guide/analytics/reports' },
    { text: 'Time Tracking', link: '/user-guide/analytics/time-tracking' },
  ]},
  { text: 'Settings', collapsed: true, items: [
    { text: 'Profile', link: '/user-guide/settings/profile' },
    { text: 'Security', link: '/user-guide/settings/security' },
    { text: 'Preferences (Language & Theme)', link: '/user-guide/settings/preferences' },
    { text: 'Members', link: '/user-guide/settings/members' },
    { text: 'Labels', link: '/user-guide/settings/labels' },
    { text: 'Integrations', link: '/user-guide/settings/integrations' },
    { text: 'Automations', link: '/user-guide/settings/automations' },
    { text: 'Org General', link: '/user-guide/settings/org-general' },
    { text: 'Org Advanced', link: '/user-guide/settings/org-advanced' },
  ]},
]
```

### 3.4 `/architecture/`
```ts
[{ text: 'Architecture', items: [
  { text: 'Overview', link: '/architecture/overview' },
  { text: 'Services', link: '/architecture/services' },
  { text: 'Data Model', link: '/architecture/data-model' },
  { text: 'Auth Flow', link: '/architecture/auth-flow' },
  { text: 'Events (Kafka)', link: '/architecture/events' },
  { text: 'Realtime (WebSocket)', link: '/architecture/realtime' },
  { text: 'Multi-tenancy', link: '/architecture/multi-tenancy' },
]}]
```

### 3.5 `/api/`
```ts
[{ text: 'API Reference', items: [
  { text: 'Overview', link: '/api/overview' },
  { text: 'Conventions', link: '/api/conventions' },
  { text: 'Auth Service', link: '/api/auth' },
  { text: 'Org Service', link: '/api/org' },
  { text: 'Board Service', link: '/api/board' },
  { text: 'Task Service', link: '/api/task' },
  { text: 'Notification Service', link: '/api/notification' },
  { text: 'Realtime Service', link: '/api/realtime' },
  { text: 'Attachment Service', link: '/api/attachment' },
]}]
```

### 3.6 `/contributing/`
```ts
[{ text: 'Contributing', items: [
  { text: 'Dev Setup', link: '/contributing/setup' },
  { text: 'Code Style', link: '/contributing/code-style' },
  { text: 'Testing', link: '/contributing/testing' },
  { text: 'Commit Conventions', link: '/contributing/commits' },
  { text: 'Pull Requests', link: '/contributing/pull-requests' },
]}]
```

---

## 4. File manifest — per-page spec

> For every entry: **Purpose** = one-sentence goal. **Sections** = exact `##` headings in order. **Screenshots** = keys from §5. **Length** = short/default/long.

### 4.0 Homepage — `index.md`
- **Type**: VitePress hero layout. Use `layout: home` frontmatter.
- **Frontmatter** fields: `layout: home`, `hero.name: Bento`, `hero.text: Project management you can host yourself`, `hero.tagline: Scrum, Kanban, and Gantt for teams that care about their data.`, `hero.image: /images/logo.svg`, `hero.actions` = `[{theme:brand,text:Get Started,link:/guide/quickstart}, {theme:alt,text:View on GitHub,link:https://github.com/andreibel/bento}]`, `features` = 6 entries (see below).
- **Features (exact 6)**:
  1. Self-host or cloud — one Docker Compose file.
  2. Scrum & Kanban — boards, sprints, backlog, burndown.
  3. Gantt timeline — epics, milestones, dependencies.
  4. Realtime — WebSocket-powered live boards.
  5. Multi-tenant — organizations with roles.
  6. Event-driven — Kafka under the hood.
- No body paragraphs. Only frontmatter.

### 4.1 `/guide/`

#### `guide/introduction.md`
- **Purpose**: Explain what Bento is, who it's for, what it is not.
- **Sections**: `## What Bento is`, `## Who it's for`, `## What it's not (yet)`, `## License`, `## Where to go next`.
- **Screenshots**: `hero-splash`, `board-overview`.
- **Length**: long. May use up to 3 emoji (hero only).

#### `guide/quickstart.md`
- **Purpose**: Get a running instance in 5 minutes using the beta Docker Compose.
- **Sections**: `## Prerequisites`, `## 1. Download the compose file`, `## 2. Configure secrets`, `## 3. Start the stack`, `## 4. Create your first organization`, `## 5. Next steps`.
- **Code blocks**: copy exact commands from `README.md` §"Deploy the Beta" (steps 1–3). Do not paraphrase.
- **Screenshots**: `first-run-terminal`, `create-org-form`, `empty-board`.
- **Length**: long.

#### `guide/concepts.md`
- **Purpose**: Define every domain term used throughout the docs.
- **Sections**: `## Organization`, `## Board`, `## Column`, `## Issue`, `## Epic`, `## Milestone`, `## Sprint`, `## Label`, `## Dependency`, `## Role`, `## Member`, `## Workspace vs Tenant`.
- Each term: 2–4 sentence definition. No screenshots.
- **Length**: long.

#### `guide/faq.md`
- **Purpose**: 8–12 Q&A pairs.
- **Sections**: `## General`, `## Self-Hosting`, `## Data & Privacy`, `## Limits`.
- Use `### How do I …?` for each question. Each answer: 1–3 sentences.
- **Length**: default.

---

### 4.2 `/self-host/`

#### `self-host/overview.md`
- **Purpose**: Decision tree for choosing a deployment profile.
- **Sections**: `## Deployment profiles`, `## When to pick each`, `## What you'll need`.
- **Tables**: Include the profile matrix from CLAUDE.md §"Deployment Profiles" verbatim.
- **Screenshots**: none.
- **Length**: default.

#### `self-host/requirements.md`
- **Purpose**: Hardware, OS, network, and software requirements.
- **Sections**: `## Hardware`, `## Operating system`, `## Software`, `## Network & ports`, `## Supported architectures`.
- **Ports table**: list every port from §6.1.
- **Length**: default.

#### `self-host/docker-compose.md`
- **Purpose**: Walk through `docker-compose.beta.yml` file-by-file.
- **Sections**: `## File layout`, `## Services`, `## Volumes`, `## Networks`, `## Healthchecks`, `## Customizing ports`.
- **Screenshots**: none.
- **Length**: long.

#### `self-host/environment.md`
- **Purpose**: Reference every env var.
- **Sections**: `## Security secrets`, `## Database credentials`, `## URLs`, `## Mail`, `## MinIO / attachments`, `## Optional integrations`.
- **Tables**: one row per env var from §6.3. Columns: `Name | Required | Default | Description`.
- **Length**: long.

#### `self-host/profiles.md`
- **Purpose**: Detail `cloud`, `selfhost`, and `minimal` profiles.
- **Sections**: `## cloud`, `## selfhost`, `## minimal`, `## Switching profiles`.
- **Length**: default.

#### `self-host/reverse-proxy.md`
- **Purpose**: Caddy and Nginx configs for TLS termination.
- **Sections**: `## Caddy (recommended)`, `## Nginx`, `## Websocket pass-through`, `## Common pitfalls`.
- **Code blocks**: one full `Caddyfile` and one full `nginx.conf` server block.
- **Length**: long.

#### `self-host/email.md`
- **Purpose**: SMTP setup for transactional mail.
- **Sections**: `## Providers`, `## Configuration`, `## Testing with MailHog`, `## Troubleshooting`.
- **Length**: default.

#### `self-host/storage-minio.md`
- **Purpose**: MinIO bucket setup, credentials, migrating to S3.
- **Sections**: `## Default configuration`, `## Creating the bucket`, `## Console`, `## Using AWS S3 instead`.
- **Screenshots**: `minio-console`, `minio-bucket`.
- **Length**: default.

#### `self-host/backup.md`
- **Purpose**: Back up Postgres, Mongo, MinIO volumes.
- **Sections**: `## What to back up`, `## PostgreSQL`, `## MongoDB`, `## MinIO`, `## Restore`, `## Recommended schedule`.
- **Length**: long.

#### `self-host/updates.md`
- **Purpose**: Update strategy.
- **Sections**: `## Version scheme`, `## Pulling new images`, `## Migrations`, `## Rollback`.
- **Commands**: use the exact `docker compose pull` / `up -d` sequence from `README.md` step 4.
- **Length**: default.

#### `self-host/scaling.md`
- **Purpose**: Horizontal scaling notes.
- **Sections**: `## Stateless services`, `## Kafka partitions`, `## Database read replicas`, `## Attachments on S3`.
- **Length**: default.

#### `self-host/troubleshooting.md`
- **Purpose**: Concrete error → fix table.
- **Sections**: `## Container won't start`, `## Login fails / 401`, `## Emails not arriving`, `## Realtime not connecting`, `## Attachment upload fails`, `## Collecting logs`.
- Each section: error signature in a code block, then fix steps.
- **Length**: long.

---

### 4.3 `/user-guide/`

General rule for every user-guide page:
- Begin with a 1-paragraph "What this is" under the H1 (no heading).
- First `##` is always `## Who can do this` (role matrix — use table from §6.2).
- Then `## Steps` (ordered list, each step = one sentence + optional sub-bullets).
- Then `## Screenshot walkthrough` (single image, alt text required).
- End with `## Troubleshooting` (2–5 bullet items) OR `## Related`.

The table below gives each page's screenshot list, role gate, and any page-specific sections (in addition to the standard ones).

| File | Role gate (§6.2) | Screenshots (§5 keys) | Extra sections |
|---|---|---|---|
| `user-guide/overview.md` | all | `board-overview` | `## Navigation map` |
| `accounts/register.md` | anonymous | `register-form`, `register-success` | — |
| `accounts/verify-email.md` | anonymous | `verify-email-sent`, `verify-email-success` | `## Resending the email` |
| `accounts/login.md` | anonymous | `login-form` | `## Session & device` |
| `accounts/forgot-password.md` | anonymous | `forgot-password-form`, `reset-password-form` | — |
| `accounts/profile.md` | any member | `profile-page` | `## Avatar upload`, `## Locale` |
| `organizations/create.md` | any authenticated | `create-org-form`, `org-just-created` | — |
| `organizations/invite-members.md` | OWNER/ADMIN | `members-page`, `invite-modal`, `invite-email-preview` | `## Revoking an invite` |
| `organizations/roles.md` | OWNER/ADMIN | `role-dropdown` | `## Role matrix` (use §6.2 table verbatim) |
| `organizations/switch-org.md` | multi-org user | `org-switcher` | — |
| `boards/create.md` | OWNER/ADMIN | `create-board-modal`, `empty-board` | — |
| `boards/columns.md` | OWNER/ADMIN | `board-columns-edit`, `board-columns-reorder` | `## WIP limits` |
| `boards/labels.md` | OWNER/ADMIN/MEMBER | `labels-settings`, `label-picker` | — |
| `boards/permissions.md` | OWNER/ADMIN | `board-permissions` | — |
| `issues/create.md` | MEMBER+ | `create-issue-modal`, `issue-quick-add` | `## Quick add vs full create` |
| `issues/edit.md` | MEMBER+ | `issue-detail`, `issue-edit-inline` | — |
| `issues/assign.md` | MEMBER+ | `issue-assignee-picker`, `issue-estimate-picker` | — |
| `issues/comments.md` | MEMBER+ | `issue-comments`, `mention-autocomplete` | `## Mentions` |
| `issues/attachments.md` | MEMBER+ | `issue-attachments`, `attachment-upload-progress` | `## Size limits`, `## Supported types` |
| `issues/dependencies.md` | MEMBER+ | `dependency-add-dialog`, `dependency-graph` | `## Types of links (blocks, relates, duplicates)` |
| `issues/time-tracking.md` | MEMBER+ | `time-log-modal`, `time-log-list` | — |
| `issues/my-issues.md` | any member | `my-issues-page` | `## Filters` |
| `sprints/overview.md` | any member | `sprints-list` | — |
| `sprints/plan.md` | OWNER/ADMIN | `sprint-planning`, `sprint-capacity` | — |
| `sprints/start.md` | OWNER/ADMIN | `start-sprint-modal`, `sprint-active` | — |
| `sprints/close.md` | OWNER/ADMIN | `close-sprint-modal`, `sprint-report` | `## Carry-over`, `## Velocity` |
| `backlog.md` | any member | `backlog-page`, `backlog-drag-to-sprint` | — |
| `timeline.md` | any member | `timeline-gantt`, `timeline-dependency-drag` | `## Zoom levels` |
| `global-timeline.md` | any member | `global-timeline` | — |
| `calendar.md` | any member | `calendar-page` | — |
| `inbox.md` | any member | `inbox-page`, `inbox-notification-row` | `## Notification types` |
| `analytics/reports.md` | any member | `reports-burndown`, `reports-velocity`, `reports-cycle-time` | `## Available reports` |
| `analytics/time-tracking.md` | any member | `time-tracking-analytics` | — |
| `settings/profile.md` | self | `settings-profile` | — |
| `settings/security.md` | self | `settings-security`, `change-password-form` | — |
| `settings/preferences.md` | self | `settings-preferences`, `language-picker`, `theme-toggle` | `## RTL languages` |
| `settings/members.md` | OWNER/ADMIN | `settings-members` | — |
| `settings/labels.md` | OWNER/ADMIN | `settings-labels` | — |
| `settings/integrations.md` | OWNER/ADMIN | `settings-integrations`, `discord-webhook-config` | — |
| `settings/automations.md` | OWNER/ADMIN | `settings-automations`, `automation-rule-editor` | `## Trigger → Action catalog` |
| `settings/org-general.md` | OWNER | `settings-org-general` | — |
| `settings/org-advanced.md` | OWNER | `settings-org-advanced`, `danger-zone` | `## Danger zone` |

---

### 4.4 `/architecture/`

#### `architecture/overview.md`
- **Sections**: `## High-level diagram`, `## Services at a glance`, `## Data stores`, `## Event bus`, `## Read this next`.
- **Screenshots**: `architecture-diagram` (use existing `docs/assets/architecture.png` — copy to `website/public/images/architecture-diagram.png`).
- **Tables**: service × port × responsibility from README.
- **Length**: long.

#### `architecture/services.md`
- Per service (§6.1), a subsection with: port, primary data store, Kafka topics, main entities, internal HTTP headers trusted.
- **Length**: long.

#### `architecture/data-model.md`
- **Sections**: `## Relational (Postgres)`, `## Documents (MongoDB)`, `## Cache (Redis)`.
- Link to `/docs/_reference/ENTITIES.md` content — copy relevant ER-style tables from that file (do not re-invent).
- **Length**: long.

#### `architecture/auth-flow.md`
- **Sections**: `## Login`, `## Token claims`, `## Gateway validation`, `## Refresh`, `## Stale token invalidation`.
- Use the stale-token flow text from CLAUDE.md memory verbatim (it is the source of truth).
- **Length**: long.

#### `architecture/events.md`
- **Sections**: `## Kafka topology`, `## Topics`, `## Event envelope`, `## Consumer groups`.
- **Topics table**: one row per topic from §6.4.
- **Length**: default.

#### `architecture/realtime.md`
- **Sections**: `## STOMP endpoints`, `## Destinations`, `## Presence`, `## Board updates`, `## Reconnection`.
- **Length**: default.

#### `architecture/multi-tenancy.md`
- **Sections**: `## Cloud (subdomain)`, `## Self-host (single tenant)`, `## Path-based fallback`, `## Data isolation`.
- **Length**: default.

---

### 4.5 `/api/`

#### `api/overview.md`
- **Sections**: `## Base URL`, `## Authentication`, `## Rate limits`, `## Errors`, `## Versioning`.

#### `api/conventions.md`
- **Sections**: `## Request headers`, `## Response envelope`, `## Pagination`, `## Timestamps & timezones`, `## Error codes`.

#### Service API pages (`api/auth.md`, `api/org.md`, `api/board.md`, `api/task.md`, `api/notification.md`, `api/realtime.md`, `api/attachment.md`)
- Per page: one `## <ControllerName>` per controller listed in §6.5.
- Under each controller: `### <METHOD> /path` block with a 4-line body:
  1. One-sentence description.
  2. `**Auth**: required | public`.
  3. `**Roles**: —` or role list.
  4. `**Request**` / `**Response**` code blocks (JSON).
- **Do not** fabricate request/response fields. If unsure, write `<!-- TODO: schema -->`.
- **Length**: long per file.

---

### 4.6 `/contributing/`

#### `contributing/setup.md`
- **Sections**: `## Prerequisites`, `## Clone & bootstrap`, `## Backend dev run`, `## Frontend dev run`, `## IDE setup`.
- Pull commands from existing `CLAUDE.md` §"Commands".

#### `contributing/code-style.md`
- **Sections**: `## Java`, `## TypeScript / React`, `## Naming`, `## Package structure`.
- Reference package layout from CLAUDE.md verbatim.

#### `contributing/testing.md`
- **Sections**: `## Unit tests`, `## Integration tests (Testcontainers)`, `## API tests (REST Assured)`, `## Frontend (Vitest)`, `## Running tests`.

#### `contributing/commits.md`
- **Sections**: `## Conventional Commits`, `## Examples`, `## Scope naming`.
- ⚠️ **Rule**: never mention "Co-Authored-By". Author is human-only.

#### `contributing/pull-requests.md`
- **Sections**: `## Branch naming`, `## PR template`, `## Review checklist`, `## Squash merge policy`.

---

### 4.7 `changelog.md`
- **Sections**: `## v0.1.1-beta-4` (current), `## v0.1.1-beta-2`, `## Older`.
- Pull content from `docs/RELEASE_NOTES_v0.1.1-beta-2.md` and any newer release notes files verbatim under the matching section.

---

## 5. Screenshot manifest

> **Every image here** must be placed at `website/public/images/<filename>.png` (or `.svg` for the logo). Dimensions are **target** — capture the window, then downscale. PNG, 8-bit, compressed (< 300 KB each). Dark-mode and light-mode variants are **NOT** required for v1 — ship light-mode only.

### 5.1 Capture rules

1. **Browser**: Chrome, window 1440 × 900, DevTools closed.
2. **Account**: create a demo org named `Acme` with these fixtures before shooting:
   - Users: `alice@acme.test` (OWNER), `bob@acme.test` (ADMIN), `carol@acme.test` (MEMBER), `dave@acme.test` (VIEWER).
   - Board: `Platform` with columns `Backlog → In Progress → In Review → Done`.
   - Labels: `bug` (red), `feature` (blue), `chore` (gray), `security` (purple).
   - Epics: `Onboarding`, `Billing`, `Mobile app`.
   - Milestones: `Q2 Launch` (due in 6 weeks).
   - Sprint: `Sprint 14` (active, ends in 4 days) with 12 issues, 3 done.
   - Backlog: 20 issues, 5 with estimates.
   - Timeline: 8 issues with start/due dates spanning 2 months, 2 dependency links.
   - At least one issue (`ACME-42`) with: description (markdown + code block), 3 comments (one with a `@mention`), 2 attachments (one image, one PDF), 2 dependencies, 3 time logs, label `feature`.
   - Notifications: 4 unread in inbox (mention, assignment, dependency-blocked, sprint-closed).
3. **No real PII**: redact real emails, names, avatars. Use the fixture users above.
4. **Cursor**: hide OS cursor. If highlighting a control, add a red 2 px rectangle with 60% opacity — do NOT add annotations/text overlays.
5. **Zoom**: 100% browser zoom.
6. **Locale**: English (en-US) for all shots except `language-picker` which must show the Hebrew option visible but not selected, and `theme-toggle` which must show light mode selected.
7. **Empty states**: for pages with an "empty" variant, capture the non-empty one unless the key name ends in `-empty`.

### 5.2 Full screenshot list (62 images)

| Key | File | Page(s) using it | What to capture | Size hint |
|---|---|---|---|---|
| `logo` | `logo.svg` | nav, hero | Bento wordmark + bento icon, transparent bg | SVG |
| `favicon` | `favicon.png` | site | 512 × 512 icon only | 512² |
| `hero-splash` | `hero-splash.png` | introduction | A composed hero: board view with overlay of sprint report — reuse `docs/assets/hero.png` if suitable | 2880 × 1800 |
| `architecture-diagram` | `architecture-diagram.png` | architecture/overview | Copy from `docs/assets/architecture.png` | as-is |
| `board-overview` | `board-overview.png` | overview, introduction | `Platform` board with 4 columns populated, no modal open | 2880 × 1800 |
| `first-run-terminal` | `first-run-terminal.png` | quickstart | Terminal showing `docker compose … up -d` success + `docker ps` listing containers | 2880 × 1800 |
| `create-org-form` | `create-org-form.png` | quickstart, orgs/create | `/org/new` with all fields filled for `Acme` | 2880 × 1800 |
| `org-just-created` | `org-just-created.png` | orgs/create | Post-create landing, "Create your first board" CTA visible | 2880 × 1800 |
| `empty-board` | `empty-board.png` | quickstart, boards/create | Brand-new board, 4 default columns, no cards | 2880 × 1800 |
| `register-form` | `register-form.png` | accounts/register | Register page, all fields valid | 2880 × 1800 |
| `register-success` | `register-success.png` | accounts/register | "Check your email" page post-register | 2880 × 1800 |
| `verify-email-sent` | `verify-email-sent.png` | accounts/verify-email | CheckEmailPage with user's email masked | 2880 × 1800 |
| `verify-email-success` | `verify-email-success.png` | accounts/verify-email | VerifyEmailPage with success confirmation | 2880 × 1800 |
| `login-form` | `login-form.png` | accounts/login | Login form, email filled, password masked | 2880 × 1800 |
| `forgot-password-form` | `forgot-password-form.png` | accounts/forgot-password | Forgot-password email entry | 2880 × 1800 |
| `reset-password-form` | `reset-password-form.png` | accounts/forgot-password | Reset-password with two valid fields | 2880 × 1800 |
| `profile-page` | `profile-page.png` | accounts/profile | Settings → Profile, avatar uploaded, all fields filled | 2880 × 1800 |
| `members-page` | `members-page.png` | orgs/invite-members, settings/members | Members list, 4 rows, mix of roles | 2880 × 1800 |
| `invite-modal` | `invite-modal.png` | orgs/invite-members | Invite dialog with 2 emails entered, role = MEMBER | 1200 × 900 |
| `invite-email-preview` | `invite-email-preview.png` | orgs/invite-members | MailHog rendering of the invite email | 2880 × 1800 |
| `role-dropdown` | `role-dropdown.png` | orgs/roles | Role dropdown open on Bob's row | 1200 × 900 |
| `org-switcher` | `org-switcher.png` | orgs/switch-org | Top-left org switcher popover open, 3 orgs listed | 1200 × 900 |
| `create-board-modal` | `create-board-modal.png` | boards/create | "New board" modal, name filled | 1200 × 900 |
| `board-columns-edit` | `board-columns-edit.png` | boards/columns | Column settings panel with WIP limit set | 2880 × 1800 |
| `board-columns-reorder` | `board-columns-reorder.png` | boards/columns | Mid-drag of a column | 2880 × 1800 |
| `labels-settings` | `labels-settings.png` | boards/labels, settings/labels | Labels management page, 4 labels | 2880 × 1800 |
| `label-picker` | `label-picker.png` | boards/labels | Label picker popover on an issue | 1200 × 900 |
| `board-permissions` | `board-permissions.png` | boards/permissions | Board permissions tab | 2880 × 1800 |
| `create-issue-modal` | `create-issue-modal.png` | issues/create | Full-create modal, all fields filled, Markdown preview on | 1600 × 1100 |
| `issue-quick-add` | `issue-quick-add.png` | issues/create | Quick-add inline form at column bottom | 1200 × 600 |
| `issue-detail` | `issue-detail.png` | issues/edit | Issue detail view for `ACME-42` | 2880 × 1800 |
| `issue-edit-inline` | `issue-edit-inline.png` | issues/edit | Inline edit of title | 2880 × 1800 |
| `issue-assignee-picker` | `issue-assignee-picker.png` | issues/assign | Assignee popover with 4 users | 800 × 800 |
| `issue-estimate-picker` | `issue-estimate-picker.png` | issues/assign | Story-points picker (Fibonacci) | 800 × 800 |
| `issue-comments` | `issue-comments.png` | issues/comments | Comments tab on `ACME-42` with 3 comments | 2880 × 1800 |
| `mention-autocomplete` | `mention-autocomplete.png` | issues/comments | `@a` typed in comment box, autocomplete showing 2 users | 1200 × 900 |
| `issue-attachments` | `issue-attachments.png` | issues/attachments | Attachments tab with image thumb + PDF row | 2880 × 1800 |
| `attachment-upload-progress` | `attachment-upload-progress.png` | issues/attachments | Mid-upload progress bar | 1200 × 900 |
| `dependency-add-dialog` | `dependency-add-dialog.png` | issues/dependencies | "Add dependency" dialog, type = "blocks" | 1200 × 900 |
| `dependency-graph` | `dependency-graph.png` | issues/dependencies | Dependency graph widget on issue detail | 2880 × 1800 |
| `time-log-modal` | `time-log-modal.png` | issues/time-tracking | Log-time dialog, `2h 30m` + description | 1200 × 900 |
| `time-log-list` | `time-log-list.png` | issues/time-tracking | Time logs list on issue, 3 entries | 2880 × 1800 |
| `my-issues-page` | `my-issues-page.png` | issues/my-issues | MyIssuesPage with 6 issues assigned to Alice | 2880 × 1800 |
| `sprints-list` | `sprints-list.png` | sprints/overview | Sprints page: 1 active, 1 planned, 2 closed | 2880 × 1800 |
| `sprint-planning` | `sprint-planning.png` | sprints/plan | Planning view, backlog on left, sprint bucket on right | 2880 × 1800 |
| `sprint-capacity` | `sprint-capacity.png` | sprints/plan | Capacity indicator at 80% | 2880 × 1800 |
| `start-sprint-modal` | `start-sprint-modal.png` | sprints/start | Start-sprint dialog, duration = 2 weeks | 1200 × 900 |
| `sprint-active` | `sprint-active.png` | sprints/start | Board view, sprint banner showing "4 days left" | 2880 × 1800 |
| `close-sprint-modal` | `close-sprint-modal.png` | sprints/close | Close-sprint dialog showing 2 unfinished issues with carry-over options | 1200 × 900 |
| `sprint-report` | `sprint-report.png` | sprints/close, analytics/reports | Sprint report: burndown + summary numbers | 2880 × 1800 |
| `backlog-page` | `backlog-page.png` | backlog | Backlog with sprint sections collapsed | 2880 × 1800 |
| `backlog-drag-to-sprint` | `backlog-drag-to-sprint.png` | backlog | Mid-drag of issue from backlog into sprint | 2880 × 1800 |
| `timeline-gantt` | `timeline-gantt.png` | timeline | Gantt with 8 bars and 2 dependency arrows, month zoom | 2880 × 1800 |
| `timeline-dependency-drag` | `timeline-dependency-drag.png` | timeline | Mid-drag creating a dependency arrow | 2880 × 1800 |
| `global-timeline` | `global-timeline.png` | global-timeline | Cross-board timeline | 2880 × 1800 |
| `calendar-page` | `calendar-page.png` | calendar | Month view with issues on due dates | 2880 × 1800 |
| `inbox-page` | `inbox-page.png` | inbox | Inbox with 4 unread, 3 read notifications | 2880 × 1800 |
| `inbox-notification-row` | `inbox-notification-row.png` | inbox | Hover state on one notification row | 1600 × 400 |
| `reports-burndown` | `reports-burndown.png` | analytics/reports | Burndown chart for Sprint 14 | 2880 × 1800 |
| `reports-velocity` | `reports-velocity.png` | analytics/reports | Velocity chart across 5 sprints | 2880 × 1800 |
| `reports-cycle-time` | `reports-cycle-time.png` | analytics/reports | Cycle-time scatter | 2880 × 1800 |
| `time-tracking-analytics` | `time-tracking-analytics.png` | analytics/time-tracking | Team hours by assignee chart | 2880 × 1800 |
| `settings-profile` | `settings-profile.png` | settings/profile | same as `profile-page` but can be re-captured from Settings route | 2880 × 1800 |
| `settings-security` | `settings-security.png` | settings/security | Security page (sessions list + password section) | 2880 × 1800 |
| `change-password-form` | `change-password-form.png` | settings/security | Change-password form, all fields valid | 1200 × 900 |
| `settings-preferences` | `settings-preferences.png` | settings/preferences | Preferences with locale = English, theme = Light | 2880 × 1800 |
| `language-picker` | `language-picker.png` | settings/preferences | Dropdown open showing English + Hebrew + (other) | 800 × 800 |
| `theme-toggle` | `theme-toggle.png` | settings/preferences | Theme radio group: Light / Dark / System, Light selected | 800 × 600 |
| `settings-members` | `settings-members.png` | settings/members | same as `members-page` accessed via Settings | 2880 × 1800 |
| `settings-labels` | `settings-labels.png` | settings/labels | same as `labels-settings` accessed via Settings | 2880 × 1800 |
| `settings-integrations` | `settings-integrations.png` | settings/integrations | Integrations index with Discord + Slack cards | 2880 × 1800 |
| `discord-webhook-config` | `discord-webhook-config.png` | settings/integrations | Discord integration config form filled | 2880 × 1800 |
| `settings-automations` | `settings-automations.png` | settings/automations | Automations list with 3 rules | 2880 × 1800 |
| `automation-rule-editor` | `automation-rule-editor.png` | settings/automations | Rule editor: trigger + action chosen | 2880 × 1800 |
| `settings-org-general` | `settings-org-general.png` | settings/org-general | Org general settings (name, slug, logo) | 2880 × 1800 |
| `settings-org-advanced` | `settings-org-advanced.png` | settings/org-advanced | Advanced settings (data export, retention) | 2880 × 1800 |
| `danger-zone` | `danger-zone.png` | settings/org-advanced | Delete-org confirmation dialog | 1200 × 900 |
| `minio-console` | `minio-console.png` | self-host/storage-minio | MinIO console at `:9001`, buckets listed | 2880 × 1800 |
| `minio-bucket` | `minio-bucket.png` | self-host/storage-minio | Bucket contents after uploading one attachment | 2880 × 1800 |

### 5.3 Non-screenshot assets to prepare

- `logo.svg` — copy from `docs/assets/logo_dark.svg` (rename).
- `favicon.png` — generate 512 × 512 from the logo.
- `architecture-diagram.png` — copy from `docs/assets/architecture.png`.

---

## 6. Factual anchors (single source of truth)

> The author model MUST treat this section as canonical. If a page needs a fact that is missing here, write `<!-- TODO: confirm -->`, never invent.

### 6.1 Services & ports

| Service | Port | Primary store | Kafka topics (produces) |
|---|---|---|---|
| api-gateway | 8080 | — | (consumes only) |
| auth-service | 8081 | PostgreSQL + Redis | `bento.user.events` |
| org-service | 8082 | PostgreSQL + Redis | `bento.org.events` |
| board-service | 8083 | PostgreSQL + Redis | `bento.board.events` |
| task-service | 8084 | MongoDB + Redis | `bento.task.events` |
| notification-service | 8085 | MongoDB + Redis | — |
| realtime-service | 8086 | Redis | — |
| attachment-service | 8087 | MinIO + Postgres | `bento.attachment.events` |

### 6.2 Role matrix

| Action | OWNER | ADMIN | MEMBER | VIEWER |
|---|---|---|---|---|
| Create board | ✅ | ✅ | ❌ | ❌ |
| Edit board settings | ✅ | ✅ | ❌ | ❌ |
| Delete board | ✅ | ✅ | ❌ | ❌ |
| Manage labels | ✅ | ✅ | ✅ | ❌ |
| Create / edit issue | ✅ | ✅ | ✅ | ❌ |
| Comment on issue | ✅ | ✅ | ✅ | ❌ |
| Plan / start / close sprint | ✅ | ✅ | ❌ | ❌ |
| Invite members | ✅ | ✅ | ❌ | ❌ |
| Change member role | ✅ | (can't touch OWNER) | ❌ | ❌ |
| Transfer ownership | ✅ | ❌ | ❌ | ❌ |
| Delete org | ✅ | ❌ | ❌ | ❌ |

<!-- TODO: confirm VIEWER comment permissions -->

### 6.3 Environment variables

Minimum set (pulled from `README.md`). Do not invent new ones.

| Name | Required | Default | Description |
|---|---|---|---|
| `JWT_SECRET` | yes | — | Signs auth tokens |
| `GATEWAY_INTERNAL_SECRET` | yes | — | Shared secret gateway ↔ services |
| `AUTH_PEPPER` | yes | — | Extra entropy for password hashes |
| `POSTGRES_PASSWORD` | yes | — | Postgres password |
| `MONGO_PASSWORD` | yes | — | Mongo password |
| `MINIO_ROOT_PASSWORD` | yes | — | MinIO root password |
| `FRONTEND_URL` | yes | — | Public URL used in email links |
| `MAIL_FROM` | yes | — | From address on emails |

Additional vars referenced in compose file → the author model must open `docker-compose.beta.yml` and list any additional env vars it declares. If they are present there they are allowed; otherwise `<!-- TODO -->`.

### 6.4 Kafka topics

| Topic | Producer | Example events |
|---|---|---|
| `bento.user.events` | auth-service | `EmailVerificationRequestedEvent`, `PasswordResetRequestedEvent`, `UserRegisteredEvent` |
| `bento.org.events` | org-service | `MemberRemovedEvent`, `MemberRoleChangedEvent`, `InvitationCreatedEvent` |
| `bento.board.events` | board-service | `BoardCreatedEvent`, `LabelCreatedEvent` |
| `bento.task.events` | task-service | `IssueCreatedEvent`, `IssueUpdatedEvent`, `CommentCreatedEvent`, `SprintClosedEvent` |
| `bento.attachment.events` | attachment-service | `AttachmentUploadedEvent` |

<!-- TODO: confirm complete event list from source -->

### 6.5 Controllers (for API reference pages)

- `auth-service`: `AuthController`, `UserController`.
- `org-service`: `OrgController`, `MemberController`, `InvitationController`, `OrgPermissionController`, `InternalOrgController`.
- `board-service`: `BoardController`, `BoardColumnController`, `BoardMemberController`, `BoardPermissionController`, `LabelController`, `InternalBoardController`.
- `task-service`: `IssueController`, `EpicController`, `MilestoneController`, `SprintController`, `InternalSprintController`, `CommentController`, `ActivityController`, `IssueRelationController`, `SavedFilterController`, `TimeLogController`.
- `notification-service`, `realtime-service`, `attachment-service`: author model must open the service folder, list controller files, and use only those names.

### 6.6 Auth endpoints (public, confirmed from CLAUDE.md memory)

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/verify-email?token=<token>`
- `POST /api/auth/resend-verification`  `{ email }`
- `POST /api/auth/forgot-password`  `{ email }`
- `POST /api/auth/reset-password`  `{ token, newPassword }`

### 6.7 Frontend routes (confirmed from `frontend/src/pages`)

Auth: `/register`, `/check-email`, `/verify-email`, `/login`, `/forgot-password`, `/reset-password`, `/invite/accept`.
App: `/`, `/board/:id`, `/board/:id/backlog`, `/board/:id/sprints`, `/board/:id/summary`, `/board/:id/timeline`, `/boards`, `/my-issues`, `/calendar`, `/inbox`, `/timeline` (global), `/planning/roadmap`, `/planning/sprints`, `/planning/workload`, `/analytics/reports`, `/analytics/time-tracking`, `/org/new`, `/settings/profile`, `/settings/security`, `/settings/preferences`, `/settings/members`, `/settings/labels`, `/settings/integrations`, `/settings/automations`, `/settings/org-general`, `/settings/org-advanced`.

### 6.8 UI strings — use only these verbatim

The author model must **not** guess button/menu labels. Use functional descriptions unless the label is listed here:

- Nav: "Board", "Backlog", "Sprints", "Timeline", "Summary", "Inbox", "My Issues", "Calendar", "Settings".
- Buttons: "Create", "Save", "Cancel", "Delete", "Invite", "Start sprint", "Close sprint".

Anything else → describe by function.

---

## 7. Authoring workflow for the model (step-by-step)

Execute in this order. Do not skip.

1. **Read this plan in full.**
2. **Create the directory tree** from §2 (empty files are fine at first).
3. **Write `website/.vitepress/config.ts`** using §1 + §3. Compile-check mentally — if a sidebar link has no matching file, the config is wrong.
4. **Write `website/package.json`** per §1.
5. **Write `index.md`** using §4.0.
6. **Write `/guide/*` (4 files)** — these set the tone; other pages follow their style.
7. **Write `/self-host/*` (12 files)** — order listed in §3.2.
8. **Write `/user-guide/*` (40 files)** — iterate through the table in §4.3 top to bottom. For each:
   - Start with the standard paragraph + `## Who can do this` (from §6.2).
   - Add page-specific extra sections from the table.
   - Reference the exact screenshot keys listed (no others).
9. **Write `/architecture/*` (7 files)**.
10. **Write `/api/*` (9 files)**. For service pages, open the corresponding `backend/<service>/.../controller/*.java` to list handler signatures. If you cannot infer the request/response DTO, write `<!-- TODO: schema -->`.
11. **Write `/contributing/*` (5 files)**.
12. **Write `changelog.md`** from existing release-notes files.
13. **Self-verify** (produce a report at the end — see §9):
    - Every file in §2 exists.
    - Every `config.ts` sidebar link resolves to a file.
    - Every `![](...)` in the corpus points to a filename listed in §5.2.
    - No file violates §0 rules 1–12.
14. **Do NOT run `npm install` or `vitepress build`** — that's the maintainer's job. Just write files.

---

## 8. Screenshot capture workflow (for the human)

Hand this checklist to whoever is taking screenshots.

1. Spin up the demo fixture (see §5.1 point 2).
2. Set browser to 1440 × 900, 100% zoom, light theme.
3. Walk through the app in this order and capture in this sequence:
   - **Onboarding pass**: `register-form` → `register-success` → `verify-email-sent` → `verify-email-success` → `login-form` → `forgot-password-form` → `reset-password-form`.
   - **Org pass**: `create-org-form` → `org-just-created` → `org-switcher`.
   - **Members pass**: `members-page` → `invite-modal` → `invite-email-preview` (from MailHog) → `role-dropdown`.
   - **Board pass**: `empty-board` → `board-overview` → `create-board-modal` → `board-columns-edit` → `board-columns-reorder` → `labels-settings` → `label-picker` → `board-permissions`.
   - **Issue pass** (on `ACME-42`): `create-issue-modal` → `issue-quick-add` → `issue-detail` → `issue-edit-inline` → `issue-assignee-picker` → `issue-estimate-picker` → `issue-comments` → `mention-autocomplete` → `issue-attachments` → `attachment-upload-progress` → `dependency-add-dialog` → `dependency-graph` → `time-log-modal` → `time-log-list` → `my-issues-page`.
   - **Sprint pass**: `sprints-list` → `sprint-planning` → `sprint-capacity` → `start-sprint-modal` → `sprint-active` → `close-sprint-modal` → `sprint-report`.
   - **Views pass**: `backlog-page` → `backlog-drag-to-sprint` → `timeline-gantt` → `timeline-dependency-drag` → `global-timeline` → `calendar-page` → `inbox-page` → `inbox-notification-row`.
   - **Analytics pass**: `reports-burndown` → `reports-velocity` → `reports-cycle-time` → `time-tracking-analytics`.
   - **Settings pass**: `settings-profile` → `settings-security` → `change-password-form` → `settings-preferences` → `language-picker` → `theme-toggle` → `settings-members` → `settings-labels` → `settings-integrations` → `discord-webhook-config` → `settings-automations` → `automation-rule-editor` → `settings-org-general` → `settings-org-advanced` → `danger-zone`.
   - **Ops pass**: `first-run-terminal` (terminal screenshot) → `minio-console` → `minio-bucket`.
   - **Assets**: `logo.svg`, `favicon.png`, `architecture-diagram.png`, `hero-splash.png`.
4. Save each as `<key>.png` into `website/public/images/`.
5. Run `pngquant --quality 65-85 --ext .png --force website/public/images/*.png` to compress.
6. Commit in a single commit: `docs: add vitepress screenshots`.

---

## 9. Final self-check report (the author model must output this at the end)

After writing every file, the model must append a single fenced-code block named `CHECK` to its final message containing:

```
FILES_EXPECTED: <count from §2>
FILES_WRITTEN:  <actual>
TODOS:          <count of "<!-- TODO -->" across the corpus>
BROKEN_LINKS:   <count of relative md links with no matching file>
MISSING_IMAGES: <count of image refs whose key is NOT in §5.2>
```

Any non-zero `BROKEN_LINKS` or `MISSING_IMAGES` blocks ship — the model must fix before reporting done.

---

## 10. What the author model must NOT do

- Do not create `README.md` inside `website/`.
- Do not create aggregator pages like `user-guide/issues/index.md` (VitePress uses sidebars instead).
- Do not embed Vue components, custom layouts, or scripts.
- Do not write marketing copy, testimonials, pricing, or a roadmap.
- Do not add `Last updated by …` or `Author: …` lines.
- Do not mention Claude, AI, or code generation anywhere.
- Do not include "Co-Authored-By" trailers in any example commit.
- Do not translate any page. English only in v1.

---

**End of plan.** The author model should now execute §7 top to bottom.
