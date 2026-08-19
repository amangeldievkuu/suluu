import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";

import { SearchMorph } from "../src/search-morph/search-morph";

/**
 * jsdom reports no layout, so the width tests stub what the component measures:
 * the natural width of the label.
 */
function stubLabelMeasurement(slot: string, width: number) {
  class TestResizeObserver {
    disconnect() {
      return undefined;
    }
    observe() {
      return undefined;
    }
    unobserve() {
      return undefined;
    }
  }

  vi.stubGlobal("ResizeObserver", TestResizeObserver);
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(
    function (this: HTMLElement) {
      return this.dataset.slot === slot ? width : 0;
    },
  );
}

describe("SearchMorph", () => {
  it("widens the pill for a label the default track cannot fit", async () => {
    const user = userEvent.setup();
    stubLabelMeasurement("search-morph-label", 180);

    render(<SearchMorph label="Search every note" />);
    const action = screen.getByRole("button", { name: "Search every note" });

    // 180 label + 32 padding + 20 icon + 10 gap, instead of clipping at 152.
    await waitFor(() => expect(action).toHaveStyle({ width: "242px" }), {
      timeout: 3000,
    });

    await user.click(action);

    // Expanded the icon is gone, so the submit button only carries the label.
    await waitFor(() => expect(action).toHaveStyle({ width: "212px" }), {
      timeout: 3000,
    });

    vi.unstubAllGlobals();
  });

  it("starts collapsed and expands with focus on activation", async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();

    render(<SearchMorph onExpandedChange={onExpandedChange} />);
    await user.click(screen.getByRole("button", { name: "Search" }));

    const input = await screen.findByRole("searchbox", {
      name: "Search query",
    });
    await waitFor(() => expect(input).toHaveFocus());
    expect(onExpandedChange).toHaveBeenCalledWith(true);
  });

  it("supports keyboard expansion and Escape focus restoration", async () => {
    const user = userEvent.setup();

    render(<SearchMorph />);
    const trigger = screen.getByRole("button", { name: "Search" });
    trigger.focus();
    await user.keyboard("{Enter}");
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Search" })).toHaveFocus();
    });
  });

  it("morphs one persistent action between the icon trigger and submit state", async () => {
    const user = userEvent.setup();
    const { container } = render(<SearchMorph />);
    const action = screen.getByRole("button", { name: "Search" });

    expect(action).toHaveAttribute("type", "button");
    expect(
      container.querySelector('[data-slot="search-morph-icon"]'),
    ).toBeVisible();

    await user.click(action);

    const input = await screen.findByRole("searchbox", {
      name: "Search query",
    });
    const submit = screen.getByRole("button", { name: "Search" });
    expect(submit).toBe(action);
    expect(submit).toHaveAttribute("type", "submit");
    expect(input).toHaveAttribute("placeholder", "Search");
    await waitFor(() => {
      expect(
        container.querySelector('[data-slot="search-morph-icon"]'),
      ).toBeNull();
    });

    await user.keyboard("{Escape}");

    expect(screen.getByRole("button", { name: "Search" })).toBe(action);
    expect(action).toHaveAttribute("type", "button");
    await waitFor(() => {
      expect(
        container.querySelector('[data-slot="search-morph-icon"]'),
      ).toBeVisible();
    });
  });

  it("keeps the collapsed icon pulse centered and does not restart it on hover", () => {
    const { container } = render(<SearchMorph />);
    const button = screen.getByRole("button", { name: "Search" });
    const firstIcon = container.querySelector(
      '[data-slot="search-morph-icon"]',
    );

    expect(firstIcon).toHaveStyle({
      transformBox: "view-box",
      transformOrigin: "center",
    });

    fireEvent.pointerEnter(button);

    expect(container.querySelector('[data-slot="search-morph-icon"]')).toBe(
      firstIcon,
    );
  });

  it("manages uncontrolled values and emits value changes", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <SearchMorph
        defaultExpanded
        defaultValue="su"
        onValueChange={onValueChange}
      />,
    );
    const input = screen.getByRole("searchbox", { name: "Search query" });
    await user.type(input, "luu");

    expect(input).toHaveValue("suluu");
    expect(onValueChange).toHaveBeenLastCalledWith("suluu");
  });

  it("keeps controlled value and expansion state authoritative", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onExpandedChange = vi.fn();
    const { rerender } = render(
      <SearchMorph
        expanded={false}
        onExpandedChange={onExpandedChange}
        onValueChange={onValueChange}
        value="suluu"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Search" }));
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();

    rerender(
      <SearchMorph
        expanded
        onExpandedChange={onExpandedChange}
        onValueChange={onValueChange}
        value="suluu"
      />,
    );
    const input = await screen.findByRole("searchbox", {
      name: "Search query",
    });
    await user.type(input, "x");

    expect(onValueChange).toHaveBeenCalledWith("suluux");
    expect(input).toHaveValue("suluu");
  });

  it("ignores empty and whitespace-only queries", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<SearchMorph defaultExpanded defaultValue="" onSubmit={onSubmit} />);
    const input = screen.getByRole("searchbox", { name: "Search query" });
    input.focus();
    await user.keyboard("{Enter}");
    await user.type(input, "   ");
    await user.keyboard("{Enter}");

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Search" })).not.toHaveAttribute(
      "aria-busy",
    );
    expect(input).toHaveFocus();
  });

  it("submits a typed query and does not show a confirmation overlay", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <SearchMorph defaultExpanded defaultValue="suluu" onSubmit={onSubmit} />,
    );
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]?.[0]).toBe("suluu");
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByRole("searchbox")).toHaveValue("suluu");
    expect(screen.getByRole("searchbox")).toBeVisible();
  });

  it("shows an animated clear button only when the query is non-empty", async () => {
    const user = userEvent.setup();

    render(<SearchMorph defaultExpanded />);
    expect(
      screen.queryByRole("button", { name: "Clear search" }),
    ).not.toBeInTheDocument();

    await user.type(screen.getByRole("searchbox"), "su");

    expect(
      await screen.findByRole("button", { name: "Clear search" }),
    ).toBeInTheDocument();
  });

  it("clears the query and returns focus to the input without submitting", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onValueChange = vi.fn();

    render(
      <SearchMorph
        defaultExpanded
        defaultValue="suluu"
        onSubmit={onSubmit}
        onValueChange={onValueChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Clear search" }));

    const input = screen.getByRole("searchbox");
    expect(input).toHaveValue("");
    expect(onValueChange).toHaveBeenLastCalledWith("");
    expect(onSubmit).not.toHaveBeenCalled();
    await waitFor(() => expect(input).toHaveFocus());
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Clear search" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("leaves the clear button out of a controlled value and disabled widget", () => {
    const { rerender } = render(
      <SearchMorph defaultExpanded disabled defaultValue="suluu" />,
    );
    expect(
      screen.queryByRole("button", { name: "Clear search" }),
    ).not.toBeInTheDocument();

    rerender(<SearchMorph defaultExpanded value="suluu" />);
    expect(
      screen.getByRole("button", { name: "Clear search" }),
    ).toBeInTheDocument();
  });

  it("acknowledges submission with a self-clearing pending state", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <SearchMorph
        defaultExpanded
        defaultValue="suluu"
        onSubmit={onSubmit}
        pendingDuration={40}
      />,
    );
    const action = screen.getByRole("button", { name: "Search" });
    await user.click(action);

    expect(action).toHaveAttribute("aria-busy", "true");
    expect(onSubmit).toHaveBeenCalledTimes(1);

    await user.click(action);
    expect(onSubmit).toHaveBeenCalledTimes(1);

    await waitFor(() => expect(action).not.toHaveAttribute("aria-busy"));
  });

  it("never submits on the click that expands it", () => {
    const onSubmit = vi.fn();
    const { container } = render(
      <SearchMorph defaultValue="suluu" onSubmit={onSubmit} />,
    );
    const form = container.querySelector("form");
    if (!form) throw new Error("Expected SearchMorph to render a form.");
    const action = screen.getByRole("button", { name: "Search" });

    // Browsers run a button's activation behaviour after React has already
    // flushed the expansion, so the form sees a submit in the same task as
    // the opening click. Reproduce that ordering without yielding.
    fireEvent.click(action);
    fireEvent.submit(form);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(action).not.toHaveAttribute("aria-busy");
  });

  it("still submits normally once the widget is open", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const { container } = render(
      <SearchMorph defaultValue="suluu" onSubmit={onSubmit} />,
    );
    const form = container.querySelector("form");
    if (!form) throw new Error("Expected SearchMorph to render a form.");

    await user.click(screen.getByRole("button", { name: "Search" }));
    await screen.findByRole("searchbox");
    fireEvent.submit(form);

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("ends the acknowledgement on collapse instead of resurfacing it", async () => {
    const user = userEvent.setup();

    render(<SearchMorph defaultExpanded defaultValue="suluu" />);
    const action = screen.getByRole("button", { name: "Search" });
    await user.click(action);
    expect(action).toHaveAttribute("aria-busy", "true");

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("searchbox")).toBeNull());

    await user.click(action);
    await screen.findByRole("searchbox");

    expect(action).not.toHaveAttribute("aria-busy");
  });

  it("lets a controlled pending prop own the indicator", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    const { rerender } = render(
      <SearchMorph
        defaultExpanded
        defaultValue="suluu"
        onSubmit={onSubmit}
        pending={false}
      />,
    );
    const action = screen.getByRole("button", { name: "Search" });
    await user.click(action);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(action).not.toHaveAttribute("aria-busy");

    rerender(
      <SearchMorph
        defaultExpanded
        defaultValue="suluu"
        onSubmit={onSubmit}
        pending
      />,
    );
    expect(action).toHaveAttribute("aria-busy", "true");

    await user.click(action);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("does not respond while disabled", async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const onSubmit = vi.fn();

    render(
      <SearchMorph
        disabled
        onExpandedChange={onExpandedChange}
        onSubmit={onSubmit}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(onExpandedChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });

  it("collapses on blur when collapseOnBlur is true", async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();

    render(
      <div>
        <SearchMorph defaultExpanded onExpandedChange={onExpandedChange} />
        <button type="button">Outside</button>
      </div>,
    );
    screen.getByRole("searchbox").focus();
    await user.click(screen.getByRole("button", { name: "Outside" }));

    expect(onExpandedChange).toHaveBeenCalledWith(false);
    await waitFor(() => expect(screen.queryByRole("searchbox")).toBeNull());
  });

  it("supports opting out of outside-click collapse", async () => {
    const user = userEvent.setup();

    render(
      <div>
        <SearchMorph collapseOnBlur={false} defaultExpanded />
        <button type="button">Outside</button>
      </div>,
    );
    screen.getByRole("searchbox").focus();
    await user.click(screen.getByRole("button", { name: "Outside" }));

    expect(screen.getByRole("searchbox")).toBeVisible();
  });

  it("forwards the form ref and className", () => {
    const ref = createRef<HTMLFormElement>();

    render(
      <SearchMorph
        aria-label="Find docs"
        className="custom-search"
        data-testid="search-form"
        ref={ref}
      />,
    );

    expect(ref.current).toBe(screen.getByTestId("search-form"));
    expect(ref.current).toHaveClass("custom-search");
    expect(ref.current).toHaveAccessibleName("Find docs");
    expect(ref.current).toHaveAttribute("role", "search");
  });

  it("renders role=search on the server", () => {
    const markup = renderToStaticMarkup(<SearchMorph />);

    expect(markup).toContain('role="search"');
    expect(markup).toContain("Search");
  });

  it("ignores programmatic submissions while disabled", () => {
    const onSubmit = vi.fn();
    const { container } = render(
      <SearchMorph defaultExpanded disabled onSubmit={onSubmit} />,
    );
    const form = container.querySelector("form");
    if (!form) throw new Error("Expected SearchMorph to render a form.");

    fireEvent.submit(form);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("disables every interactive control", () => {
    render(<SearchMorph defaultExpanded disabled />);

    expect(screen.getByRole("searchbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Search" })).toBeDisabled();
  });

  it("has no accessibility violations in either state", async () => {
    const { container, rerender } = render(<SearchMorph />);

    expect(
      (
        await axe(container, {
          rules: { "color-contrast": { enabled: false } },
        })
      ).violations,
    ).toEqual([]);

    rerender(<SearchMorph defaultExpanded />);
    expect(
      (
        await axe(container, {
          rules: { "color-contrast": { enabled: false } },
        })
      ).violations,
    ).toEqual([]);

    rerender(<SearchMorph defaultExpanded pending value="suluu" />);
    expect(
      (
        await axe(container, {
          rules: { "color-contrast": { enabled: false } },
        })
      ).violations,
    ).toEqual([]);
  });

  it("remains usable when reduced motion is preferred", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query) =>
        ({
          addEventListener: () => undefined,
          addListener: () => undefined,
          dispatchEvent: () => false,
          matches: query.includes("prefers-reduced-motion"),
          media: query,
          onchange: null,
          removeEventListener: () => undefined,
          removeListener: () => undefined,
        }) as MediaQueryList,
    );

    render(<SearchMorph />);
    await user.click(screen.getByRole("button", { name: "Search" }));

    const input = await screen.findByRole("searchbox");
    await waitFor(() => expect(input).toHaveFocus());
  });
});
