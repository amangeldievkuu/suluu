import { act, render, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { axe } from "vitest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CounterNumbers } from "../src/counter-numbers/counter-numbers";

function accessibleValue(container: HTMLElement): HTMLElement {
  const value = container.querySelector<HTMLElement>(
    '[data-slot="counter-value"]',
  );
  if (!value) throw new Error("Expected an accessible counter value.");
  return value;
}

function visualValue(container: HTMLElement): HTMLElement {
  const value = container.querySelector<HTMLElement>(
    '[data-slot="counter-visual"]',
  );
  if (!value) throw new Error("Expected a visual counter value.");
  return value;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CounterNumbers", () => {
  it("renders a stable, accessible default value without animating on mount", () => {
    const { container } = render(<CounterNumbers value={1284} />);
    const counter = container.querySelector('[data-slot="counter-numbers"]');

    expect(counter).toHaveClass("tabular-nums");
    expect(accessibleValue(container)).toHaveTextContent("1,284");
    expect(visualValue(container)).toHaveTextContent("1,284");
    expect(visualValue(container)).toHaveAttribute("aria-hidden", "true");
    expect(visualValue(container)).toHaveAttribute("data-direction", "none");
    expect(counter).not.toHaveAttribute("aria-live");
  });

  it("formats decimals, currencies, percentages, and compact values", () => {
    const { container, rerender } = render(
      <CounterNumbers
        formatOptions={{ currency: "EUR", style: "currency" }}
        locales="de-DE"
        value={1234.56}
      />,
    );

    expect(accessibleValue(container).textContent).toBe("1.234,56 €");

    rerender(
      <CounterNumbers
        formatOptions={{ maximumFractionDigits: 1, style: "percent" }}
        value={0.123}
      />,
    );
    expect(accessibleValue(container).textContent).toBe("12.3%");

    rerender(
      <CounterNumbers
        formatOptions={{ maximumFractionDigits: 1, notation: "compact" }}
        value={1250}
      />,
    );
    expect(accessibleValue(container).textContent).toBe("1.3K");
  });

  it("preserves localized digits and bidirectional formatting literals", () => {
    const { container } = render(
      <CounterNumbers locales="ar-EG" value={-1234.5} />,
    );

    expect(accessibleValue(container).textContent).toBe("؜-١٬٢٣٤٫٥");
    expect(visualValue(container).textContent).toBe("؜-١٬٢٣٤٫٥");
  });

  it("animates exponent digits in scientific notation", () => {
    const { container, rerender } = render(
      <CounterNumbers
        formatOptions={{ notation: "scientific" }}
        value={1234}
      />,
    );

    expect(accessibleValue(container)).toHaveTextContent("1.234E3");
    expect(container.querySelector('[data-token="exponent:0"]')).toBeVisible();

    rerender(
      <CounterNumbers
        formatOptions={{ notation: "scientific" }}
        value={12340}
      />,
    );
    expect(accessibleValue(container)).toHaveTextContent("1.234E4");
    expect(visualValue(container)).toHaveAttribute(
      "data-direction",
      "increase",
    );
  });

  it("rolls changed places in the numeric direction across carries", async () => {
    const { container, rerender } = render(<CounterNumbers value={999} />);

    rerender(<CounterNumbers value={1000} />);

    expect(accessibleValue(container)).toHaveTextContent("1,000");
    expect(visualValue(container)).toHaveAttribute(
      "data-direction",
      "increase",
    );
    await waitFor(() => {
      const increasingDigits = container.querySelectorAll(
        '[data-slot="counter-digit"] [data-direction="increase"]',
      );
      expect(increasingDigits.length).toBeGreaterThan(0);
    });

    rerender(<CounterNumbers value={98} />);
    expect(visualValue(container)).toHaveAttribute(
      "data-direction",
      "decrease",
    );
    await waitFor(() => {
      const decreasingDigits = container.querySelectorAll(
        '[data-slot="counter-digit"] [data-direction="decrease"]',
      );
      expect(decreasingDigits.length).toBeGreaterThan(0);
    });
  });

  it("keeps unchanged digits and separators mounted", () => {
    const { container, rerender } = render(<CounterNumbers value={1284} />);
    const thousandsDigit = container.querySelector(
      '[data-token="integer:3"] > span',
    );
    const group = container.querySelector('[data-token="group:3"] > span');

    rerender(<CounterNumbers value={1285} />);

    expect(container.querySelector('[data-token="integer:3"] > span')).toBe(
      thousandsDigit,
    );
    expect(container.querySelector('[data-token="group:3"] > span')).toBe(
      group,
    );
  });

  it("does not start a new transition when the formatted value is unchanged", () => {
    const { container, rerender } = render(
      <CounterNumbers
        formatOptions={{ maximumFractionDigits: 2 }}
        value={1.234}
      />,
    );

    rerender(
      <CounterNumbers
        formatOptions={{ maximumFractionDigits: 2 }}
        value={1.2344}
      />,
    );

    expect(accessibleValue(container)).toHaveTextContent("1.23");
    expect(visualValue(container)).toHaveAttribute("data-direction", "none");
  });

  it("retargets rapid updates to the latest formatted value", () => {
    const { container, rerender } = render(<CounterNumbers value={10} />);

    rerender(<CounterNumbers value={250} />);
    rerender(<CounterNumbers value={7} />);

    expect(accessibleValue(container)).toHaveTextContent("7");
    expect(visualValue(container).textContent.endsWith("7")).toBe(true);
  });

  it.each(["subtle", "default", "expressive"] as const)(
    "supports the %s motion intensity",
    (motionIntensity) => {
      const { container, rerender } = render(
        <CounterNumbers motionIntensity={motionIntensity} value={1} />,
      );
      rerender(<CounterNumbers motionIntensity={motionIntensity} value={2} />);

      expect(visualValue(container)).toHaveTextContent("2");
      expect(visualValue(container)).toHaveAttribute(
        "data-direction",
        "increase",
      );
    },
  );

  it("supports opt-in atomic live announcements", () => {
    const { container } = render(
      <CounterNumbers aria-live="polite" value={42} />,
    );
    const counter = container.querySelector('[data-slot="counter-numbers"]');

    expect(counter).toHaveAttribute("aria-live", "polite");
    expect(counter).toHaveAttribute("aria-atomic", "true");
  });

  it("honors an explicit aria-atomic override", () => {
    const { container } = render(
      <CounterNumbers aria-atomic="false" aria-live="assertive" value={42} />,
    );
    const counter = container.querySelector('[data-slot="counter-numbers"]');

    expect(counter).toHaveAttribute("aria-atomic", "false");
  });

  it("forwards native attributes, class names, styles, and refs", () => {
    const ref = createRef<HTMLSpanElement>();
    const { container } = render(
      <CounterNumbers
        className="custom-counter"
        data-purpose="score"
        ref={ref}
        style={{ color: "red" }}
        title="Current score"
        value={42}
      />,
    );
    const counter = container.querySelector('[data-slot="counter-numbers"]');

    expect(ref.current).toBe(counter);
    expect(counter).toHaveClass("custom-counter");
    expect(counter).toHaveAttribute("data-purpose", "score");
    expect(counter).toHaveAttribute("title", "Current score");
    expect(counter).toHaveStyle({ color: "rgb(255, 0, 0)" });
  });

  it("renders non-finite Intl values without attempting directional motion", () => {
    const { container, rerender } = render(<CounterNumbers value={Infinity} />);

    expect(accessibleValue(container)).toHaveTextContent("∞");
    rerender(<CounterNumbers value={Number.NaN} />);
    expect(accessibleValue(container)).toHaveTextContent("NaN");
    expect(visualValue(container)).toHaveAttribute("data-direction", "none");
  });

  it("renders consistently on the server", () => {
    const markup = renderToStaticMarkup(
      <CounterNumbers locales="en-US" value={1234.5} />,
    );

    expect(markup).toContain('data-slot="counter-numbers"');
    expect(markup).toContain("1,234.5");
    expect(markup).toContain('aria-hidden="true"');
  });

  it("changes immediately when reduced motion is preferred", () => {
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
    const { container, rerender } = render(<CounterNumbers value={12} />);

    rerender(<CounterNumbers value={345} />);

    expect(accessibleValue(container)).toHaveTextContent("345");
    expect(visualValue(container)).toHaveTextContent("345");
    expect(
      container.querySelector('[data-slot="counter-digit"] [style]'),
    ).not.toBeInTheDocument();
  });

  it("removes animation layers when reduced motion is enabled live", () => {
    let reducedMotion = false;
    const listeners = new Set<EventListener>();
    const mediaQuery = {
      addEventListener: (
        _type: string,
        listener: EventListenerOrEventListenerObject,
      ) => {
        if (typeof listener === "function") listeners.add(listener);
      },
      addListener: () => undefined,
      dispatchEvent: () => false,
      get matches() {
        return reducedMotion;
      },
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      removeEventListener: (
        _type: string,
        listener: EventListenerOrEventListenerObject,
      ) => {
        if (typeof listener === "function") listeners.delete(listener);
      },
      removeListener: () => undefined,
    } as MediaQueryList;
    vi.spyOn(window, "matchMedia").mockReturnValue(mediaQuery);
    const { container, rerender } = render(<CounterNumbers value={12} />);

    rerender(<CounterNumbers value={24} />);
    expect(
      container.querySelector('[data-slot="counter-digit"] [style]'),
    ).toBeInTheDocument();

    act(() => {
      reducedMotion = true;
      const event = new Event("change");
      for (const listener of listeners) listener(event);
    });
    rerender(<CounterNumbers value={36} />);

    expect(visualValue(container)).toHaveTextContent("36");
    expect(
      container.querySelector('[data-slot="counter-digit"] [style]'),
    ).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <p>
        <CounterNumbers aria-live="polite" value={1284} /> downloads
      </p>,
    );

    expect(
      (
        await axe(container, {
          rules: { "color-contrast": { enabled: false } },
        })
      ).violations,
    ).toEqual([]);
  });
});
