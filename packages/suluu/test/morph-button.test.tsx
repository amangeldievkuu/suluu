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

import { MorphButton } from "../src/morph-button/morph-button";

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
        get matches() {
          return query.includes("prefers-reduced-motion")
            ? state.reducedMotion
            : state.hover;
        },
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

function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}

/**
 * Both content layers stay mounted, so the pill sizes itself from the measured
 * expanded content. jsdom reports no layout, so tests that care about the width
 * spring stub the measurement the component reads.
 */
function stubContentMeasurement(width: number) {
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
      return this.dataset.slot === "morph-button-expanded-content" ? width : 0;
    },
  );
}

function renderButton(
  props: Partial<React.ComponentProps<typeof MorphButton>> = {},
) {
  return render(
    <MorphButton
      aria-label="Create new"
      compactContent={<PlusIcon />}
      expandedContent={
        <>
          <PlusIcon />
          <span>Create new</span>
        </>
      }
      {...props}
    />,
  );
}

beforeEach(() => {
  mockMediaQueries({ hover: true, reducedMotion: false });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("MorphButton", () => {
  it("starts as a compact native button with a stable accessible name", () => {
    const { container } = renderButton();
    const button = screen.getByRole("button", { name: "Create new" });

    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveAttribute("data-expanded", "false");
    expect(
      container.querySelector('[data-slot="morph-button-compact-content"]'),
    ).toHaveAttribute("data-state", "visible");
    expect(
      container.querySelector('[data-slot="morph-button-expanded-content"]'),
    ).toHaveAttribute("data-state", "hidden");
  });

  it("previews the expanded content on fine-pointer hover", () => {
    const { container } = renderButton();
    const button = screen.getByRole("button", { name: "Create new" });

    fireEvent.pointerEnter(button);

    expect(button).toHaveAttribute("data-expanded", "true");
    expect(
      container.querySelector('[data-slot="morph-button-expanded-content"]'),
    ).toHaveTextContent("Create new");

    fireEvent.pointerLeave(button);
    expect(button).toHaveAttribute("data-expanded", "false");
  });

  it("settles on the latest intent during rapid pointer transitions", async () => {
    const { container } = renderButton();
    const button = screen.getByRole("button", { name: "Create new" });

    const compact = container.querySelector(
      '[data-slot="morph-button-compact-content"]',
    );
    const expandedContent = container.querySelector(
      '[data-slot="morph-button-expanded-content"]',
    );

    fireEvent.pointerEnter(button);
    fireEvent.pointerLeave(button);
    fireEvent.pointerEnter(button);

    expect(button).toHaveAttribute("data-expanded", "true");
    // The crossfade reverses in place instead of remounting, so the compact
    // layer is only hidden once its fade has finished.
    await waitFor(() => {
      expect(compact).toHaveStyle({ visibility: "hidden" });
      expect(expandedContent).toHaveStyle({ opacity: "1" });
    });
    expect(expandedContent).toHaveTextContent("Create new");

    fireEvent.pointerLeave(button);

    expect(button).toHaveAttribute("data-expanded", "false");
    await waitFor(() => {
      expect(expandedContent).toHaveStyle({ visibility: "hidden" });
      expect(compact).toHaveStyle({ opacity: "1", visibility: "visible" });
    });
  });

  it("does not preview pointer hover on touch or coarse-pointer devices", () => {
    vi.restoreAllMocks();
    mockMediaQueries({ hover: false, reducedMotion: false });
    renderButton();
    const button = screen.getByRole("button", { name: "Create new" });

    fireEvent.pointerEnter(button);

    expect(button).toHaveAttribute("data-expanded", "false");
  });

  it("clears a pointer preview when hover capability disappears", async () => {
    vi.restoreAllMocks();
    const media = mockMediaQueries({ hover: true, reducedMotion: false });
    renderButton();
    const button = screen.getByRole("button", { name: "Create new" });

    fireEvent.pointerEnter(button);
    expect(button).toHaveAttribute("data-expanded", "true");

    media.change({ hover: false });
    await waitFor(() =>
      expect(button).toHaveAttribute("data-expanded", "false"),
    );

    media.change({ hover: true });
    expect(button).toHaveAttribute("data-expanded", "false");
  });

  it("previews on focus-visible and collapses on blur", () => {
    renderButton();
    const button = screen.getByRole("button", { name: "Create new" });
    vi.spyOn(button, "matches").mockImplementation(
      (selector) => selector === ":focus-visible",
    );

    fireEvent.focus(button);
    expect(button).toHaveAttribute("data-expanded", "true");

    fireEvent.blur(button);
    expect(button).toHaveAttribute("data-expanded", "false");
  });

  it("does not hold open focus received from a pointer", () => {
    renderButton();
    const button = screen.getByRole("button", { name: "Create new" });
    vi.spyOn(button, "matches").mockReturnValue(false);

    fireEvent.focus(button);

    expect(button).toHaveAttribute("data-expanded", "false");
  });

  it("keeps externally expanded state open after transient previews end", () => {
    const { rerender } = renderButton({ expanded: true });
    const button = screen.getByRole("button", { name: "Create new" });

    fireEvent.pointerEnter(button);
    fireEvent.pointerLeave(button);
    expect(button).toHaveAttribute("data-expanded", "true");

    rerender(
      <MorphButton
        aria-label="Create new"
        compactContent={<PlusIcon />}
        expanded={false}
        expandedContent={<span>Create new</span>}
      />,
    );
    expect(button).toHaveAttribute("data-expanded", "false");

    fireEvent.pointerEnter(button);
    expect(button).toHaveAttribute("data-expanded", "true");
  });

  it("does not preview while disabled but can display external state", () => {
    const { rerender } = renderButton({ disabled: true });
    const button = screen.getByRole("button", { name: "Create new" });

    fireEvent.pointerEnter(button);
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("data-expanded", "false");

    rerender(
      <MorphButton
        aria-label="Create new"
        compactContent={<PlusIcon />}
        disabled
        expanded
        expandedContent={<span>Create new</span>}
      />,
    );
    expect(button).toHaveAttribute("data-expanded", "true");
  });

  it("preserves consumer pointer and focus handlers", () => {
    const onBlur = vi.fn();
    const onFocus = vi.fn();
    const onPointerEnter = vi.fn();
    const onPointerLeave = vi.fn();
    renderButton({ onBlur, onFocus, onPointerEnter, onPointerLeave });
    const button = screen.getByRole("button", { name: "Create new" });
    vi.spyOn(button, "matches").mockReturnValue(true);

    fireEvent.pointerEnter(button);
    fireEvent.pointerLeave(button);
    fireEvent.focus(button);
    fireEvent.blur(button);

    expect(onPointerEnter).toHaveBeenCalledOnce();
    expect(onPointerLeave).toHaveBeenCalledOnce();
    expect(onFocus).toHaveBeenCalledOnce();
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it("honors a prevented focus preview", () => {
    renderButton({ onFocus: (event) => event.preventDefault() });
    const button = screen.getByRole("button", { name: "Create new" });
    vi.spyOn(button, "matches").mockReturnValue(true);

    fireEvent.focus(button);

    expect(button).toHaveAttribute("data-expanded", "false");
  });

  it("activates immediately like a native button", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderButton({ onClick });
    const button = screen.getByRole("button", { name: "Create new" });

    await user.click(button);
    await user.keyboard("{Enter}");

    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("accepts native attributes, class names, and inline styles", () => {
    renderButton({
      className: "custom-morph",
      name: "create",
      style: { opacity: 0.5 },
      type: "submit",
      value: "new",
    });
    const button = screen.getByRole("button", { name: "Create new" });

    expect(button).toHaveAttribute("type", "submit");
    expect(button).toHaveAttribute("name", "create");
    expect(button).toHaveAttribute("value", "new");
    expect(button).toHaveClass("custom-morph", "rounded-full");
    expect(button).toHaveStyle({ borderRadius: "9999px", opacity: "0.5" });
  });

  it("forwards object refs", () => {
    const objectRef = createRef<HTMLButtonElement>();
    renderButton({ ref: objectRef });

    expect(objectRef.current).toBe(
      screen.getByRole("button", { name: "Create new" }),
    );
  });

  it("forwards callback refs", () => {
    const callbackRef = vi.fn();
    const { unmount } = renderButton({ ref: callbackRef });

    expect(callbackRef).toHaveBeenCalledWith(
      screen.getByRole("button", { name: "Create new" }),
    );

    unmount();
    expect(callbackRef).toHaveBeenLastCalledWith(null);
  });

  it("switches content without spatial motion when reduced motion is preferred", async () => {
    vi.restoreAllMocks();
    mockMediaQueries({ hover: true, reducedMotion: true });
    const { container } = renderButton();
    const button = screen.getByRole("button", { name: "Create new" });

    fireEvent.pointerEnter(button);

    expect(button).toHaveAttribute("data-expanded", "true");
    const content = container.querySelector(
      '[data-slot="morph-button-expanded-content"]',
    );
    const compact = container.querySelector(
      '[data-slot="morph-button-compact-content"]',
    );

    // The label settles with no filter left behind, and the icon leaves without
    // blur, rotation, or scale.
    await waitFor(() =>
      expect(content).toHaveStyle({ filter: "none", opacity: "1" }),
    );
    expect(compact).toHaveStyle({
      filter: "blur(0px)",
      opacity: "0",
      transform: "none",
    });
  });

  it("springs its own width once the expanded content is measured", async () => {
    stubContentMeasurement(168);
    renderButton();
    const button = screen.getByRole("button", { name: "Create new" });

    fireEvent.pointerEnter(button);

    await waitFor(() => expect(button).toHaveStyle({ width: "168px" }), {
      timeout: 3000,
    });

    fireEvent.pointerLeave(button);

    await waitFor(() => expect(button).toHaveStyle({ width: "48px" }), {
      timeout: 3000,
    });
  });

  it("falls back to its width classes while the content is unmeasured", () => {
    renderButton();
    const button = screen.getByRole("button", { name: "Create new" });

    expect(button).toHaveClass("w-12");
    expect(button.style.width).toBe("");

    fireEvent.pointerEnter(button);

    expect(button).toHaveClass("w-auto");
    expect(button.style.width).toBe("");
  });

  it("renders the requested initial state on the server", () => {
    const markup = renderToStaticMarkup(
      <MorphButton
        aria-label="Create new"
        compactContent={<PlusIcon />}
        expanded
        expandedContent={<span>Create new</span>}
      />,
    );

    expect(markup).toContain('data-expanded="true"');
    expect(markup).toContain("Create new");
  });

  it.each(["subtle", "default", "expressive"] as const)(
    "is accessible at %s motion intensity",
    async (motionIntensity) => {
      const { container } = renderButton({ motionIntensity });

      const results = await axe(container, {
        rules: { "color-contrast": { enabled: false } },
      });
      expect(results.violations).toEqual([]);
    },
  );
});
