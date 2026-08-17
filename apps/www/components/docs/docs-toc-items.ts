/**
 * Module-level so the identity is stable: `DocsToc` keeps `items` in a
 * `useEffect` dependency array, and an array rebuilt during render would
 * resubscribe its scroll listener on every render.
 */
export const DEFAULT_TOC_ITEMS = [
  { id: "installation", label: "Installation" },
  { id: "usage", label: "Usage" },
  { id: "props", label: "Props" },
  { id: "theming", label: "Theming" },
  { id: "accessibility", label: "Accessibility" },
] as const;
