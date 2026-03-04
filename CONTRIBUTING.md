# Contributing

Thank you for your interest in contributing to this project.

## Development Setup

```bash
# Install dependencies
pnpm install

# Enable husky hooks
pnpm prepare
```

## Code Quality

Before committing, ensure all checks pass:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

## Commit Messages

This project uses conventional commits. Please follow the format:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `refactor:` for code refactoring
- `test:` for test updates

## Pull Requests

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure all checks pass
5. Submit a pull request

## Release Process

This project uses changesets for versioning. To release:

```bash
# Create a changeset
pnpm changeset add

# Version bump
pnpm release

# Push to trigger release workflow
git push
```
