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

CI reports quality, unit/accessibility, package/registry, documentation,
cross-browser interaction, and visual-regression failures separately. For a
motion or layout change, update visual baselines only after inspecting the
rendered diff:

```bash
pnpm test:e2e
pnpm test:visual
pnpm --filter @suluu/www exec playwright test e2e/visual.spec.ts \
  --project=chromium --update-snapshots
```

## Releases

Maintainers publish only through the protected GitHub Actions workflow; local
`npm publish` is not part of the release process. Contributors do not need to
prepare credentials or create tags. See [RELEASING.md](./RELEASING.md) for the
versioning, validation, approval, and first-publish bootstrap procedure.
