import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { axe } from "vitest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SpotlightCard } from "../src/spotlight-card/spotlight-card";

interface MediaState {
  hover: boolean;
  reducedMotion: boolean;
}

function mockMediaQueries(state: MediaState) {
  const listeners = new Set<() => void>();
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query) =>
      ({
        addEventListener: (_type: string, listener: () => void) => {
          listeners.add(listener);
        },
        addListener: () => undefined,
        dispatchEvent: () => false,
        matches: query.includes("prefers-reduced-motion")
          ? state.reducedMotion
          : state.hover,
        media: query,
        onchange: null,
        removeEventListener: (_type: string, listener: () => void) => {
          listeners.delete(listener);
        },
        removeListener: () => undefined,
      }) as unknown as MediaQueryList,
  );

  return {
    change(next: Partial<MediaState>) {
      Object.assign(state, next);
      act(() => {
        for (const listener of listeners) listener();
      });
    },
  };
}

function makeDomRect(): DOMRect {
  return {
    bottom: 260,
    height: 160,
    left: 100,
    right: 420,
    toJSON: () => ({}),
    top: 100,
    width: 320,
    x: 100,
    y: 100,
  };
}

function renderCard(
  element: React.ReactElement = <SpotlightCard>Plan</SpotlightCard>,
) {
  const view = render(element);
  const card = screen.getByText("Plan").closest('[data-slot="spotlight-card"]');
  if (!(card instanceof HTMLDivElement))
    throw new Error("Card did not render.");
  const rect = vi
    .spyOn(card, "getBoundingClientRect")
    .mockReturnValue(makeDomRect());

  return { ...view, card, rect };
}

async function expectActive(card: HTMLElement, active: boolean) {
  await waitFor(() => {
    expect(card).toHaveAttribute(
      "data-spotlight-active",
      active ? "true" : "false",
    );
  });
}

async function flushFrames() {
  await act(async () => {
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 32);
    });
  });
}

