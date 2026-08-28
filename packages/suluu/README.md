# suluu

The optional ESM package for [Suluu](https://suluu.site) animated React
components. Most users should install individual components through the
registry:

```bash
npx shadcn@latest add https://suluu.site/r/notify-morph.json
```

Registry installs copy the component source into your application. Treat that
source as code your team owns and can adapt.

Package consumers can instead install the centralized package:

```bash
pnpm add suluu motion
```

Import the variables and point Tailwind CSS v4 at the distributed source:

```css
@import "tailwindcss";
@import "suluu/styles.css";
@source "../node_modules/suluu/dist";
```

Then import only the component entry you need:

```tsx
import { FluidTabs } from "suluu/fluid-tabs";
```

## Compatibility

- React and React DOM 19
- Motion 12.23.26 through 13.x
- Tailwind CSS 4
- ESM-aware bundlers

Suluu is currently a 0.x package, so minor versions may contain API changes. See
the root
[changelog](https://github.com/amangeldievkuu/suluu/blob/main/CHANGELOG.md)
before upgrading.
