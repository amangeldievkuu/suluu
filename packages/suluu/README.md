# suluu

The optional ESM package for [Suluu](https://suluu.site) animated React
components. Most users should install individual components through the
registry:

```bash
npx shadcn@latest add https://suluu.site/r/notify-morph.json
```

Package consumers can instead install `suluu` and `motion`, import
`suluu/styles.css`, and add `node_modules/suluu/dist` as a Tailwind CSS v4
`@source`.
