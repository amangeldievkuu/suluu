# Suluu

[![CI](https://github.com/amangeldievkuu/suluu/actions/workflows/ci.yml/badge.svg)](https://github.com/amangeldievkuu/suluu/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/suluu.svg)](https://www.npmjs.com/package/suluu)

Suluu is a focused collection of animated React components for interfaces that
should feel alive without feeling busy. Components are readable, accessible, and
designed to become part of your codebase.

> **Preview status:** Suluu is a 0.x project. Its public APIs can still change
> between minor releases. Registry installs copy the source into your
> repository, so review and own that code as part of your application. The npm
> package is useful when centralized upgrades matter, but it follows the same
> 0.x contract.

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

## Compatibility and verification

Suluu 0.2 supports React 19, Tailwind CSS 4, and Motion 12.23.26 through 13.x.
The package is ESM-only. Development and builds require Node.js 20.9 or newer.

Every change is checked with strict TypeScript, ESLint, package and registry
consumer installs, jsdom accessibility tests, production documentation builds,
Chromium/Firefox/WebKit interactions, and reduced-motion visual snapshots in
light and dark themes. Browser automation raises confidence, but product teams
should still check their own composition, theme, content, and
assistive-technology requirements before shipping.

## Workspace

- `packages/suluu` contains canonical component source, tests, and the npm
  build.
- `packages/registry` generates and validates shadcn registry artifacts.
- `apps/www` contains the Next.js documentation and registry host.

Useful commands:

```bash
pnpm dev
pnpm test
pnpm test:e2e
pnpm test:visual
pnpm build
pnpm validate
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) before proposing changes. Suluu is
available under the [MIT License](./LICENSE). Release notes are kept in the
[changelog](./CHANGELOG.md), and the maintainer procedure is documented in
[RELEASING.md](./RELEASING.md).
