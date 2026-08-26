import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { axe } from "vitest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  EmailMorph,
  type EmailMorphActionState,
} from "../src/email-morph/email-morph";

function getAction(container: HTMLElement) {
  return container.querySelector('[data-slot="email-morph-action"]');
}

function getTrack(container: HTMLElement) {
  return container.querySelector('[data-slot="email-morph-track"]');
}

function getErrorShimmer(container: HTMLElement) {
  return container.querySelector('[data-slot="email-morph-error-shimmer"]');
}

function getError(container: HTMLElement | Document = document) {
  return container.querySelector('[data-slot="email-morph-error"]');
}

function readWidth(element: Element | null) {
  if (!(element instanceof HTMLElement)) return Number.NaN;
  return Number.parseFloat(element.style.width);
}

describe("EmailMorph", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts as one compact native email control", () => {
    const { container } = render(<EmailMorph />);
    const input = screen.getByRole("textbox", { name: "Email address" });
    const action = getAction(container);
    const form = screen.getByRole("form", { name: "Subscribe form" });

    expect(form).toHaveAttribute("data-expanded", "false");
    expect(form).toHaveAttribute("data-state", "idle");
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("name", "email");
    expect(input).toHaveAttribute("autocomplete", "off");
    expect(form).toHaveAttribute("autocomplete", "off");
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("placeholder", "Email address");
    expect(input).toHaveClass("text-center");
    expect(action).toHaveAttribute("type", "submit");
    expect(action).toHaveAttribute("aria-hidden", "true");
    expect(action).toHaveAttribute("tabindex", "-1");
    expect(
      screen.queryByRole("button", { name: "Subscribe" }),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="email-morph-bridge"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="email-morph-liquid-field"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="email-morph-liquid-neck"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="email-morph-liquid-drop"]'),
    ).toBeInTheDocument();
  });

  it("does not reserve the hidden action slot in the idle pill", async () => {
    const user = userEvent.setup();
    const { container } = render(<EmailMorph />);
    const track = getTrack(container);

    // FIELD_WIDTH (240) minus the hidden ACTION_SIZE (48) slot.
    expect(readWidth(track)).toBe(192);

    await user.click(screen.getByRole("textbox"));

    await waitFor(
      () => {
        expect(readWidth(track)).toBe(308);
      },
      { timeout: 2000 },
    );
  });

  it("keeps resting surfaces borderless while preserving focus and invalid chrome", () => {
    const { container, rerender } = render(<EmailMorph />);
    const input = screen.getByRole("textbox");
    const action = getAction(container);

    expect(
      container.querySelector('[data-slot="email-morph-field-chrome"]'),
    ).not.toHaveClass("border");
    expect(
      container.querySelector('[data-slot="email-morph-action-surface"]'),
    ).not.toHaveClass("border");
    expect(input).not.toHaveClass("focus-visible:ring-2");

    fireEvent.focus(input);
    expect(action).toHaveClass("focus-visible:ring-2");

    rerender(<EmailMorph error="That address was not accepted." />);
    const chrome = container.querySelector(
      '[data-slot="email-morph-field-chrome"]',
    );
    expect(chrome).not.toHaveClass("border");
    expect(chrome).toHaveClass(
      "shadow-[var(--suluu-email-morph-error-shadow)]",
    );
    expect(
      container.querySelector('[data-slot="email-morph-field-error-edge"]'),
    ).toBeNull();
  });

  it("splits a send action on focus without replacing it", async () => {
    const user = userEvent.setup();
    const { container } = render(<EmailMorph />);
    const input = screen.getByRole("textbox");
    const action = getAction(container);

    await user.click(input);

    expect(input).toHaveFocus();
    expect(screen.getByRole("form")).toHaveAttribute("data-expanded", "true");
    expect(screen.getByRole("form")).toHaveAttribute("data-state", "focused");
    expect(screen.getByRole("button", { name: "Subscribe" })).toBe(action);
    expect(action).not.toHaveAttribute("aria-hidden");
  });

  it("keeps focus movement inside the form expanded", async () => {
    const user = userEvent.setup();
    render(<EmailMorph />);

    await user.click(screen.getByRole("textbox"));
    await user.tab();

    expect(screen.getByRole("button", { name: "Subscribe" })).toHaveFocus();
    expect(screen.getByRole("form")).toHaveAttribute("data-expanded", "true");
  });

  it("manages an uncontrolled value and emits changes", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<EmailMorph defaultValue="hello" onValueChange={onValueChange} />);

    const input = screen.getByRole("textbox");
    await user.type(input, "@suluu.dev");

    expect(input).toHaveValue("hello@suluu.dev");
    expect(onValueChange).toHaveBeenLastCalledWith("hello@suluu.dev");
  });

  it("keeps a controlled value authoritative", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<EmailMorph onValueChange={onValueChange} value="a@suluu.dev" />);

    const input = screen.getByRole("textbox");
    await user.type(input, "x");

    expect(onValueChange).toHaveBeenCalledWith("a@suluu.devx");
    expect(input).toHaveValue("a@suluu.dev");
  });

  it("submits a valid email by action click", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<EmailMorph defaultValue="hello@suluu.dev" onSubmit={onSubmit} />);

    await user.click(screen.getByRole("textbox"));
    await user.click(screen.getByRole("button", { name: "Subscribe" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]?.[0]).toBe("hello@suluu.dev");
    expect(onSubmit.mock.calls[0]?.[1]).toBeInstanceOf(Object);
  });

  it("submits a valid email with Enter", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<EmailMorph defaultValue="hello@suluu.dev" onSubmit={onSubmit} />);
    const input = screen.getByRole("textbox");
    await user.click(input);

    await user.keyboard("{Enter}");

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]?.[0]).toBe("hello@suluu.dev");
  });

  it.each(["", "not-an-email", "hello@"])(
    "blocks the invalid email %j with a centered custom error",
    async (email) => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<EmailMorph defaultValue={email} onSubmit={onSubmit} />);
      const input = screen.getByRole("textbox");
      const reportValidity = vi.spyOn(input, "reportValidity");

      await user.click(input);
      await user.click(screen.getByRole("button", { name: "Subscribe" }));

      expect(onSubmit).not.toHaveBeenCalled();
      expect(reportValidity).not.toHaveBeenCalled();
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByRole("form")).toHaveAttribute("data-state", "error");
      expect(screen.getByRole("form")).toHaveAttribute("data-expanded", "true");
      expect(screen.getByRole("form")).toHaveAttribute("novalidate");
      await waitFor(() => {
        const message = getError();
        expect(message).toBeVisible();
        expect(message).toHaveTextContent("Enter a valid email address.");
        expect(message).toHaveClass("text-center");
      });
    },
  );

  it("sweeps a shimmer across the error each time submit is pressed", async () => {
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(180);
    const user = userEvent.setup();
    const { container } = render(<EmailMorph />);

    await user.click(screen.getByRole("textbox"));
    await user.click(screen.getByRole("button", { name: "Subscribe" }));

    await waitFor(() => {
      expect(getErrorShimmer(container)).toBeInTheDocument();
    });
    const first = getErrorShimmer(container);
    expect(first).toHaveAttribute("aria-hidden", "true");
    expect(first).toHaveTextContent("Enter a valid email address.");

    await user.click(screen.getByRole("button", { name: "Subscribe" }));

    await waitFor(() => {
      expect(getErrorShimmer(container)).not.toBe(first);
    });
    expect(getErrorShimmer(container)).toHaveTextContent(
      "Enter a valid email address.",
    );
  });

  it("merges a malformed field on blur without showing an error", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <EmailMorph defaultValue="wrong" />
        <button type="button">Outside</button>
      </div>,
    );

    await user.click(screen.getByRole("textbox"));
    await user.click(screen.getByRole("button", { name: "Outside" }));

    expect(screen.getByRole("textbox")).not.toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByRole("form")).toHaveAttribute("data-expanded", "false");
    expect(
      screen.queryByRole("button", { name: "Subscribe" }),
    ).not.toBeInTheDocument();
    expect(getError()).toBeNull();
  });

  it("hides the validation error after focus leaves", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <EmailMorph />
        <button type="button">Outside</button>
      </div>,
    );

    await user.click(screen.getByRole("textbox"));
    await user.click(screen.getByRole("button", { name: "Subscribe" }));
    await waitFor(() => {
      const message = getError();
      expect(message).toBeVisible();
      expect(message).toHaveTextContent("Enter a valid email address.");
    });

    await user.click(screen.getByRole("button", { name: "Outside" }));

    expect(screen.getByRole("form")).toHaveAttribute("data-expanded", "false");
    await waitFor(() => expect(getError()).toBeNull());

    await user.click(screen.getByRole("textbox"));
    expect(screen.getByRole("form")).toHaveAttribute("data-expanded", "true");
    expect(screen.getByRole("textbox")).not.toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(getError()).toBeNull();

    await user.click(screen.getByRole("button", { name: "Subscribe" }));
    await waitFor(() => {
      expect(getError()).toHaveTextContent("Enter a valid email address.");
    });
  });

  it("collapses an untouched empty field after focus leaves", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <EmailMorph />
        <button type="button">Outside</button>
      </div>,
    );

    await user.click(screen.getByRole("textbox"));
    expect(screen.getByRole("form")).toHaveAttribute("data-expanded", "true");
    await user.click(screen.getByRole("button", { name: "Outside" }));

    expect(screen.getByRole("textbox")).not.toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByRole("form")).toHaveAttribute("data-expanded", "false");
    expect(
      screen.queryByRole("button", { name: "Subscribe" }),
    ).not.toBeInTheDocument();
  });

  it("merges a filled field after focus leaves", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <EmailMorph defaultValue="hello@suluu.dev" />
        <button type="button">Outside</button>
      </div>,
    );

    await user.click(screen.getByRole("textbox"));
    expect(screen.getByRole("button", { name: "Subscribe" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Outside" }));

    expect(screen.getByRole("form")).toHaveAttribute("data-expanded", "false");
    expect(
      screen.queryByRole("button", { name: "Subscribe" }),
    ).not.toBeInTheDocument();
  });

  it("can remain open on blur and lets Escape release the latch", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <EmailMorph collapseOnBlur={false} />
        <button type="button">Outside</button>
      </div>,
    );
    const input = screen.getByRole("textbox");

    await user.click(input);
    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(screen.getByRole("form")).toHaveAttribute("data-expanded", "true");
    expect(screen.getByRole("button", { name: "Subscribe" })).toBeVisible();

    await user.click(input);
    await user.keyboard("{Escape}");
    expect(input).not.toHaveFocus();
    expect(screen.getByRole("form")).toHaveAttribute("data-expanded", "false");
  });

  it("does not rejoin the action with Escape while loading", async () => {
    const user = userEvent.setup();
    render(<EmailMorph defaultValue="hello@suluu.dev" loading />);

    await user.click(screen.getByRole("textbox"));
    await user.keyboard("{Escape}");

    expect(screen.getByRole("form")).toHaveAttribute("data-expanded", "true");
    expect(screen.getByRole("button", { name: "Subscribing" })).toBeVisible();
  });

  it("keeps loading controlled and blocks duplicate submissions", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const { rerender } = render(
      <EmailMorph
        defaultValue="hello@suluu.dev"
        loading={false}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("textbox"));
    await user.click(screen.getByRole("button", { name: "Subscribe" }));
    expect(onSubmit).toHaveBeenCalledOnce();

    rerender(
      <EmailMorph defaultValue="hello@suluu.dev" loading onSubmit={onSubmit} />,
    );
    const input = screen.getByRole("textbox");
    const action = screen.getByRole("button", { name: "Subscribing" });

    expect(screen.getByRole("form")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("form")).toHaveAttribute("data-state", "loading");
    expect(screen.getByRole("form")).toHaveAttribute("data-expanded", "true");
    expect(input).toHaveAttribute("readonly");
    expect(action).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Subscribing");

    fireEvent.submit(screen.getByRole("form"));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("retains the controlled email and split in success", () => {
    render(<EmailMorph success value="hello@suluu.dev" />);

    expect(screen.getByRole("textbox")).toHaveValue("hello@suluu.dev");
    expect(screen.getByRole("textbox")).toHaveAttribute("readonly");
    expect(screen.getByRole("button", { name: "Subscribed" })).toBeDisabled();
    expect(screen.getByRole("form")).toHaveAttribute("data-state", "success");
    expect(screen.getByRole("form")).toHaveAttribute("data-expanded", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Subscribed");
  });

  it("gives error precedence over success and leaves retry available", async () => {
    const user = userEvent.setup();
    render(
      <EmailMorph
        error="That address is already subscribed."
        success
        value="hello@suluu.dev"
      />,
    );

    expect(screen.getByRole("form")).toHaveAttribute("data-state", "error");
    expect(screen.getByRole("textbox")).not.toHaveAttribute("readonly");

    await user.click(screen.getByRole("textbox"));
    expect(screen.getByRole("button", { name: "Subscribe" })).toBeEnabled();
  });

  it("links an inline error while preserving consumer descriptions", () => {
    render(
      <div>
        <span id="hint">Use your work address.</span>
        <EmailMorph
          aria-describedby="hint"
          aria-errormessage="server-error"
          error="That address was not accepted."
        />
      </div>,
    );
    const input = screen.getByRole("textbox");
    const error = getError();

    expect(error).toBeInstanceOf(HTMLElement);
    expect(error).toHaveTextContent("That address was not accepted.");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")?.split(" ")).toEqual([
      "hint",
      error?.id,
    ]);
    expect(input.getAttribute("aria-errormessage")?.split(" ")).toEqual([
      "server-error",
      error?.id,
    ]);
    expect(error).toHaveAttribute("aria-live", "polite");
  });

  it("clears an internal native error when the value becomes valid", async () => {
    const user = userEvent.setup();
    render(<EmailMorph defaultValue="wrong" />);

    const input = screen.getByRole("textbox");
    await user.click(input);
    await user.keyboard("{Enter}");
    expect(input).toHaveAttribute("aria-invalid", "true");

    await user.clear(input);
    await user.type(input, "valid@suluu.dev");

    expect(input).not.toHaveAttribute("aria-invalid", "true");
    await waitFor(() =>
      expect(
        document.querySelector('[data-slot="email-morph-error"]'),
      ).toBeNull(),
    );
  });

  it("disables both native controls and ignores programmatic submission", () => {
    const onSubmit = vi.fn();
    const { container } = render(
      <EmailMorph
        defaultValue="hello@suluu.dev"
        disabled
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(getAction(container)).toBeDisabled();
    expect(screen.getByRole("form")).toHaveAttribute("data-state", "disabled");

    fireEvent.submit(screen.getByRole("form"));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("supports accessible copy and a state-aware custom icon", async () => {
    const user = userEvent.setup();
    const states: EmailMorphActionState[] = [];
    const renderIcon = vi.fn((state: EmailMorphActionState) => {
      states.push(state);
      return <span data-testid="custom-icon">{state}</span>;
    });
    const { container, rerender } = render(
      <EmailMorph
        aria-label="Work email"
        labels={{
          loading: "Joining",
          submit: "Join list",
          success: "Joined",
        }}
        renderIcon={renderIcon}
      />,
    );

    expect(screen.getByRole("textbox", { name: "Work email" })).toBeVisible();
    expect(getAction(container)).toHaveAttribute("aria-label", "Join list");
    expect(screen.getByTestId("custom-icon")).toHaveTextContent("submit");

    await user.click(screen.getByRole("textbox", { name: "Work email" }));
    expect(screen.getByRole("button", { name: "Join list" })).toBeVisible();

    rerender(
      <EmailMorph
        labels={{ loading: "Joining", submit: "Join list" }}
        loading
        renderIcon={renderIcon}
      />,
    );
    expect(screen.getByRole("button", { name: "Joining" })).toBeVisible();
    expect(screen.getByTestId("custom-icon")).toHaveTextContent("loading");
    expect(states).toContain("submit");
    expect(states).toContain("loading");
  });

  it("forwards the input ref and safe native attributes", () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <EmailMorph
        aria-labelledby="email-label"
        className="custom-email"
        data-testid="native-email"
        id="email"
        ref={ref}
      />,
    );

    const input = screen.getByTestId("native-email");
    expect(ref.current).toBe(input);
    expect(input).toHaveAttribute("id", "email");
    expect(input).toHaveAttribute("aria-labelledby", "email-label");
    expect(screen.getByRole("form")).toHaveClass("custom-email");
  });

  it.each(["subtle", "default", "expressive"] as const)(
    "has no automated accessibility violations at %s intensity",
    async (motionIntensity) => {
      const { container } = render(
        <EmailMorph motionIntensity={motionIntensity} />,
      );

      const results = await axe(container, {
        rules: { "color-contrast": { enabled: false } },
      });
      expect(results.violations).toEqual([]);
    },
  );

  it("renders stable native semantics on the server", () => {
    const markup = renderToStaticMarkup(
      <EmailMorph defaultValue="hello@suluu.dev" />,
    );

    expect(markup).toContain('type="email"');
    expect(markup).toContain("required");
    expect(markup).toContain("noValidate");
    expect(markup).toContain('data-expanded="false"');
    expect(markup).toContain("Subscribe");
    expect(markup).toContain("aria-hidden");
  });
});
