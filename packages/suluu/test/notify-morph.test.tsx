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
    await user.click(screen.getByRole("button", { name: "Notify me" }));

    const input = await screen.findByRole("textbox", { name: "Email address" });
    expect(input).toHaveFocus();
    expect(onExpandedChange).toHaveBeenCalledWith(true);
  });

  it("supports keyboard expansion and Escape focus restoration", async () => {
    const user = userEvent.setup();

    render(<NotifyMorph />);
    const trigger = screen.getByRole("button", { name: "Notify me" });
    trigger.focus();
    await user.keyboard("{Enter}");
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Notify me" })).toHaveFocus();
    });
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

    await user.click(screen.getByRole("button", { name: "Notify me" }));
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

  it("submits valid email without clearing or collapsing state", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <NotifyMorph
        defaultExpanded
        defaultValue="hello@suluu.dev"
        label="Join waitlist"
        onSubmit={onSubmit}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Join waitlist" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]?.[0]).toBe("hello@suluu.dev");
    expect(onSubmit.mock.calls[0]?.[1]).toBeInstanceOf(Object);
    expect(screen.getByRole("textbox")).toHaveValue("hello@suluu.dev");
    expect(screen.getByRole("button", { name: "Join waitlist" })).toBeVisible();
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
      await user.click(screen.getByRole("button", { name: "Notify me" }));

      expect(onSubmit).not.toHaveBeenCalled();
    },
  );

  it("collapses on outside blur only when requested", async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();

    render(
      <div>
        <NotifyMorph
          collapseOnBlur
          defaultExpanded
          onExpandedChange={onExpandedChange}
        />
        <button type="button">Outside</button>
      </div>,
    );
    screen.getByRole("textbox").focus();
    await user.click(screen.getByRole("button", { name: "Outside" }));

    expect(onExpandedChange).toHaveBeenCalledWith(false);
    await waitFor(() => expect(screen.queryByRole("textbox")).toBeNull());
  });

  it("does not collapse on blur by default", async () => {
    const user = userEvent.setup();

    render(
      <div>
        <NotifyMorph defaultExpanded />
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

    expect(screen.getByRole("button", { name: "Notify me" })).toHaveFocus();
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

  it("allows valid native submission without requiring a callback", () => {
    const { container } = render(
      <NotifyMorph defaultExpanded defaultValue="valid@suluu.dev" />,
    );
    const form = container.querySelector("form");
    if (!form) throw new Error("Expected NotifyMorph to render a form.");

    expect(() => fireEvent.submit(form)).not.toThrow();
    expect(screen.getByRole("textbox")).toHaveValue("valid@suluu.dev");
  });

  it("disables every interactive control", () => {
    render(<NotifyMorph defaultExpanded disabled />);

    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Notify me" })).toBeDisabled();
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
    await user.click(screen.getByRole("button", { name: "Notify me" }));

    expect(await screen.findByRole("textbox")).toHaveFocus();
  });
});
