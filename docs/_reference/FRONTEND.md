# Bento — Frontend Guide

Tech stack, project structure, design system, and conventions for the Bento frontend.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Design System](#design-system)
- [Branding & Logo](#branding--logo)
- [API Integration](#api-integration)
- [State Management](#state-management)
- [Routing](#routing)
- [Key Conventions](#key-conventions)

---

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| React | 19 | UI framework |
| Vite | 6 | Build tool |
| TypeScript | 5 | Type safety |
| TailwindCSS | 4 | Styling |
| React Query (`@tanstack/react-query`) | 5 | Server state, caching, mutations |
| Zustand | 5 | Client-side global state |
| React Router | 7 | Routing |
| Axios | 1.7 | HTTP client |
| React Hook Form + Zod | 7 + 3 | Forms and validation |
| @dnd-kit | 6 | Drag and drop (Kanban board) |
| Tiptap | 2 | Rich text editor (issue descriptions, comments) |
| Framer Motion | 12 | Animations |
| Lucide React | latest | Icons |
| Radix UI | latest | Accessible headless primitives |
| Recharts | 2 | Charts (sprint burndown, velocity) |
| date-fns | 4 | Date formatting and math |
| Sonner | 1 | Toast notifications |
| clsx + tailwind-merge | latest | Conditional class merging |

---

## Project Structure

```
frontend/
├── public/
│   ├── logo.svg
│   └── favicon.ico
├── src/
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Root component, providers
│   │
│   ├── api/                        # API layer
│   │   ├── client.ts               # Axios instance, interceptors
│   │   ├── auth.ts                 # Auth endpoints + React Query hooks
│   │   ├── orgs.ts                 # Org endpoints + hooks
│   │   ├── boards.ts               # Board endpoints + hooks
│   │   ├── issues.ts               # Issue endpoints + hooks
│   │   ├── sprints.ts              # Sprint endpoints + hooks
│   │   └── queryKeys.ts            # Centralized query key factory
│   │
│   ├── stores/                     # Zustand stores (client state only)
│   │   ├── authStore.ts            # accessToken, user, orgId, orgRole
│   │   ├── boardStore.ts           # Active board, columns cache
│   │   └── uiStore.ts              # Sidebar open, active modal, etc.
│   │
│   ├── components/
│   │   ├── ui/                     # Primitive components (design system)
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── Card.tsx
│   │   │
│   │   ├── layout/                 # App shell
│   │   │   ├── AppLayout.tsx       # Sidebar + main content wrapper
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── PageHeader.tsx
│   │   │
│   │   ├── board/                  # Board-specific
│   │   │   ├── BoardCard.tsx       # Board in list view
│   │   │   ├── KanbanBoard.tsx     # Full board with columns
│   │   │   ├── KanbanColumn.tsx    # Single column with drop zone
│   │   │   └── BoardSettings.tsx
│   │   │
│   │   ├── issue/                  # Issue-specific
│   │   │   ├── IssueCard.tsx       # Issue in Kanban column
│   │   │   ├── IssueDetail.tsx     # Full issue drawer/modal
│   │   │   ├── IssueForm.tsx       # Create / edit form
│   │   │   ├── IssueFilters.tsx    # Filter bar
│   │   │   ├── IssuePriorityIcon.tsx
│   │   │   ├── IssueTypeIcon.tsx
│   │   │   └── Checklist.tsx
│   │   │
│   │   ├── sprint/
│   │   │   ├── SprintCard.tsx
│   │   │   ├── SprintProgress.tsx  # Points / issue count bar
│   │   │   ├── BurndownChart.tsx
│   │   │   └── SprintCompleteModal.tsx
│   │   │
│   │   └── common/
│   │       ├── RichTextEditor.tsx  # Tiptap wrapper
│   │       ├── UserAvatar.tsx
│   │       ├── MemberPicker.tsx
│   │       ├── LabelPicker.tsx
│   │       ├── DatePicker.tsx
│   │       └── EmptyState.tsx
│   │
│   ├── pages/                      # Route-level page components
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   └── ResetPasswordPage.tsx
│   │   ├── org/
│   │   │   ├── OrgSelectPage.tsx   # Pick org after login
│   │   │   └── OrgSettingsPage.tsx
│   │   ├── board/
│   │   │   ├── BoardListPage.tsx
│   │   │   ├── BoardPage.tsx       # Kanban / Scrum board view
│   │   │   └── BoardSettingsPage.tsx
│   │   ├── backlog/
│   │   │   └── BacklogPage.tsx     # Sprint backlog view
│   │   ├── sprint/
│   │   │   └── SprintPage.tsx
│   │   └── settings/
│   │       ├── ProfilePage.tsx
│   │       └── MembersPage.tsx
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useAuth.ts              # Auth state helpers
│   │   ├── useCurrentOrg.ts        # Current org from store
│   │   ├── useBoard.ts             # Board + column access
│   │   └── useDebounce.ts
│   │
│   ├── types/                      # TypeScript types (mirror API shapes)
│   │   ├── auth.ts
│   │   ├── org.ts
│   │   ├── board.ts
│   │   ├── issue.ts
│   │   └── sprint.ts
│   │
│   └── utils/
│       ├── cn.ts                   # clsx + tailwind-merge helper
│       ├── formatDate.ts
│       ├── issueKey.ts             # Format / parse issue keys
│       └── api.ts                  # API error helpers
│
├── index.html
├── vite.config.ts
├── tailwind.config.ts              # TailwindCSS 4 config
├── tsconfig.json
└── package.json
```

---

## Design System

### Brand Colors

```ts
// tailwind.config.ts / CSS variables
const colors = {
  primary: {
    DEFAULT: '#5B47E0',   // Indigo-violet — buttons, links, active states
    light:   '#7C6CEA',   // Hover state
    dark:    '#4333C4',   // Active/pressed
    subtle:  '#EEF0FF',   // Backgrounds, badges
  },
  accent: {
    DEFAULT: '#F59E0B',   // Amber — highlights, warnings, "in progress"
    light:   '#FCD34D',
    subtle:  '#FFFBEB',
  },
  surface: {
    DEFAULT: '#FFFFFF',
    muted:   '#F8F8FA',   // Page backgrounds, sidebars
    border:  '#E4E4E7',   // Dividers, card borders
  },
  text: {
    primary:   '#0F0F10',  // Headings, body
    secondary: '#71717A',  // Subtitles, metadata
    muted:     '#A1A1AA',  // Placeholders, disabled
    inverse:   '#FFFFFF',  // Text on dark backgrounds
  },
}
```

### Dark Mode Equivalents

```ts
const darkColors = {
  primary: {
    DEFAULT: '#7C6CEA',
    subtle:  '#1E1B3A',
  },
  surface: {
    DEFAULT: '#111113',
    muted:   '#18181B',
    border:  '#27272A',
  },
  text: {
    primary:   '#FAFAFA',
    secondary: '#A1A1AA',
    muted:     '#52525B',
  },
}
```

### Priority Colors

```ts
const priority = {
  CRITICAL: '#EF4444',  // red-500
  HIGH:     '#F97316',  // orange-500
  MEDIUM:   '#F59E0B',  // amber-500
  LOW:      '#6B7280',  // gray-500
}
```

### Issue Type Colors

```ts
const issueType = {
  EPIC:    '#8B5CF6',   // violet
  STORY:   '#3B82F6',   // blue
  TASK:    '#10B981',   // emerald
  BUG:     '#EF4444',   // red
  SUBTASK: '#6B7280',   // gray
}
```

### Sprint Status Colors

```ts
const sprintStatus = {
  PLANNED:   '#6B7280',  // gray
  ACTIVE:    '#5B47E0',  // primary
  COMPLETED: '#10B981',  // green
}
```

---

### Typography

```ts
// Font: Inter (variable font from Google Fonts / Fontsource)
const typography = {
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  sizes: {
    xs:   '0.75rem',   // 12px — timestamps, badges
    sm:   '0.875rem',  // 14px — body, metadata
    base: '1rem',      // 16px — default
    lg:   '1.125rem',  // 18px — subheadings
    xl:   '1.25rem',   // 20px — section headings
    '2xl': '1.5rem',   // 24px — page titles
    '3xl': '1.875rem', // 30px — hero text
  },
  weights: {
    normal:   400,
    medium:   500,
    semibold: 600,
    bold:     700,
  },
}
```

### Spacing & Border Radius

```ts
const design = {
  radius: {
    sm:  '6px',    // inputs, small badges
    md:  '8px',    // cards, buttons
    lg:  '12px',   // modals, panels
    xl:  '16px',   // large cards
    full: '9999px', // pills, avatars
  },
  shadow: {
    sm:  '0 1px 2px rgba(0,0,0,0.05)',
    md:  '0 4px 6px rgba(0,0,0,0.07)',
    lg:  '0 10px 15px rgba(0,0,0,0.10)',
    xl:  '0 20px 25px rgba(0,0,0,0.12)',
  },
}
```

---

## Branding & Logo

### Concept
The logo is inspired by a **bento box viewed from above** — organized compartments representing structured project management. Four asymmetric rectangles with rounded corners in a 2×2-ish grid.

```
┌──────┐ ┌──────────┐
│      │ │          │
└──────┘ └──────────┘

┌────────┐ ┌──────┐
│        │ │      │
└────────┘ └──────┘
```

- **Top-left:** Primary color `#5B47E0` — issues
- **Top-right:** Primary 75% opacity — sprints
- **Bottom-left:** Primary 50% opacity — boards
- **Bottom-right:** Accent amber `#F59E0B` — highlights

Files:
- `docs/assets/logo.svg` — icon mark only (48×48)
- `docs/assets/logo-full.svg` — icon + wordmark (160×48)

### Wordmark
- Font: **Inter Bold**
- Text: `bento` (lowercase)
- Letter spacing: `-0.5px`
- Color: `#0F0F10` (dark) / `#FAFAFA` (light)

---

## API Integration

### Axios Client (`src/api/client.ts`)

```ts
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
})

// Attach access token to every request
client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle stale/expired token → auto-refresh
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        await useAuthStore.getState().refresh() // calls POST /api/auth/refresh
        return client(original)                 // retry original request
      } catch {
        useAuthStore.getState().logout()
      }
    }
    return Promise.reject(error)
  }
)

export default client
```

### Query Key Factory (`src/api/queryKeys.ts`)

```ts
export const queryKeys = {
  auth: {
    me: () => ['auth', 'me'],
  },
  orgs: {
    all:    ()          => ['orgs'],
    detail: (id: string) => ['orgs', id],
    members:(id: string) => ['orgs', id, 'members'],
  },
  boards: {
    all:     (orgId: string)              => ['boards', orgId],
    detail:  (boardId: string)            => ['boards', boardId],
    columns: (boardId: string)            => ['boards', boardId, 'columns'],
    members: (boardId: string)            => ['boards', boardId, 'members'],
    labels:  (boardId: string)            => ['boards', boardId, 'labels'],
  },
  issues: {
    list:       (boardId: string, page?: number) => ['issues', boardId, page],
    detail:     (issueId: string)                => ['issues', 'detail', issueId],
    comments:   (issueId: string)                => ['issues', issueId, 'comments'],
    timelogs:   (issueId: string)                => ['issues', issueId, 'timelogs'],
    relations:  (issueId: string)                => ['issues', issueId, 'relations'],
    activities: (issueId: string)                => ['issues', issueId, 'activities'],
    filters:    (boardId: string)                => ['issues', 'filters', boardId],
  },
  sprints: {
    all:    (boardId: string)   => ['sprints', boardId],
    detail: (sprintId: string)  => ['sprints', sprintId],
  },
}
```

---

## State Management

### What goes where

| State | Store |
|-------|-------|
| `accessToken`, `user`, `currentOrgId`, `orgRole` | `authStore` (Zustand) |
| Active board columns (for `issueKey` generation, column names) | `boardStore` (Zustand) |
| Server data (issues, sprints, orgs, boards) | React Query cache |
| UI state (sidebar open, active modal, filters) | `uiStore` (Zustand) |

### Auth Store (`src/stores/authStore.ts`)

```ts
interface AuthStore {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  currentOrgId: string | null
  orgRole: string | null
  orgSlug: string | null

  setTokens: (access: string, refresh: string) => void
  setUser:   (user: User) => void
  refresh:   () => Promise<void>
  logout:    () => void
}
```

Persist `refreshToken` to `localStorage` — `accessToken` stays in memory only (security).

### Board Store (`src/stores/boardStore.ts`)

```ts
interface BoardStore {
  activeBoardId: string | null
  columns: BoardColumn[]          // cached so IssueCard can look up column name
  setActiveBoard: (boardId: string, columns: BoardColumn[]) => void
}
```

> `columns` is cached here so issue cards can display column names without extra API calls. Updated whenever `GET /api/boards/{boardId}` resolves.

---

## Routing

```
/                         → redirect to /boards or /login
/login                    → LoginPage
/register                 → RegisterPage
/reset-password           → ResetPasswordPage
/org                      → OrgSelectPage (pick org after login)
/boards                   → BoardListPage
/boards/:boardId          → BoardPage (Kanban/Scrum view)
/boards/:boardId/backlog  → BacklogPage (sprint backlog)
/boards/:boardId/settings → BoardSettingsPage
/settings/profile         → ProfilePage
/settings/members         → MembersPage
/settings/org             → OrgSettingsPage
```

Issue detail opens as a **side panel / drawer** on top of the board page (`/boards/:boardId?issue=TF-42`), not a separate route — keeps the board visible behind it.

---

## Key Conventions

### Component structure
```tsx
// components/ui/Button.tsx
import { cn } from '@/utils/cn'
import { forwardRef } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-md transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-primary text-white hover:bg-primary-light': variant === 'primary',
            'bg-surface border border-surface-border hover:bg-surface-muted': variant === 'secondary',
            'hover:bg-surface-muted': variant === 'ghost',
            'bg-red-500 text-white hover:bg-red-600': variant === 'danger',
            'h-7 px-2 text-xs': size === 'sm',
            'h-9 px-3 text-sm': size === 'md',
            'h-11 px-4 text-base': size === 'lg',
          },
          className
        )}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? <Spinner className="mr-2 h-4 w-4" /> : null}
        {children}
      </button>
    )
  }
)
```

### `cn` utility (`src/utils/cn.ts`)
```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### API hook pattern
```ts
// src/api/issues.ts
export function useIssues(boardId: string, page = 0) {
  return useQuery({
    queryKey: queryKeys.issues.list(boardId, page),
    queryFn: () => client.get(`/api/issues?boardId=${boardId}&page=${page}`).then(r => r.data),
    enabled: !!boardId,
  })
}

export function useCreateIssue() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateIssueRequest) =>
      client.post('/api/issues', data).then(r => r.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.list(variables.boardId) })
    },
  })
}
```

### Environment variables (`.env.local`)
```env
VITE_API_URL=http://localhost:8080
```

---

## Internationalization (i18n) & RTL

The app supports multiple languages including **Hebrew (RTL)**, English (LTR), and others. The entire UI must be direction-aware.

### Libraries

| Library | Purpose |
|---------|---------|
| `react-i18next` | React bindings for i18n |
| `i18next` | Core i18n engine |
| `i18next-browser-languagedetector` | Auto-detect browser language |
| `i18next-http-backend` | Lazy-load translation files |

Add to package.json:
```json
"i18next": "^24.0.0",
"react-i18next": "^15.0.0",
"i18next-browser-languagedetector": "^8.0.0",
"i18next-http-backend": "^3.0.0"
```

### Translation file structure

```
public/
└── locales/
    ├── en/
    │   ├── common.json      # shared: buttons, labels, errors
    │   ├── board.json
    │   ├── issue.json
    │   └── sprint.json
    └── he/
        ├── common.json
        ├── board.json
        ├── issue.json
        └── sprint.json
