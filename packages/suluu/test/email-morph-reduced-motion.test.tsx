import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";

import { EmailMorph } from "../src/email-morph/email-morph";

afterEach(() => {
  vi.restoreAllMocks();
});

it("uses a non-liquid but functional reduced-motion state", async () => {
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
  const user = userEvent.setup();
  const { container } = render(<EmailMorph />);

  await user.click(screen.getByRole("textbox"));

  expect(screen.getByRole("form")).toHaveAttribute("data-expanded", "true");
  expect(
    container.querySelector('[data-slot="email-morph-bridge"]'),
  ).toBeNull();
  expect(
    container.querySelector('[data-slot="email-morph-liquid-field"]'),
  ).toBeNull();
  expect(
    container.querySelector('[data-slot="email-morph-liquid-neck"]'),
  ).toBeNull();
  expect(
    container.querySelector('[data-slot="email-morph-liquid-drop"]'),
  ).toBeNull();
  expect(
    container.querySelector('[data-slot="email-morph-field"]'),
  ).not.toHaveClass("border");
  expect(
    container.querySelector('[data-slot="email-morph-action-surface"]'),
  ).not.toHaveClass("border");
  expect(screen.getByRole("textbox")).not.toHaveClass("focus-visible:ring-2");

  await user.click(screen.getByRole("button", { name: "Subscribe" }));
  expect(
    container.querySelector('[data-slot="email-morph-error-shimmer"]'),
  ).toBeNull();
});
