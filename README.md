# @deessejs/vfs

TypeScript monorepo template with pnpm, turbo, vitest, husky, and changesets.

## Setup

```bash
# Install dependencies
pnpm install

# Enable husky
pnpm prepare
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm build` | Build all packages |
| `pnpm dev` | Run dev mode with watch |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm test` | Run vitest |
| `pnpm release` | Version bump with changesets |
| `pnpm publish` | Publish packages to npm |

## Adding a Package

1. Create a new directory in `packages/`
2. Add a `package.json` with the required scripts
3. Add a `tsconfig.json` extending the root config

## Release

```bash
# Create a changeset
pnpm changeset add

# Version bump
pnpm release

# Publish (CI will do this on tag push)
pnpm publish
```

## Git Hooks

Pre-commit hooks run automatically:
- `pnpm turbo lint`
- `pnpm turbo typecheck`
- `pnpm turbo test`
