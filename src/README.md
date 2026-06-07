# src/ — Application Source Code

All application logic lives here, organized by concern. The `app/` directory (sibling to `src/`) handles routing only — screens import everything they need from `src/`.

## Directory Map

```
src/
├── components/     → Reusable UI components (see components/README.md)
├── stores/         → Zustand state management (see stores/README.md)
├── services/       → API & business logic layer (see services/README.md)
├── hooks/          → Custom React hooks (see hooks/README.md)
├── schemas/        → Zod validation schemas (see schemas/README.md)
├── types/          → TypeScript type definitions (see types/README.md)
├── constants/      → Theme tokens & config (see constants/README.md)
├── utils/          → Pure utility functions (see utils/README.md)
└── lib/            → SDK client initialization (see lib/README.md)
```

## Data Flow

```
Screen (app/) → Hook (hooks/) → Store (stores/) → Service (services/) → Supabase/Firebase (lib/)
                                                         ↕
                                                   Schema (schemas/)
```

1. **Screens** render UI and call hooks
2. **Hooks** subscribe to stores and manage side effects
3. **Stores** hold state and dispatch actions to services
4. **Services** make API calls and validate responses with Zod
5. **Lib** provides initialized SDK clients

## Import Aliases

Configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/assets/*": ["./assets/*"]
    }
  }
}
```

Usage: `import { Button } from '@/components/ui/Button'`

## Conventions

- Every subfolder has its own `README.md` with detailed instructions
- Read the folder's README before writing code in it
- Imports flow downward: screens → hooks → stores → services → lib
- Never import upward (services should not import stores)
- Shared types come from `schemas/` (with Zod) or `types/` (without Zod)
- Constants are compile-time values only; runtime config goes in stores
