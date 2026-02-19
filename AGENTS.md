# Agents Guide - Book Log

> Guide for AI coding agents working in this repository.

## Project Overview

Turborepo monorepo for a book reading tracker built with:

- **Framework**: React 19 + TypeScript
- **Bundler**: Vite
- **Backend**: Supabase
- **UI**: Radix UI + Tailwind CSS v4
- **State**: TanStack Query (React Query)
- **Package Manager**: pnpm 10.29.3

---

## Build & Development Commands

### Root Commands (Turborepo)

```bash
# Development
pnpm dev                 # Start all apps in dev mode
pnpm build              # Build all apps
pnpm lint               # Lint all apps
pnpm format             # Format all files with Prettier
pnpm check-types        # Type-check all apps

# Database types generation
pnpm gen:types          # Generate TypeScript types from Supabase schema
```

### Web App Commands (apps/web)

```bash
cd apps/web

# Development
pnpm dev                # Start dev server (Vite)
pnpm build              # Production build
pnpm preview            # Preview production build
pnpm lint               # Run ESLint

# Type checking (use root command or manually)
npx tsc --noEmit --project tsconfig.app.json
```

### No Testing Framework Yet

Currently no test runner configured. When adding tests, prefer Vitest.

---

## Code Style & Conventions

### File Naming

- **Components**: `kebab-case.tsx` (e.g., `book-card.tsx`, `status-badge.tsx`)
- **Pages**: `kebab-case.tsx` (e.g., `login.tsx`, `book-detail.tsx`)
- **Hooks**: `use-*.ts` (e.g., `use-auth.ts`, `use-book-search.ts`)
- **Utilities**: `kebab-case.ts` (e.g., `constants.ts`, `utils.ts`)

### Import Order

Organize imports in this order (separated by blank lines):

```typescript
// 1. Helper functions and utilities from @/lib
import { formatDateRange } from "@/lib/constants";

// 2. Constants and messages
import { messages } from "@/constants/messages";

// 3. Types (use `type` keyword)
import type { ReadingRecord } from "@/types";

// 4. Third-party libraries
import { BookMarked } from "lucide-react";
import { Link } from "react-router-dom";

// 5. React and hooks (if not already imported)
import { useState } from "react";

// 6. Local components (relative imports)
import { BookCover } from "./book-cover";
```

### Component Structure

```typescript
// 1. Imports (see order above)

// 2. Interface for props (prefer interface over type for props)
interface BookCardProps {
  record: ReadingRecord;
  showAuthor?: boolean;
}

// 3. Export component as named function (not default, not arrow)
export function BookCard({ record, showAuthor }: BookCardProps) {
  // Component logic
}
```

### TypeScript Patterns

- **Strict mode enabled** - no `any`, handle null/undefined
- **Type imports**: Use `import type { ... }` for types
- **Props**: Use `interface` for component props
- **Constants**: Use `as const` for constant objects
- **Path alias**: `@/*` maps to `src/*`
- **Unused vars**: Prefix with `_` to suppress errors (ESLint rule)

### Naming Conventions

- **Components**: `PascalCase` (e.g., `BookCard`, `StatusBadge`)
- **Functions/Variables**: `camelCase` (e.g., `handleSubmit`, `isLoading`)
- **Constants**: `UPPER_SNAKE_CASE` for legacy, prefer domain messages now
- **Types/Interfaces**: `PascalCase` (e.g., `ReadingRecord`, `AuthContextType`)

### Comments & Documentation

- Add JSDoc comments for:
  - Exported utility functions
  - Custom hooks
  - Complex business logic
- File-level comments for pages explaining purpose
- Inline comments only when logic is non-obvious

Example:

```typescript
/**
 * Hook to access auth context.
 *
 * @returns Auth context value
 * @throws If used outside of AuthProvider
 */
export function useAuth(): AuthContextType {
  // ...
}
```

---

## UI Text Management

**CRITICAL**: All UI text MUST use the centralized message system.

### Message System Structure

```
src/constants/messages/
├── index.ts          # Exports unified `messages` object
├── auth.ts           # Authentication messages
├── books.ts          # Book-related messages
├── common.ts         # Shared buttons, states, errors
├── friends.ts        # Friend system messages
└── profile.ts        # Profile/user messages
```

### Usage Pattern

```typescript
import { messages } from '@/constants/messages';

// Use domain-based paths
<h1>{messages.auth.login.title}</h1>
<Button>{messages.common.buttons.save}</Button>
<p>{messages.books.errors.searchFailed}</p>
```

### Adding New Messages

1. Identify correct domain file (auth, books, common, friends, profile)
2. Add message under appropriate nested key
3. Use `as const` to preserve literal types
4. Never hardcode Korean/English strings in components

---

## Error Handling

### Standard Pattern

```typescript
try {
  await mutation.mutateAsync(data);
  toast.success(messages.common.success.savedSuccessfully);
} catch (error) {
  console.error("Operation failed:", error);
  toast.error(messages.common.errors.failedToSave);
}
```

### Guidelines

- Use `try/catch` for async operations
- Log errors to console with descriptive message
- Show user-friendly toast messages (never expose stack traces)
- Use `messages.*` for all user-facing error text
- Handle edge cases (null checks, empty states)

---

## Component Patterns

### Supabase Queries (TanStack Query)

```typescript
// In hooks file
export function useReadingRecord(id: string | undefined) {
  return useQuery({
    queryKey: ["reading-record", id],
    queryFn: () => fetchReadingRecord(id!),
    enabled: !!id,
  });
}

// In component
const { data: record, isLoading } = useReadingRecord(id);
```

### Form Handling

- Use `react-hook-form` for complex forms
- Use controlled inputs for simple forms
- Validate on submit, show inline errors

### Loading States

- Show skeleton components during initial load
- Show spinner for user-triggered actions
- Disable buttons during mutations

---

## Common Pitfalls

1. **Don't hardcode UI text** - Use `messages.*` system
2. **Don't use `any`** - TypeScript strict mode is enabled
3. **Don't suppress errors silently** - Always log and notify user
4. **Don't use default exports** - Use named exports
5. **Don't skip null checks** - Handle `| null` types explicitly
6. **Don't forget `type` keyword** - Use `import type` for types
7. **Don't create new constant objects** - Extend existing `messages.*`

---

## Project-Specific Rules

### Message System Migration (Completed)

- Old constants in `/lib/constants.ts` removed
- Only helper functions remain there
- All UI text now in `/constants/messages/`

### Helper Functions Location

Place in `/lib/constants.ts`:

- `getReadingStatusLabel()`, `getVisibilityLabel()`
- `formatPageProgress()`, `formatPercentage()`, `formatDateRange()`
- `renderRatingStars()`

These helpers reference `messages.*` internally.

---

## References

- **TypeScript Config**: `apps/web/tsconfig.app.json` (strict mode enabled)
- **ESLint Config**: `apps/web/eslint.config.js` (unused vars with `_` allowed)
- **Messages Index**: `apps/web/src/constants/messages/index.ts`