```

### i18n setup (`src/lib/i18n.ts`)

```ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import Backend from 'i18next-http-backend'

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'he'],
    defaultNS: 'common',
    backend: { loadPath: '/locales/{{lng}}/{{ns}}.json' },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  })

export default i18n
```

### Direction management (`src/App.tsx`)

```tsx
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'

const RTL_LANGUAGES = ['he', 'ar', 'fa', 'ur']

export function App() {
  const { i18n } = useTranslation()

  useEffect(() => {
    const dir = RTL_LANGUAGES.includes(i18n.language) ? 'rtl' : 'ltr'
    document.documentElement.setAttribute('dir', dir)
    document.documentElement.setAttribute('lang', i18n.language)
  }, [i18n.language])

  // ...
}
```

### Language sync with backend

The user's `locale` field is stored in the backend (`User.locale`). On login:
```ts
// After login, sync i18n with user's saved locale
const { user } = await login(credentials)
if (user.locale && user.locale !== i18n.language) {
  i18n.changeLanguage(user.locale)
}
```

On language change, persist to backend:
```ts
const { mutate: updateProfile } = useUpdateProfile()

const changeLanguage = (lang: string) => {
  i18n.changeLanguage(lang)
  updateProfile({ locale: lang }) // PATCH /api/users/me
}
```

### RTL-safe CSS rules

**Always use CSS logical properties.** Never use physical `left`/`right` for layout.

| ❌ Physical (breaks RTL) | ✅ Logical (RTL-safe) |
|--------------------------|----------------------|
| `ml-4` | `ms-4` (margin-inline-start) |
| `mr-4` | `me-4` (margin-inline-end) |
| `pl-4` | `ps-4` (padding-inline-start) |
| `pr-4` | `pe-4` (padding-inline-end) |
| `left-0` | `start-0` |
| `right-0` | `end-0` |
| `text-left` | `text-start` |
| `text-right` | `text-end` |
| `rounded-l-md` | `rounded-s-md` |
| `rounded-r-md` | `rounded-e-md` |
| `border-l` | `border-s` |
| `border-r` | `border-e` |

For cases that genuinely differ between directions use Tailwind's `rtl:` / `ltr:` variants:
```tsx
// Icon that should flip in RTL
<ChevronRight className="rtl:rotate-180 transition-transform" />

