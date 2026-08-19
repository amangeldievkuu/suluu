import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SearchPalette } from "@/components/search-palette";
import { SearchProvider } from "@/components/search-provider";
import { SearchTrigger } from "@/components/search-trigger";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

function renderPalette() {
  return render(
    <SearchProvider>
      <SearchTrigger />
      <SearchPalette />
    </SearchProvider>,
  );
}

function getDialog(): HTMLDialogElement {
  const dialog = document.querySelector("dialog");
  if (!dialog) throw new Error("Expected the palette dialog to render.");

  return dialog;
}

function getTrigger() {
  return screen.getByRole("button", { name: /search components/i });
}

function getInput() {
  return screen.getByRole("combobox", { name: "Search components" });
}

beforeEach(() => {
  push.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SearchPalette", () => {
  it("starts closed", () => {
    renderPalette();

    expect(getDialog().open).toBe(false);
  });

  it("opens from the trigger button", async () => {
    const user = userEvent.setup();
    renderPalette();

    await user.click(getTrigger());

    expect(getDialog().open).toBe(true);
  });

  it.each([
    ["meta", "{Meta>}k{/Meta}"],
    ["ctrl", "{Control>}k{/Control}"],
  ])("opens with %s+K from anywhere on the page", async (_name, sequence) => {
    const user = userEvent.setup();
    renderPalette();

    document.body.focus();
    await user.keyboard(sequence);

    expect(getDialog().open).toBe(true);
  });

  it("ignores synthetic keydown events that carry no key", () => {
    renderPalette();

    // Password managers and autofill dispatch bare keydown events with no key
    // property at all, which used to crash the shortcut listener.
    expect(() => window.dispatchEvent(new Event("keydown"))).not.toThrow();
    expect(getDialog().open).toBe(false);
  });

  it("lists every component when the query is empty", async () => {
    const user = userEvent.setup();
    renderPalette();
    await user.click(getTrigger());

    const options = within(screen.getByRole("listbox")).getAllByRole("option");

    expect(options.length).toBeGreaterThan(1);
    expect(options[0]).toHaveTextContent("MagnetPull");
  });

  it("filters as the user types", async () => {
    const user = userEvent.setup();
    renderPalette();
    await user.click(getTrigger());
    await user.type(getInput(), "notify");

    const options = within(screen.getByRole("listbox")).getAllByRole("option");

    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("NotifyMorph");
  });

  it("shows an empty state naming the query", async () => {
    const user = userEvent.setup();
    renderPalette();
    await user.click(getTrigger());
    await user.type(getInput(), "zzzzz");

    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.getByText(/no components match/i)).toHaveTextContent("zzzzz");
  });

  it("moves the active option with the arrow keys and wraps", async () => {
    const user = userEvent.setup();
    renderPalette();
    await user.click(getTrigger());

    const input = getInput();
    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    const first = options[0];
    const last = options[options.length - 1];

    expect(input).toHaveFocus();
    expect(input).toHaveAttribute("aria-activedescendant", first?.id);
    expect(first).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{ArrowDown}");
    for (const option of options.slice(1)) {
      expect(input).toHaveAttribute("aria-activedescendant", option.id);
      await user.keyboard("{ArrowDown}");
    }

    // Wraps forward to the start, then backward to the end.
    expect(input).toHaveAttribute("aria-activedescendant", first?.id);

    await user.keyboard("{ArrowUp}");
    expect(input).toHaveAttribute("aria-activedescendant", last?.id);
  });

  it("opens the active component on Enter", async () => {
    const user = userEvent.setup();
    renderPalette();
    await user.click(getTrigger());
    await user.type(getInput(), "notify");
    await user.keyboard("{Enter}");

    expect(push).toHaveBeenCalledExactlyOnceWith("/components/notify-morph");
    await waitFor(() => {
      expect(getDialog().open).toBe(false);
    });
  });

  it("opens a component when its option is clicked", async () => {
    const user = userEvent.setup();
    renderPalette();
    await user.click(getTrigger());
    await user.click(screen.getByRole("option", { name: /MagnetPull/ }));

    expect(push).toHaveBeenCalledExactlyOnceWith("/components/magnet-pull");
  });

  it("does nothing on Enter when nothing matches", async () => {
    const user = userEvent.setup();
    renderPalette();
    await user.click(getTrigger());
    await user.type(getInput(), "zzzzz");
    await user.keyboard("{Enter}");

    expect(push).not.toHaveBeenCalled();
    expect(getDialog().open).toBe(true);
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    renderPalette();
    await user.click(getTrigger());

    getDialog().dispatchEvent(new Event("cancel", { cancelable: true }));

    await waitFor(() => {
      expect(getDialog().open).toBe(false);
    });
    expect(getTrigger()).toHaveFocus();
  });

  it("resets the query between openings", async () => {
    const user = userEvent.setup();
    renderPalette();
    await user.click(getTrigger());
    await user.type(getInput(), "notify");

    getDialog().dispatchEvent(new Event("cancel", { cancelable: true }));
    await waitFor(() => {
      expect(getDialog().open).toBe(false);
    });

    await user.click(getTrigger());

    expect(getInput()).toHaveValue("");
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    const { container } = renderPalette();
    await user.click(getTrigger());

    const results = await axe(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
