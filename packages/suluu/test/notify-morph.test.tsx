import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";

import { NotifyMorph } from "../src/notify-morph/notify-morph";

describe("NotifyMorph", () => {
  it("starts collapsed and expands with focus on activation", async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();

    render(<NotifyMorph onExpandedChange={onExpandedChange} />);
    await user.click(screen.getByRole("button", { name: "Notify Me" }));

    const input = await screen.findByRole("textbox", { name: "Email address" });
    await waitFor(() => expect(input).toHaveFocus());
    expect(onExpandedChange).toHaveBeenCalledWith(true);
  });

  it("supports keyboard expansion and Escape focus restoration", async () => {
    const user = userEvent.setup();

    render(<NotifyMorph />);
    const trigger = screen.getByRole("button", { name: "Notify Me" });
    trigger.focus();
    await user.keyboard("{Enter}");
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Notify Me" })).toHaveFocus();
    });
  });

  it("morphs one persistent action between the bell trigger and submit state", async () => {
    const user = userEvent.setup();
    const { container } = render(<NotifyMorph />);
    const action = screen.getByRole("button", { name: "Notify Me" });

    expect(action).toHaveAttribute("type", "button");
    expect(container.querySelector('[data-slot="notify-bell"]')).toBeVisible();

    await user.click(action);

    const input = await screen.findByRole("textbox", {
      name: "Email address",
    });
    const submit = screen.getByRole("button", { name: "Notify Me" });
    expect(submit).toBe(action);
    expect(submit).toHaveAttribute("type", "submit");
    expect(input).toHaveAttribute("placeholder", "Email");
    await waitFor(() => {
      expect(container.querySelector('[data-slot="notify-bell"]')).toBeNull();
    });

    await user.keyboard("{Escape}");

    expect(screen.getByRole("button", { name: "Notify Me" })).toBe(action);
    expect(action).toHaveAttribute("type", "button");
    await waitFor(() => {
      expect(
        container.querySelector('[data-slot="notify-bell"]'),
      ).toBeVisible();
    });
  });

  it("restarts the bell animation when the collapsed button is hovered", () => {
    const { container } = render(<NotifyMorph />);
    const button = screen.getByRole("button", { name: "Notify Me" });
    const firstBell = container.querySelector('[data-slot="notify-bell"]');

    fireEvent.pointerEnter(button);

    expect(container.querySelector('[data-slot="notify-bell"]')).not.toBe(
      firstBell,
    );
  });

  it("manages uncontrolled values and emits value changes", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <NotifyMorph
        defaultExpanded
        defaultValue="a"
        onValueChange={onValueChange}
      />,
    );
    const input = screen.getByRole("textbox", { name: "Email address" });
    await user.type(input, "@example.com");

    expect(input).toHaveValue("a@example.com");
    expect(onValueChange).toHaveBeenLastCalledWith("a@example.com");
  });

  it("keeps controlled value and expansion state authoritative", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onExpandedChange = vi.fn();
    const { rerender } = render(
      <NotifyMorph
        expanded={false}
        onExpandedChange={onExpandedChange}
        onValueChange={onValueChange}
        value="owner@suluu.dev"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Notify Me" }));
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

    rerender(
      <NotifyMorph
        expanded
        onExpandedChange={onExpandedChange}
        onValueChange={onValueChange}
        value="owner@suluu.dev"
      />,
    );
    const input = await screen.findByRole("textbox", { name: "Email address" });
    await user.type(input, "x");

    expect(onValueChange).toHaveBeenCalledWith("owner@suluu.devx");
    expect(input).toHaveValue("owner@suluu.dev");
  });

  it("submits a valid email, clears it, and collapses", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onValueChange = vi.fn();
    const onExpandedChange = vi.fn();

    render(
      <NotifyMorph
        defaultExpanded
        defaultValue="hello@suluu.dev"
        label="Join waitlist"
        onExpandedChange={onExpandedChange}
        onSubmit={onSubmit}
        onValueChange={onValueChange}
      />,
    );
    const input = screen.getByRole("textbox");
    await user.click(screen.getByRole("button", { name: "Join waitlist" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]?.[0]).toBe("hello@suluu.dev");
    expect(onSubmit.mock.calls[0]?.[1]).toBeInstanceOf(Object);
    expect(onValueChange).toHaveBeenLastCalledWith("");
    expect(onExpandedChange).toHaveBeenLastCalledWith(false);
    expect(input).toHaveValue("");
    await waitFor(() => expect(screen.queryByRole("textbox")).toBeNull());
    expect(screen.getByRole("button", { name: "Join waitlist" })).toBeVisible();
  });

  it("shows a liquid confirmation for three seconds", () => {
    const setTimeoutSpy = vi.spyOn(window, "setTimeout");

    try {
      const { container } = render(
        <NotifyMorph
          defaultExpanded
          defaultValue="hello@suluu.dev"
          successDuration={3000}
        />,
      );
      const form = container.querySelector("form");
      if (!form) throw new Error("Expected NotifyMorph to render a form.");

      fireEvent.submit(form);

      expect(screen.getByRole("status")).toHaveTextContent(
        "You're on the list, hello@suluu.dev.",
      );
      expect(container.querySelector('[data-slot="notify-success"]')).toBe(
        screen.getByRole("status").parentElement,
      );
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 3000);
    } finally {
      setTimeoutSpy.mockRestore();
    }
  });

  it("supports custom confirmation copy", () => {
    const { container } = render(
      <NotifyMorph
        defaultExpanded
        defaultValue="hello@suluu.dev"
        successMessage={(email) => `Subscribed ${email}`}
      />,
    );
    const form = container.querySelector("form");
    if (!form) throw new Error("Expected NotifyMorph to render a form.");

    fireEvent.submit(form);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Subscribed hello@suluu.dev",
    );
  });

  it.each(["", "not-an-email", "hello@"])(
    "does not submit the invalid email %j",
    async (email) => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(
        <NotifyMorph
          defaultExpanded
          defaultValue={email}
          onSubmit={onSubmit}
        />,
      );
      await user.click(screen.getByRole("button", { name: "Notify Me" }));

      expect(onSubmit).not.toHaveBeenCalled();
    },
  );

  it("collapses by default when the user clicks outside", async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();

    render(
      <div>
        <NotifyMorph defaultExpanded onExpandedChange={onExpandedChange} />
        <button type="button">Outside</button>
      </div>,
    );
    screen.getByRole("textbox").focus();
    await user.click(screen.getByRole("button", { name: "Outside" }));

    expect(onExpandedChange).toHaveBeenCalledWith(false);
    await waitFor(() => expect(screen.queryByRole("textbox")).toBeNull());
  });

  it("supports opting out of outside-click collapse", async () => {
    const user = userEvent.setup();

    render(
      <div>
        <NotifyMorph collapseOnBlur={false} defaultExpanded />
        <button type="button">Outside</button>
      </div>,
    );
    screen.getByRole("textbox").focus();
    await user.click(screen.getByRole("button", { name: "Outside" }));

    expect(screen.getByRole("textbox")).toBeVisible();
  });

  it("forwards the form ref and safe native attributes", () => {
    const ref = createRef<HTMLFormElement>();

    render(
      <NotifyMorph
        aria-label="Product updates"
        data-testid="notify-form"
        ref={ref}
      />,
    );

    expect(ref.current).toBe(screen.getByTestId("notify-form"));
    expect(ref.current).toHaveAccessibleName("Product updates");
  });

  it("supports callback refs and aria-labelledby", () => {
    const ref = vi.fn();

    render(
      <div>
        <span id="notify-label">Product announcements</span>
        <NotifyMorph
          aria-labelledby="notify-label"
          className="custom"
          ref={ref}
        />
      </div>,
    );

    const form = screen.getByRole("form", { name: "Product announcements" });
    expect(form).toHaveClass("custom");
    expect(ref).toHaveBeenCalledWith(form);
  });

  it("honors prevented keyboard and blur handlers", () => {
    const onExpandedChange = vi.fn();

    render(
      <NotifyMorph
        collapseOnBlur
        defaultExpanded
        onBlur={(event) => event.preventDefault()}
        onExpandedChange={onExpandedChange}
        onKeyDown={(event) => event.preventDefault()}
      />,
    );
    const input = screen.getByRole("textbox");
    fireEvent.keyDown(input, { key: "Escape" });
    fireEvent.blur(input);

    expect(onExpandedChange).not.toHaveBeenCalled();
    expect(input).toBeVisible();
  });

  it("keeps focus moves inside the form expanded", async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();

    render(
      <NotifyMorph
        collapseOnBlur
        defaultExpanded
        onExpandedChange={onExpandedChange}
      />,
    );
    screen.getByRole("textbox").focus();
    await user.tab();

    expect(screen.getByRole("button", { name: "Notify Me" })).toHaveFocus();
    expect(onExpandedChange).not.toHaveBeenCalled();
  });

  it("reports invalid programmatic submissions", () => {
    const onSubmit = vi.fn();
    const { container } = render(
      <NotifyMorph defaultExpanded onSubmit={onSubmit} />,
    );
    const form = container.querySelector("form");
    if (!form) throw new Error("Expected NotifyMorph to render a form.");
    vi.spyOn(form, "checkValidity").mockReturnValue(false);
    const reportValidity = vi
      .spyOn(form, "reportValidity")
      .mockReturnValue(false);

    fireEvent.submit(form);

    expect(reportValidity).toHaveBeenCalledOnce();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("ignores programmatic submissions while disabled", () => {
    const onSubmit = vi.fn();
    const { container } = render(
      <NotifyMorph defaultExpanded disabled onSubmit={onSubmit} />,
    );
    const form = container.querySelector("form");
    if (!form) throw new Error("Expected NotifyMorph to render a form.");
    const reportValidity = vi.spyOn(form, "reportValidity");

    fireEvent.submit(form);

    expect(reportValidity).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("allows valid native submission without requiring a callback", async () => {
    const { container } = render(
      <NotifyMorph defaultExpanded defaultValue="valid@suluu.dev" />,
    );
    const form = container.querySelector("form");
    if (!form) throw new Error("Expected NotifyMorph to render a form.");

    expect(() => fireEvent.submit(form)).not.toThrow();
    await waitFor(() => expect(screen.queryByRole("textbox")).toBeNull());
  });

  it("disables every interactive control", () => {
    render(<NotifyMorph defaultExpanded disabled />);

    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Notify Me" })).toBeDisabled();
  });

  it.each(["subtle", "default", "expressive"] as const)(
    "is accessible at %s motion intensity",
    async (motionIntensity) => {
      const { container } = render(
        <NotifyMorph defaultExpanded motionIntensity={motionIntensity} />,
      );

      const results = await axe(container, {
        rules: { "color-contrast": { enabled: false } },
      });
      expect(results.violations).toEqual([]);
    },
  );

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

    render(<NotifyMorph />);
    await user.click(screen.getByRole("button", { name: "Notify Me" }));

    const input = await screen.findByRole("textbox");
    await waitFor(() => expect(input).toHaveFocus());
  });
});
