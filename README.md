# Suluu

Suluu is a focused collection of animated React components for interfaces that
should feel alive without feeling busy. Components are readable, accessible, and
designed to become part of your codebase.

## Install a component

The shadcn-compatible registry is the primary way to use Suluu. It installs only
the component you choose:

```bash
npx shadcn@latest add https://suluu.site/r/notify-morph.json
```

```tsx
import { NotifyMorph } from "@/components/ui/notify-morph";

export function Updates() {
  return <NotifyMorph onSubmit={(email) => subscribe(email)} />;
}
```

## Install from npm

The optional `suluu` package is ESM-only and uses React, React DOM, and Motion
as peer dependencies:

```bash
pnpm add suluu motion
```

Import the theme variables and tell Tailwind CSS v4 where to find the package's
utility classes:

```css
@import "tailwindcss";
@import "suluu/styles.css";
@source "../node_modules/suluu/dist";
```

```tsx
import { NotifyMorph } from "suluu/notify-morph";
```

## Workspace

- `packages/suluu` contains canonical component source, tests, and the npm
  build.
- `packages/registry` generates and validates shadcn registry artifacts.
- `apps/www` contains the Next.js documentation and registry host.

Useful commands:

```bash
pnpm dev
pnpm test
pnpm build
pnpm validate
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) before proposing changes. Suluu is
available under the [MIT License](./LICENSE). Release notes are kept in the
[changelog](./CHANGELOG.md).