beforeEach(() => {
  mockMediaQueries({ hover: true, reducedMotion: false });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SpotlightCard", () => {
  it("renders a neutral div surface with its content above decorative light", () => {
    const { card, container } = renderCard();
    const effects = container.querySelector(
      '[data-slot="spotlight-card-effects"]',
    );
    const content = container.querySelector(
      '[data-slot="spotlight-card-content"]',
    );

    expect(card.tagName).toBe("DIV");
    expect(card).toHaveClass("rounded-[var(--suluu-spotlight-card-radius)]");
    expect(effects).toHaveAttribute("aria-hidden", "true");
    expect(effects).toHaveClass("pointer-events-none");
    expect(content).toHaveClass("z-10");
    expect(content).toHaveTextContent("Plan");
  });

  it("tracks a fine pointer from its local position and fades on leave", async () => {
    const { card, container } = renderCard();

    fireEvent.pointerEnter(card, {
      clientX: 180,
      clientY: 140,
      pointerType: "mouse",
    });

    await expectActive(card, true);
    const wash = container.querySelector(
      '[data-slot="spotlight-card-wash"] > div',
    );
    await waitFor(() => {
      expect(wash).toHaveStyle({
        backgroundImage: expect.stringContaining("80px 40px"),
      });
    });

    fireEvent.pointerLeave(card, { pointerType: "mouse" });
    await expectActive(card, false);
  });

  it("coalesces pointer movement into one layout read per frame", async () => {
    const { card, rect } = renderCard();
    fireEvent.pointerEnter(card, {
      clientX: 180,
      clientY: 140,
      pointerType: "mouse",
    });
    expect(rect).toHaveBeenCalledTimes(1);

    fireEvent.pointerMove(card, { clientX: 190, clientY: 145 });
    fireEvent.pointerMove(card, { clientX: 200, clientY: 150 });
    fireEvent.pointerMove(card, { clientX: 210, clientY: 155 });
    expect(rect).toHaveBeenCalledTimes(1);

    await flushFrames();
    expect(rect).toHaveBeenCalledTimes(2);
  });

  it("releases on window blur, viewport leave, and pointer cancellation", async () => {
    const { card } = renderCard();

    fireEvent.pointerEnter(card, { clientX: 180, clientY: 140 });
    await expectActive(card, true);
    fireEvent.blur(window);
    await expectActive(card, false);

    fireEvent.pointerEnter(card, { clientX: 180, clientY: 140 });
    await expectActive(card, true);
    fireEvent.pointerLeave(document.documentElement);
    await expectActive(card, false);

    fireEvent.pointerEnter(card, { clientX: 180, clientY: 140 });
    await expectActive(card, true);
    fireEvent.pointerCancel(card);
    await expectActive(card, false);
  });

  it("stays static on touch-first devices", async () => {
    mockMediaQueries({ hover: false, reducedMotion: false });
    const { card, rect } = renderCard();

    expect(card).toHaveAttribute("data-spotlight-interactive", "false");
    fireEvent.pointerEnter(card, { clientX: 180, clientY: 140 });
    await flushFrames();

    expect(rect).not.toHaveBeenCalled();
    expect(card).toHaveAttribute("data-spotlight-active", "false");
  });

  it("ignores touch events even on a hybrid fine-pointer device", async () => {
    const { card, rect } = renderCard();

    fireEvent.pointerEnter(card, {
      clientX: 180,
      clientY: 140,
      pointerType: "touch",
    });
    fireEvent.pointerMove(card, {
      clientX: 200,
      clientY: 150,
      pointerType: "touch",
    });
    await flushFrames();

    expect(rect).not.toHaveBeenCalled();
    expect(card).toHaveAttribute("data-spotlight-active", "false");
  });

  it("uses a static wash and never tracks under reduced motion", async () => {
    mockMediaQueries({ hover: true, reducedMotion: true });
    const { card, container, rect } = renderCard();

    expect(card).toHaveAttribute("data-spotlight-interactive", "false");
    expect(
      container.querySelector('[data-slot="spotlight-card-effects"] > div'),
    ).toBeInTheDocument();
    fireEvent.pointerEnter(card, { clientX: 180, clientY: 140 });
    await flushFrames();

    expect(rect).not.toHaveBeenCalled();
    expect(card).toHaveAttribute("data-spotlight-active", "false");
  });

  it("stops tracking immediately when reduced motion is enabled", async () => {
    const media = mockMediaQueries({ hover: true, reducedMotion: false });
    const { card, rect } = renderCard();

    fireEvent.pointerEnter(card, { clientX: 180, clientY: 140 });
    await expectActive(card, true);
    media.change({ reducedMotion: true });
    await expectActive(card, false);

    rect.mockClear();
    fireEvent.pointerMove(card, { clientX: 200, clientY: 150 });
    await flushFrames();
    expect(rect).not.toHaveBeenCalled();
  });

  it("starts tracking if the device gains a fine pointer", async () => {
    const media = mockMediaQueries({ hover: false, reducedMotion: false });
    const { card } = renderCard();

    media.change({ hover: true });
    fireEvent.pointerEnter(card, { clientX: 180, clientY: 140 });

    await expectActive(card, true);
  });

  it("keeps a disabled card and unavailable matchMedia inert", async () => {
    const disabledView = renderCard(
      <SpotlightCard disabled>Plan</SpotlightCard>,
    );
    fireEvent.pointerEnter(disabledView.card, { clientX: 180, clientY: 140 });
    await flushFrames();
    expect(disabledView.card).toHaveAttribute("data-disabled", "true");
    expect(disabledView.rect).not.toHaveBeenCalled();
    disabledView.unmount();

    const descriptor = Object.getOwnPropertyDescriptor(window, "matchMedia");
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: undefined,
      writable: true,
    });

    try {
      const unavailableView = renderCard();
      fireEvent.pointerEnter(unavailableView.card, {
        clientX: 180,
        clientY: 140,
      });
      await flushFrames();
      expect(unavailableView.rect).not.toHaveBeenCalled();
    } finally {
      if (descriptor) Object.defineProperty(window, "matchMedia", descriptor);
    }
  });

  it("preserves interactive descendants while disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <SpotlightCard disabled>
        <button onClick={onClick} type="button">
          Open plan
        </button>
      </SpotlightCard>,
    );

    await user.click(screen.getByRole("button", { name: "Open plan" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("merges native attributes, class names, styles, and spotlight overrides", () => {
    const onPointerEnter = vi.fn();
    const { card } = renderCard(
      <SpotlightCard
        aria-label="Project plan"
        className="custom-card"
        onPointerEnter={onPointerEnter}
        spotlightColor="rgb(120 140 255)"
        spotlightSize={420}
        style={{ opacity: 0.8 }}
      >
        Plan
      </SpotlightCard>,
    );

    fireEvent.pointerEnter(card, { clientX: 180, clientY: 140 });
    expect(onPointerEnter).toHaveBeenCalledOnce();
    expect(card).toHaveAttribute("aria-label", "Project plan");
    expect(card).toHaveClass("custom-card");
    expect(card).toHaveStyle({ opacity: "0.8" });
    expect(
      card.style.getPropertyValue("--suluu-spotlight-card-spotlight"),
    ).toBe("rgb(120 140 255)");
    expect(card.style.getPropertyValue("--suluu-spotlight-card-size")).toBe(
      "420px",
    );
  });

  it("clamps invalid spotlight sizes to a safe value", () => {
    const { card, rerender } = renderCard(
      <SpotlightCard spotlightSize={-40}>Plan</SpotlightCard>,
    );

    expect(card.style.getPropertyValue("--suluu-spotlight-card-size")).toBe(
      "0px",
    );
    rerender(<SpotlightCard spotlightSize={Number.NaN}>Plan</SpotlightCard>);
    expect(card.style.getPropertyValue("--suluu-spotlight-card-size")).toBe(
      "0px",
    );
  });

  it("forwards object and callback refs", () => {
    const objectRef = createRef<HTMLDivElement>();
    const first = render(
      <SpotlightCard ref={objectRef}>Object ref</SpotlightCard>,
    );
    expect(objectRef.current).toHaveAttribute("data-slot", "spotlight-card");
    first.unmount();

    const callbackRef = vi.fn();
    const second = render(
      <SpotlightCard ref={callbackRef}>Callback ref</SpotlightCard>,
    );
    expect(callbackRef).toHaveBeenCalledWith(
      screen.getByText("Callback ref").closest('[data-slot="spotlight-card"]'),
    );
    second.unmount();
    expect(callbackRef).toHaveBeenLastCalledWith(null);
  });

  it("stops reading layout after unmount", async () => {
    const { card, rect, unmount } = renderCard();
    fireEvent.pointerEnter(card, { clientX: 180, clientY: 140 });
    await expectActive(card, true);

    unmount();
    rect.mockClear();
    fireEvent.pointerMove(card, { clientX: 200, clientY: 150 });
    await flushFrames();
    expect(rect).not.toHaveBeenCalled();
  });

  it("renders a stable static surface on the server", () => {
    const markup = renderToStaticMarkup(<SpotlightCard>Plan</SpotlightCard>);

    expect(markup).toContain('data-spotlight-active="false"');
    expect(markup).toContain('data-spotlight-interactive="false"');
    expect(markup).toContain("Plan");
  });

  it.each(["subtle", "default", "expressive"] as const)(
    "is accessible at %s motion intensity",
    async (motionIntensity) => {
      const { container } = render(
        <SpotlightCard motionIntensity={motionIntensity}>
          <h2>Quarterly planning</h2>
          <p>Align the team around the next set of outcomes.</p>
          <a href="/plan">Open plan</a>
        </SpotlightCard>,
      );

      const results = await axe(container, {
        rules: { "color-contrast": { enabled: false } },
      });
      expect(results.violations).toEqual([]);
    },
  );
});
