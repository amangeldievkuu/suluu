# Contributing to Suluu

Thank you for helping improve Suluu. Keep changes focused, readable, and useful
to developers who will own the resulting component source.

## Development

Requirements:

- Node.js 20.9 or newer
- pnpm 10.33.0 through Corepack

```bash
corepack enable
pnpm install
pnpm dev
```

Canonical component code belongs in `packages/suluu`. Do not edit files in
`apps/www/public/r` by hand; regenerate them with `pnpm registry:generate`.

Before opening a pull request, run:

```bash
pnpm validate
```

Pull requests should include tests for behavior changes and documentation for
public API changes. Avoid unrelated formatting or refactors in the same change.

## Changesets and releases

Version 0.1 uses manual releases. Maintainers coordinate version changes and npm
publishing; contributors do not need to add release automation.