// Sidebar that slides from the right in RTL
<aside className="start-0 ltr:border-r rtl:border-l" />
```

### Font handling

Hebrew requires a different font. Load both and let CSS pick:
```css
/* index.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700&display=swap');

:root {
  font-family: 'Inter', system-ui, sans-serif;
}

:root[lang="he"] {
  font-family: 'Heebo', system-ui, sans-serif;
}
```

> **Heebo** is the recommended Google Font for Hebrew — it's designed to pair well with Inter and has matching weight/style.

### Kanban board RTL

The drag-and-drop board (columns left→right) needs to reverse in RTL:
```tsx
// KanbanBoard.tsx
const { i18n } = useTranslation()
const isRTL = ['he', 'ar'].includes(i18n.language)

<DndContext modifiers={isRTL ? [adjustTranslate] : []}>
  <div className="flex gap-4 flex-row rtl:flex-row-reverse">
    {columns.map(col => <KanbanColumn key={col.id} column={col} />)}
  </div>
</DndContext>
```

### Usage in components

```tsx
import { useTranslation } from 'react-i18next'

export function CreateIssueButton() {
  const { t } = useTranslation('issue')
  return <Button>{t('actions.create')}</Button>
}
```

```json
// public/locales/en/issue.json
{
  "actions": {
    "create": "Create Issue",
    "edit": "Edit",
    "delete": "Delete"
  }
}

// public/locales/he/issue.json
{
  "actions": {
    "create": "צור משימה",
    "edit": "עריכה",
    "delete": "מחק"
  }
}
```

---

## Package.json (starting point)

```json
{
  "name": "bento-frontend",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint src"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^5.0.0",
    "axios": "^1.7.0",
    "react-hook-form": "^7.0.0",
    "@hookform/resolvers": "^3.0.0",
    "zod": "^3.0.0",
    "@dnd-kit/core": "^6.0.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.0.0",
    "@tiptap/react": "^2.0.0",
    "@tiptap/starter-kit": "^2.0.0",
    "@tiptap/extension-mention": "^2.0.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-popover": "^1.1.0",
    "@radix-ui/react-select": "^2.1.0",
    "@radix-ui/react-tooltip": "^1.1.0",
    "@radix-ui/react-avatar": "^1.1.0",
    "framer-motion": "^12.0.0",
    "lucide-react": "^0.400.0",
    "recharts": "^2.0.0",
    "date-fns": "^4.0.0",
    "sonner": "^1.0.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  },
  "devDependencies": {
    "vite": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.0.0",
    "prettier": "^3.0.0",
    "prettier-plugin-tailwindcss": "^0.6.0"
  }
}
```
