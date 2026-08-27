import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";

import { DurationPill } from "../src/duration-pill/duration-pill";

afterEach(() => {
  vi.restoreAllMocks();
});

it("keeps the complete editor immediate and functional with reduced motion", async () => {
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
  const onValueChange = vi.fn();
  render(
    <DurationPill
      defaultValue={{ hours: 0, minutes: 20, seconds: 0 }}
      onValueChange={onValueChange}
    />,
  );

  await user.click(screen.getByRole("button", { name: /Edit duration/ }));
  const hours = screen.getByRole("spinbutton", { name: "Hours" });
  await waitFor(() => expect(hours).toHaveFocus());
  fireEvent.change(screen.getByRole("spinbutton", { name: "Minutes" }), {
    target: { value: "25" },
  });
  await user.click(screen.getByRole("button", { name: "Confirm duration" }));

  expect(onValueChange).toHaveBeenCalledExactlyOnceWith({
    hours: 0,
    minutes: 25,
    seconds: 0,
  });
  await waitFor(() =>
    expect(
      screen.getByRole("button", {
        name: "Edit duration: 25 Min",
      }),
    ).toBeVisible(),
  );
});
