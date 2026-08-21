import type * as MotionReact from "motion/react";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, type ComponentProps, type KeyboardEvent } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { axe } from "vitest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FluidTabs } from "../src/fluid-tabs/fluid-tabs";

function TestIcon({ name }: { name: string }) {
  return (
    <svg data-icon={name} viewBox="0 0 24 24">
      <path d="M4 12h16" />
    </svg>
  );
}

const TABS = [
  {
    accentColor: "#087cf0",
    icon: <TestIcon name="inbox" />,
    id: "inbox-tab",
    label: "Inbox",
    panelId: "inbox-panel",
    value: "inbox",
  },
  {
    accentColor: "#ef315f",
    icon: <TestIcon name="planner" />,
    id: "planner-tab",
    label: "Planner",
    panelId: "planner-panel",
    value: "planner",
  },
  {
    accentColor: "#f0443e",
    icon: <TestIcon name="alerts" />,
    id: "alerts-tab",
    label: "Alerts",
    panelId: "alerts-panel",
    value: "alerts",
  },
] as const;

function renderTabs(props: Partial<ComponentProps<typeof FluidTabs>> = {}) {
  return render(<FluidTabs aria-label="Workspace" tabs={TABS} {...props} />);
}

function mockReducedMotion() {
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
}

function shimmers() {
  return document.querySelectorAll('[data-slot="fluid-tabs-shimmer"]');
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("FluidTabs", () => {
  it("renders a horizontal tablist with one expanded tab by default", () => {
    renderTabs();
    const list = screen.getByRole("tablist", { name: "Workspace" });
    const tabs = screen.getAllByRole("tab");

    expect(list).toHaveAttribute("aria-orientation", "horizontal");
    expect(list).toHaveAttribute("data-state", "inbox");
    expect(tabs).toHaveLength(3);
    expect(screen.getByRole("tab", { name: "Inbox" })).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(
      tabs.filter((tab) => tab.getAttribute("data-state") === "active"),
    ).toHaveLength(1);
  });

  it("supports uncontrolled selection and emits the requested value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderTabs({ defaultValue: "planner", onValueChange });

    await user.click(screen.getByRole("tab", { name: "Alerts" }));

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith("alerts");
    expect(screen.getByRole("tab", { name: "Alerts" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tablist")).toHaveAttribute("data-state", "alerts");
  });

  it("does not emit when the active tab is clicked again", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderTabs({ onValueChange });

    await user.click(screen.getByRole("tab", { name: "Inbox" }));

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("keeps a controlled value authoritative", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = renderTabs({ onValueChange, value: "inbox" });

    await user.click(screen.getByRole("tab", { name: "Planner" }));
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith("planner");
    expect(screen.getByRole("tab", { name: "Inbox" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    rerender(
      <FluidTabs
        aria-label="Workspace"
        onValueChange={onValueChange}
        tabs={TABS}
        value="planner"
      />,
    );
    expect(screen.getByRole("tab", { name: "Planner" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("automatically activates tabs with arrows, Home, and End", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderTabs({ defaultValue: "planner", onValueChange });

    screen.getByRole("tab", { name: "Planner" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Alerts" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Alerts" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Inbox" })).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Alerts" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Inbox" })).toHaveFocus();
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Alerts" })).toHaveFocus();
    expect(onValueChange).toHaveBeenCalledTimes(5);
  });

  it("skips disabled tabs during keyboard navigation", async () => {
    const user = userEvent.setup();
    render(
      <FluidTabs
        aria-label="Workspace"
        tabs={[TABS[0], { ...TABS[1], disabled: true }, TABS[2]]}
      />,
    );

    screen.getByRole("tab", { name: "Inbox" }).focus();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("tab", { name: "Alerts" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Planner" })).toBeDisabled();
  });

  it("uses a roving tab stop", () => {
    renderTabs({ defaultValue: "planner" });

    expect(screen.getByRole("tab", { name: "Inbox" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
    expect(screen.getByRole("tab", { name: "Planner" })).toHaveAttribute(
      "tabindex",
      "0",
    );
    expect(screen.getByRole("tab", { name: "Alerts" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
  });

  it("uses the first enabled tab when no default is provided", () => {
    render(
      <FluidTabs
        aria-label="Workspace"
        tabs={[{ ...TABS[0], disabled: true }, TABS[1], TABS[2]]}
      />,
    );

    expect(screen.getByRole("tab", { name: "Planner" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("falls back when the uncontrolled active tab is removed", async () => {
    const { rerender } = renderTabs({ defaultValue: "planner" });

    rerender(<FluidTabs aria-label="Workspace" tabs={[TABS[0], TABS[2]]} />);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Inbox" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });
  });

  it("blocks interaction when the whole list is disabled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderTabs({ disabled: true, onValueChange });

    expect(screen.getByRole("tablist")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(
      screen.getAllByRole("tab").every((tab) => tab.hasAttribute("disabled")),
    ).toBe(true);
    await user.click(screen.getByRole("tab", { name: "Planner" }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("composes the root key handler and honors preventDefault", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onKeyDown = vi.fn((event: KeyboardEvent<HTMLDivElement>) => {
      event.preventDefault();
    });
    renderTabs({ onKeyDown, onValueChange });

    screen.getByRole("tab", { name: "Inbox" }).focus();
    await user.keyboard("{ArrowRight}");

    expect(onKeyDown).toHaveBeenCalled();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("tab", { name: "Inbox" })).toHaveFocus();
  });

  it("connects custom trigger and panel ids and applies item accents", () => {
    const { container } = renderTabs({ defaultValue: "planner" });
    const planner = screen.getByRole("tab", { name: "Planner" });

    expect(planner).toHaveAttribute("id", "planner-tab");
    expect(planner).toHaveAttribute("aria-controls", "planner-panel");
    expect(planner.style.getPropertyValue("--suluu-fluid-tab-accent")).toBe(
      "#ef315f",
    );
    expect(
      container.querySelector('[data-icon="planner"]'),
    ).toBeInTheDocument();
  });

  it("forwards native attributes, class names, styles, and refs", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <FluidTabs
        aria-label="Workspace"
        className="custom-tabs"
        data-purpose="primary-navigation"
        ref={ref}
        style={{ opacity: 0.8 }}
        tabs={TABS}
      />,
    );
    const list = screen.getByRole("tablist");

    expect(ref.current).toBe(list);
    expect(list).toHaveClass("custom-tabs");
    expect(list).toHaveAttribute("data-purpose", "primary-navigation");
    expect(list).toHaveStyle({ opacity: "0.8" });
  });

  it("generates unique trigger ids for independent instances", () => {
    const generatedTab = {
      accentColor: TABS[0].accentColor,
      icon: TABS[0].icon,
      label: TABS[0].label,
      value: TABS[0].value,
    };
    render(
      <>
        <FluidTabs aria-label="Primary" tabs={[generatedTab]} />
        <FluidTabs aria-label="Secondary" tabs={[generatedTab]} />
      </>,
    );
    const [primary, secondary] = screen.getAllByRole("tab");

    expect(primary?.id).not.toBe(secondary?.id);
  });

  it("measures long labels and disconnects its observer", async () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    class ResizeObserverMock {
      disconnect = disconnect;
      observe = observe;
    }
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(120);

    const { unmount } = renderTabs();

    // 16px em basis: 2 * 1em padding + 1.375em icon + 0.75em gap + 120 label.
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Inbox" })).toHaveStyle({
        width: "186px",
      });
    });
    expect(observe).toHaveBeenCalledTimes(3);
    unmount();
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it("sizes every dimension from the chosen type scale", () => {
    const { rerender } = renderTabs({ size: "sm" });
    const list = screen.getByRole("tablist", { name: "Workspace" });

    expect(list).toHaveAttribute("data-size", "sm");
    expect(list.style.getPropertyValue("--suluu-fluid-tabs-font-size")).toBe(
      "0.875rem",
    );

    rerender(<FluidTabs aria-label="Workspace" size="lg" tabs={TABS} />);

    expect(list).toHaveAttribute("data-size", "lg");
    expect(list.style.getPropertyValue("--suluu-fluid-tabs-font-size")).toBe(
      "1.3125rem",
    );
  });

  it("lets a consumer override the em basis", () => {
    renderTabs({ style: { "--suluu-fluid-tabs-font-size": "2rem" } });

    expect(
      screen
        .getByRole("tablist", { name: "Workspace" })
        .style.getPropertyValue("--suluu-fluid-tabs-font-size"),
    ).toBe("2rem");
  });

  it("clamps the active pill so a long label cannot overflow the viewport", async () => {
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(400);
    vi.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(
      320,
    );

    renderTabs();

    // 320 - 32 gutter, less the two remaining circles and the gaps between.
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Inbox" })).toHaveStyle({
        width: "168px",
      });
    });
  });

  it("positions icon and label on a transform row instead of recentering the trigger", () => {
    renderTabs();
    const inbox = screen.getByRole("tab", { name: "Inbox" });
    const content = inbox.querySelector('[data-slot="fluid-tabs-content"]');
    const icon = inbox.querySelector('[data-slot="fluid-tabs-icon"]');
    const label = inbox.querySelector('[data-slot="fluid-tabs-label"]');

    // justify-center would recompute the icon from the live width, label
    // width, and gap every spring frame.
    expect(inbox.className).not.toContain("justify-center");
    expect(inbox.style.transformOrigin).toMatch(/^(0|left)/);
    expect(content).toBeTruthy();
    expect(content).toContainElement(icon);
    expect(content).toContainElement(label);
  });

  it("tints only the active tab with its accent", async () => {
    const user = userEvent.setup();
    renderTabs();

    const inbox = screen.getByRole("tab", { name: "Inbox" });
    const alerts = screen.getByRole("tab", { name: "Alerts" });

    // Both colours must never coexist on one trigger: they have equal
    // specificity, so the stylesheet order would decide the winner.
    expect(inbox.className).toContain("text-[var(--suluu-fluid-tab-accent)]");
    expect(inbox.className).not.toContain(
      "text-[var(--suluu-fluid-tabs-foreground)]",
    );
    expect(alerts.className).toContain(
      "text-[var(--suluu-fluid-tabs-foreground)]",
    );
    expect(alerts.className).not.toContain(
      "text-[var(--suluu-fluid-tab-accent)]",
    );

    await user.click(alerts);

    expect(alerts.className).toContain("text-[var(--suluu-fluid-tab-accent)]");
    expect(alerts.className).not.toContain(
      "text-[var(--suluu-fluid-tabs-foreground)]",
    );
    expect(inbox.className).toContain(
      "text-[var(--suluu-fluid-tabs-foreground)]",
    );
  });

  it("sweeps a single shimmer across the active label", async () => {
    const user = userEvent.setup();
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(80);
    renderTabs();

    await waitFor(() => {
      expect(shimmers()).toHaveLength(1);
    });

    const inbox = screen.getByRole("tab", { name: "Inbox" });
    const inboxLabel = inbox.querySelector('[data-slot="fluid-tabs-label"]');
    const sheen = shimmers()[0] as HTMLElement;

    expect(inboxLabel).toContainElement(sheen);
    expect(
      inbox.querySelector('[data-slot="fluid-tabs-icon"]'),
    ).not.toContainElement(sheen);
    expect(sheen).toHaveAttribute("aria-hidden", "true");
    expect(sheen).toHaveTextContent("Inbox");

    await user.click(screen.getByRole("tab", { name: "Alerts" }));

    await waitFor(() => {
      expect(shimmers()).toHaveLength(1);
      expect(shimmers()[0]).toHaveTextContent("Alerts");
    });
    expect(
      screen
        .getByRole("tab", { name: "Alerts" })
        .querySelector('[data-slot="fluid-tabs-label"]'),
    ).toContainElement(shimmers()[0] as HTMLElement);
  });

  it("omits the shimmer when the tab cannot be interacted with", () => {
    const { unmount } = renderTabs({ disabled: true });
    expect(shimmers()).toHaveLength(0);
    unmount();

    renderTabs({
      tabs: [{ ...TABS[0], disabled: true }, TABS[1]],
      value: "inbox",
    });
    expect(screen.getByRole("tab", { name: "Inbox" })).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(shimmers()).toHaveLength(0);
  });

  it("omits the shimmer for reduced motion", async () => {
    // motion/react latches its reduced-motion state process-wide the first
    // time any component reads it, so a matchMedia mock alone cannot flip it
    // once another test has rendered. Stub the hook for a fresh import
    // instead.
    vi.resetModules();
    vi.doMock("motion/react", async () => ({
      ...(await vi.importActual<typeof MotionReact>("motion/react")),
      useReducedMotion: () => true,
    }));
    const { FluidTabs: FreshFluidTabs } =
      await import("../src/fluid-tabs/fluid-tabs");
    render(<FreshFluidTabs aria-label="Workspace" tabs={TABS} />);

    expect(shimmers()).toHaveLength(0);
    expect(screen.getByRole("tab", { name: "Inbox" }).className).toContain(
      "text-[var(--suluu-fluid-tab-accent)]",
    );

    vi.doUnmock("motion/react");
  });

  it("keeps state changes immediate for reduced motion", async () => {
    mockReducedMotion();
    const user = userEvent.setup();
    renderTabs();

    await user.click(screen.getByRole("tab", { name: "Alerts" }));

    expect(screen.getByRole("tab", { name: "Alerts" })).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByRole("tab", { name: "Inbox" })).toHaveAttribute(
      "data-state",
      "inactive",
    );
  });

  it("renders on the server", () => {
    const html = renderToStaticMarkup(
      <FluidTabs aria-label="Workspace" tabs={TABS} />,
    );

    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain("Inbox");
  });

  it("has no obvious accessibility violations", async () => {
    const { container } = render(
      <>
        <FluidTabs aria-label="Workspace" tabs={TABS} />
        {TABS.map((tab, index) => (
          <div
            aria-labelledby={tab.id}
            hidden={index !== 0}
            id={tab.panelId}
            key={tab.value}
            role="tabpanel"
          >
            {tab.label} content
          </div>
        ))}
      </>,
    );

    expect((await axe(container)).violations).toEqual([]);
  });
});
