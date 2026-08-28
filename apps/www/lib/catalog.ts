export const SITE_URL = "https://suluu.site";
export const NPM_COMMAND = "pnpm add suluu motion";

/** Display order of the sidebar and the index page groups. */
export const CATEGORIES = [
  "Surfaces",
  "Buttons",
  "Forms",
  "Navigation",
  "Feedback",
  "Data Display",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface CatalogEntry {
  /** Route segment, registry item name, and generated JSON filename. */
  slug: string;
  /** Exported component name, used as the display title everywhere. */
  name: string;
  category: Category;
  /** The one canonical description. Cards, search results, and metadata. */
  summary: string;
  /** Extra search terms that appear in neither the name nor the summary. */
  keywords: readonly string[];
}

export const CATALOG = [
  {
    slug: "magnet-pull",
    name: "MagnetPull",
    category: "Buttons",
    summary:
      "A button that leans toward the cursor on a spring, its label travelling further than its surface.",
    keywords: ["magnetic", "cursor", "hover", "cta", "attract", "parallax"],
  },
  {
    slug: "morph-button",
    name: "MorphButton",
    category: "Buttons",
    summary:
      "A compact icon button that springs open into a labeled action on hover, focus, or application state.",
    keywords: ["expand", "shape", "pill", "icon", "cta", "transition"],
  },
  {
    slug: "theme-toggle",
    name: "ThemeToggle",
    category: "Buttons",
    summary:
      "A calm theme button whose custom sun and moon crossfade on controlled springs.",
    keywords: ["dark", "light", "appearance", "mode", "sun", "moon"],
  },
  {
    slug: "fluid-tabs",
    name: "FluidTabs",
    category: "Navigation",
    summary:
      "A row of circular tabs whose active item springs open to reveal its label and accent.",
    keywords: ["expand", "pill", "icons", "tablist", "morph", "workspace"],
  },
  {
    slug: "duration-pill",
    name: "DurationPill",
    category: "Forms",
    summary:
      "A compact duration display that softly morphs into precise segmented editing.",
    keywords: [
      "time",
      "hours",
      "minutes",
      "seconds",
      "estimate",
      "inline edit",
      "stepper",
    ],
  },
  {
    slug: "email-morph",
    name: "EmailMorph",
    category: "Forms",
    summary:
      "A quiet email field whose send action pinches off like a water drop on focus, then merges back when you leave.",
    keywords: [
      "email",
      "subscribe",
      "newsletter",
      "input",
      "liquid",
      "split",
      "send",
      "drop",
    ],
  },
  {
    slug: "notify-morph",
    name: "NotifyMorph",
    category: "Forms",
    summary:
      "A compact notification action that fluidly opens into an accessible email form.",
    keywords: ["email", "subscribe", "newsletter", "bell", "input", "expand"],
  },
  {
    slug: "otp-input",
    name: "OtpInput",
    category: "Forms",
    summary:
      "A precise one-time-code and PIN field whose active slot, digits, and caret settle with restrained motion.",
    keywords: ["otp", "pin", "verification", "code", "password", "autofill"],
  },
  {
    slug: "rope-time-picker",
    name: "RopeTimePicker",
    category: "Forms",
    summary:
      "A precise analog time picker whose draggable hands bend and settle like softly weighted ropes.",
    keywords: ["clock", "time", "alarm", "schedule", "drag", "spring", "am pm"],
  },
  {
    slug: "search-morph",
    name: "SearchMorph",
    category: "Forms",
    summary:
      "A compact search action that fluidly opens into an accessible search field.",
    keywords: ["search", "find", "query", "expand", "morph", "input"],
  },
  {
    slug: "switch-toggle",
    name: "SwitchToggle",
    category: "Forms",
    summary:
      "A spring switch with a tactile thumb and a fluid minus-to-check icon morph.",
    keywords: ["toggle", "checked", "boolean", "setting", "drag", "control"],
  },
  {
    slug: "segmented-control",
    name: "SegmentedControl",
    category: "Forms",
    summary:
      "A single-choice group whose soft pill slides under the selected option.",
    keywords: ["segmented", "tabs", "pill", "radio", "filter", "segment"],
  },
  {
    slug: "slide-control",
    name: "SlideControl",
    category: "Forms",
    summary:
      "A range slider whose fill follows the thumb with a little mass, then both settle onto the value.",
    keywords: ["slider", "range", "volume", "price", "track", "thumb"],
  },
  {
    slug: "toast",
    name: "Toaster",
    category: "Feedback",
    summary:
      "A quiet toast deck that peeks four, springs the front three apart on hover, and scrolls the rest of the deck into view.",
    keywords: [
      "toast",
      "notification",
      "snackbar",
      "alert",
      "sonner",
      "undo",
      "stack",
    ],
  },
  {
    slug: "counter-numbers",
    name: "CounterNumbers",
    category: "Data Display",
    summary:
      "A locale-aware rolling number whose changed digit places settle on satisfying springs.",
    keywords: [
      "odometer",
      "ticker",
      "statistics",
      "score",
      "currency",
      "numeric",
    ],
  },
  {
    slug: "spotlight-card",
    name: "SpotlightCard",
    category: "Surfaces",
    summary:
      "A quiet card surface whose soft light follows the cursor on carefully damped springs.",
    keywords: ["card", "glow", "spotlight", "cursor", "surface", "hover"],
  },
] as const satisfies readonly CatalogEntry[];

export type ComponentSlug = (typeof CATALOG)[number]["slug"];

/** Component featured by the homepage hero. */
export const FEATURED_SLUG: ComponentSlug = "magnet-pull";

export function getEntry(slug: string): CatalogEntry | undefined {
  return CATALOG.find((entry) => entry.slug === slug);
}

/**
 * Throwing lookup for server components that own a route: the route only
 * exists because the entry does, so a miss is a build-time mistake.
 */
export function requireEntry(slug: ComponentSlug): CatalogEntry {
  const entry = getEntry(slug);
  if (!entry) throw new Error(`No catalog entry for "${slug}".`);

  return entry;
}

export function componentHref(slug: string): string {
  return `/components/${slug}`;
}

export function registryUrl(slug: string): string {
  return `${SITE_URL}/r/${slug}.json`;
}

export function registryCommand(slug: string): string {
  return `npx shadcn@latest add ${registryUrl(slug)}`;
}

export interface CatalogGroup {
  category: Category;
  entries: readonly CatalogEntry[];
}

/** Groups in `CATEGORIES` order, skipping any category with no entries. */
export function groupByCategory(
  entries: readonly CatalogEntry[] = CATALOG,
): CatalogGroup[] {
  return CATEGORIES.map((category) => ({
    category,
    entries: entries.filter((entry) => entry.category === category),
  })).filter((group) => group.entries.length > 0);
}

const SCORE_NAME_EXACT = 100;
const SCORE_NAME_PREFIX = 80;
const SCORE_NAME_INCLUDES = 60;
const SCORE_KEYWORD = 40;
const SCORE_SUMMARY = 20;
const SCORE_CATEGORY = 10;

function scoreEntry(entry: CatalogEntry, query: string): number {
  const name = entry.name.toLowerCase();

  if (name === query) return SCORE_NAME_EXACT;
  if (name.startsWith(query)) return SCORE_NAME_PREFIX;
  if (name.includes(query) || entry.slug.includes(query)) {
    return SCORE_NAME_INCLUDES;
  }
  if (entry.keywords.some((keyword) => keyword.includes(query))) {
    return SCORE_KEYWORD;
  }
  if (entry.summary.toLowerCase().includes(query)) return SCORE_SUMMARY;
  if (entry.category.toLowerCase().includes(query)) return SCORE_CATEGORY;

  return 0;
}

/**
 * Ranked search over the catalog. An empty query returns everything in catalog
 * order, so the palette can open on a full list.
 */
export function searchCatalog(
  query: string,
  entries: readonly CatalogEntry[] = CATALOG,
): CatalogEntry[] {
  const normalized = query.trim().toLowerCase();
  if (normalized === "") return [...entries];

  return entries
    .map((entry) => ({ entry, score: scoreEntry(entry, normalized) }))
    .filter((result) => result.score > 0)
    .sort((a, b) =>
      b.score === a.score
        ? a.entry.name.localeCompare(b.entry.name)
        : b.score - a.score,
    )
    .map((result) => result.entry);
}
