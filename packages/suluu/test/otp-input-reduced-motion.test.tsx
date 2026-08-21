import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";

import { OtpInput } from "../src/otp-input/otp-input";

afterEach(() => {
  vi.restoreAllMocks();
});

it("keeps OTP interaction immediate when reduced motion is preferred", async () => {
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
  const { container } = render(<OtpInput length={4} />);
  const input = screen.getByRole("textbox");

  await user.click(input);
  await user.keyboard("12");

  expect(input).toHaveValue("12");
  await waitFor(() => {
    const activeSlot = container.querySelector<HTMLElement>(
      '[data-active="true"]',
    );
    const active = activeSlot?.querySelector<HTMLElement>(
      '[data-slot="otp-input-active"]',
    );
    const caret = activeSlot?.querySelector<HTMLElement>(
      '[data-slot="otp-input-caret"]',
    );
    const track = container.querySelector<HTMLElement>(
      '[data-slot="otp-input-track"]',
    );
    expect(active).toBeVisible();
    expect(active?.style.transition).toBe("");
    expect(caret).toHaveStyle({ opacity: "1" });
    expect(track).toHaveStyle({ transform: "none" });
  });
});
