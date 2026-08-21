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
import { afterEach, describe, expect, it, vi } from "vitest";

import { OtpInput } from "../src/otp-input/otp-input";

function getSlots(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>('[data-slot="otp-input-slot"]'),
  );
}

function paste(input: HTMLInputElement, value: string) {
  fireEvent.paste(input, {
    clipboardData: { getData: () => value },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("OtpInput", () => {
  it("renders six responsive slots and a mobile-friendly native field by default", () => {
    const { container } = render(<OtpInput />);
    const input = screen.getByRole<HTMLInputElement>("textbox", {
      name: "One-time code",
    });
    const root = container.querySelector('[data-slot="otp-input"]');

    expect(getSlots(container)).toHaveLength(6);
    expect(input).toHaveAttribute("autocomplete", "one-time-code");
    expect(input).toHaveAttribute("inputmode", "numeric");
    expect(input).toHaveAttribute("pattern", "[0-9]*");
    expect(input).toHaveAttribute("maxlength", "6");
    expect(input).toHaveAttribute("type", "text");
    expect(root).toHaveAttribute("data-size", "default");
    expect(root).toHaveAttribute("data-state", "idle");
  });

  it("manages an uncontrolled value, filters characters, and advances the active slot", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <OtpInput length={4} onValueChange={onValueChange} />,
    );
    const input = screen.getByRole<HTMLInputElement>("textbox");

    input.focus();
    await user.keyboard("12a3");

    expect(input).toHaveValue("123");
    expect(onValueChange).toHaveBeenNthCalledWith(1, "1");
    expect(onValueChange).toHaveBeenNthCalledWith(2, "12");
    expect(onValueChange).toHaveBeenNthCalledWith(3, "123");
    expect(getSlots(container)[3]).toHaveAttribute("data-state", "active");
  });

  it("replaces a filled slot and supports Backspace and Delete precisely", async () => {
    const user = userEvent.setup();
    render(<OtpInput defaultValue="1234" length={4} />);
    const input = screen.getByRole<HTMLInputElement>("textbox");

    fireEvent.focus(input);
    input.setSelectionRange(1, 1);
    fireEvent.select(input);
    await user.keyboard("9");
    expect(input).toHaveValue("1934");
    expect(input.selectionStart).toBe(2);

    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("134");
    expect(input.selectionStart).toBe(1);

    await user.keyboard("{Delete}");
    expect(input).toHaveValue("14");
    expect(input.selectionStart).toBe(1);
  });

  it("deletes a native selection and inserts at its start", async () => {
    const user = userEvent.setup();
    render(<OtpInput defaultValue="1234" length={4} />);
    const input = screen.getByRole<HTMLInputElement>("textbox");

    fireEvent.focus(input);
    input.setSelectionRange(1, 3);
    fireEvent.select(input);
    await user.keyboard("8");
    expect(input).toHaveValue("184");

    input.setSelectionRange(1, 2);
    fireEvent.select(input);
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("14");
  });

  it("positions the native caret from the visual slot that was pressed", async () => {
    const user = userEvent.setup();
    const { container } = render(<OtpInput defaultValue="1234" length={4} />);
    const input = screen.getByRole<HTMLInputElement>("textbox");

    getSlots(container).forEach((slot, index) => {
      const left = index * 50;
      vi.spyOn(slot, "getBoundingClientRect").mockReturnValue({
        bottom: 52,
        height: 52,
        left,
        right: left + 40,
        toJSON: () => ({}),
        top: 0,
        width: 40,
        x: left,
        y: 0,
      });
    });

    fireEvent.pointerDown(input, {
      button: 0,
      clientX: 70,
      isPrimary: true,
      pointerId: 1,
    });
    act(() => input.focus());
    fireEvent.click(input, { clientX: 70 });
    await user.keyboard("9");

    expect(input).toHaveValue("1934");
    expect(input.selectionStart).toBe(2);
  });

  it("deletes the last digit after blur when the last slot of a complete code is pressed", async () => {
    const user = userEvent.setup();
    const { container } = render(<OtpInput defaultValue="1234" length={4} />);
    const input = screen.getByRole<HTMLInputElement>("textbox");

    getSlots(container).forEach((slot, index) => {
      const left = index * 50;
      vi.spyOn(slot, "getBoundingClientRect").mockReturnValue({
        bottom: 52,
        height: 52,
        left,
        right: left + 40,
        toJSON: () => ({}),
        top: 0,
        width: 40,
        x: left,
        y: 0,
      });
    });

    act(() => input.focus());
    act(() => input.blur());

    fireEvent.pointerDown(input, {
      button: 0,
      clientX: 170,
      isPrimary: true,
      pointerId: 1,
    });
    act(() => input.focus());
    fireEvent.click(input, { clientX: 170 });
    await user.keyboard("{Backspace}");

    expect(input).toHaveValue("123");
    expect(input.selectionStart).toBe(3);
  });

  it("replaces the last digit when the last slot of a complete code is pressed", async () => {
    const user = userEvent.setup();
    const { container } = render(<OtpInput defaultValue="1234" length={4} />);
    const input = screen.getByRole<HTMLInputElement>("textbox");

    getSlots(container).forEach((slot, index) => {
      const left = index * 50;
      vi.spyOn(slot, "getBoundingClientRect").mockReturnValue({
        bottom: 52,
        height: 52,
        left,
        right: left + 40,
        toJSON: () => ({}),
        top: 0,
        width: 40,
        x: left,
        y: 0,
      });
    });

    fireEvent.pointerDown(input, {
      button: 0,
      clientX: 170,
      isPrimary: true,
      pointerId: 1,
    });
    act(() => input.focus());
    fireEvent.click(input, { clientX: 170 });
    await user.keyboard("9");

    expect(input).toHaveValue("1239");
    expect(input.selectionStart).toBe(4);
  });

  it("pastes a full formatted code in one update and completes once", () => {
    const onComplete = vi.fn();
    const onValueChange = vi.fn();
    render(
      <OtpInput
        defaultValue="12"
        length={6}
        onComplete={onComplete}
        onValueChange={onValueChange}
      />,
    );
    const input = screen.getByRole<HTMLInputElement>("textbox");

    fireEvent.focus(input);
    paste(input, " 98 76-54 ");

    expect(input).toHaveValue("987654");
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith("987654");
    expect(onComplete).toHaveBeenCalledExactlyOnceWith("987654");
    expect(input.selectionStart).toBe(6);
  });

  it("inserts a partial paste at the selection and truncates overflow", () => {
    render(<OtpInput defaultValue="1234" length={6} />);
    const input = screen.getByRole<HTMLInputElement>("textbox");

    fireEvent.focus(input);
    input.setSelectionRange(1, 3);
    fireEvent.select(input);
    paste(input, "99888");

    expect(input).toHaveValue("199888");
    expect(input.selectionStart).toBe(6);
  });

  it("accepts mobile or autofill changes through the native change fallback", () => {
    const onComplete = vi.fn();
    render(<OtpInput length={4} onComplete={onComplete} />);
    const input = screen.getByRole<HTMLInputElement>("textbox");

    fireEvent.change(input, {
      target: { selectionStart: 6, value: "1a2-34" },
    });

    expect(input).toHaveValue("1234");
    expect(onComplete).toHaveBeenCalledExactlyOnceWith("1234");
  });

  it("keeps controlled state authoritative and does not complete from props", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    const onValueChange = vi.fn();
    const { rerender } = render(
      <OtpInput
        length={4}
        onComplete={onComplete}
        onValueChange={onValueChange}
        value="12"
      />,
    );
    const input = screen.getByRole<HTMLInputElement>("textbox");

    input.focus();
    await user.keyboard("3");
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith("123");
    expect(input).toHaveValue("12");

    rerender(
      <OtpInput
        length={4}
        onComplete={onComplete}
        onValueChange={onValueChange}
        value="1234"
      />,
    );
    expect(input).toHaveValue("1234");
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("can complete again after a deletion", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<OtpInput defaultValue="123" length={4} onComplete={onComplete} />);
    const input = screen.getByRole<HTMLInputElement>("textbox");

    await user.click(input);
    await user.keyboard("4");
    await user.keyboard("{Backspace}4");

    expect(onComplete).toHaveBeenCalledTimes(2);
    expect(onComplete).toHaveBeenLastCalledWith("1234");
  });

  it("masks every digit immediately with native password semantics", () => {
    const { container } = render(
      <OtpInput defaultValue="1234" length={4} masked />,
    );
    const input = screen.getByLabelText("PIN code");
    const digits = Array.from(
      container.querySelectorAll('[data-slot="otp-input-digit"]'),
    );

    expect(input).toHaveAttribute("type", "password");
    expect(digits).toHaveLength(4);
    expect(digits.map((digit) => digit.textContent)).toEqual([
      "•",
      "•",
      "•",
      "•",
    ]);
    expect(container).not.toHaveTextContent("1234");
  });

  it("links an inline error while preserving consumer descriptions", () => {
    const { container } = render(
      <>
        <p id="hint">Use the code from your message.</p>
        <OtpInput
          aria-describedby="hint"
          error="That code has expired."
          length={4}
        />
      </>,
    );
    const input = screen.getByRole<HTMLInputElement>("textbox");
    const error = screen.getByText("That code has expired.");
    const root = container.querySelector('[data-slot="otp-input"]');

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")?.split(" ")).toEqual([
      "hint",
      error.id,
    ]);
    expect(input).toHaveAttribute("aria-errormessage", error.id);
    expect(error).toHaveAttribute("aria-live", "polite");
    expect(root).toHaveAttribute("data-state", "invalid");
  });

  it("supports state-only invalid styling and an externally labelled field", () => {
    render(
      <>
        <label id="code-label" htmlFor="code">
          Security code
        </label>
        <OtpInput aria-labelledby="code-label" id="code" invalid length={4} />
      </>,
    );

    expect(
      screen.getByRole("textbox", { name: "Security code" }),
    ).toHaveAttribute("aria-invalid", "true");
  });

  it("does not respond while disabled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <OtpInput disabled onValueChange={onValueChange} />,
    );
    const input = screen.getByRole<HTMLInputElement>("textbox");

    expect(input).toBeDisabled();
    await user.type(input, "123456");
    paste(input, "123456");

    expect(input).toHaveValue("");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(container.querySelector('[data-slot="otp-input"]')).toHaveAttribute(
      "data-state",
      "disabled",
    );
  });

  it("forwards native attributes and the input ref while styling the wrapper", () => {
    const ref = createRef<HTMLInputElement>();
    const focusProps = { autoFocus: true };
    const { container } = render(
      <OtpInput
        {...focusProps}
        aria-label="Verification code"
        className="custom-otp"
        form="verify"
        name="code"
        ref={ref}
        required
        style={{ opacity: 0.9 }}
      />,
    );
    const root = container.querySelector('[data-slot="otp-input"]');

    expect(ref.current).toBe(screen.getByRole("textbox"));
    expect(ref.current).toHaveFocus();
    expect(ref.current).toHaveAttribute("form", "verify");
    expect(ref.current).toHaveAttribute("name", "code");
    expect(ref.current).toBeRequired();
    expect(root).toHaveClass("custom-otp");
    expect(root).toHaveStyle({ opacity: "0.9" });
  });

  it.each(["sm", "default", "lg"] as const)(
    "exposes the %s size without wrapping slots",
    (size) => {
      const { container } = render(<OtpInput length={4} size={size} />);
      const root = container.querySelector('[data-slot="otp-input"]');
      const track = container.querySelector('[data-slot="otp-input-track"]');

      expect(root).toHaveAttribute("data-size", size);
      expect(track).toHaveClass("inline-flex", "max-w-full");
      expect(getSlots(container)).toHaveLength(4);
      for (const slot of getSlots(container)) {
        expect(slot).toHaveClass("min-w-0");
        expect(slot.className).toContain("w-[clamp(");
      }
    },
  );

  it("keeps the large size compact on narrow screens", () => {
    const { container } = render(<OtpInput length={6} size="lg" />);
    const slot = getSlots(container)[0];

    expect(slot).toHaveClass(
      "h-[52px]",
      "sm:h-[60px]",
      "text-xl",
      "sm:text-2xl",
    );
  });

  it("hides the active wash after a valid code is complete until the field is pressed", async () => {
    const user = userEvent.setup();
    const { container } = render(<OtpInput length={4} />);
    const input = screen.getByRole<HTMLInputElement>("textbox");

    await user.click(input);
    expect(
      container.querySelector('[data-slot="otp-input-caret"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-slot="otp-input-active"]'),
    ).not.toBeNull();

    await user.keyboard("1234");

    expect(container.querySelector('[data-slot="otp-input"]')).toHaveAttribute(
      "data-state",
      "complete",
    );
    await waitFor(() => {
      expect(
        container.querySelector('[data-slot="otp-input-caret"]'),
      ).toBeNull();
      expect(
        container.querySelector('[data-slot="otp-input-active"]'),
      ).toBeNull();
    });
  });

  it("does not show the active wash when a complete field is focused without a press", () => {
    const { container } = render(<OtpInput defaultValue="1234" length={4} />);
    const input = screen.getByRole<HTMLInputElement>("textbox");

    act(() => input.focus());

    expect(container.querySelector('[data-slot="otp-input"]')).toHaveAttribute(
      "data-state",
      "complete",
    );
    expect(
      container.querySelector('[data-slot="otp-input-active"]'),
    ).toBeNull();
    expect(container.querySelector('[data-slot="otp-input-caret"]')).toBeNull();
  });

  it("moves the active wash to the slot that was pressed on a complete code", () => {
    const { container } = render(<OtpInput defaultValue="1234" length={4} />);
    const input = screen.getByRole<HTMLInputElement>("textbox");

    getSlots(container).forEach((slot, index) => {
      const left = index * 50;
      vi.spyOn(slot, "getBoundingClientRect").mockReturnValue({
        bottom: 52,
        height: 52,
        left,
        right: left + 40,
        toJSON: () => ({}),
        top: 0,
        width: 40,
        x: left,
        y: 0,
      });
    });

    fireEvent.pointerDown(input, {
      button: 0,
      clientX: 70,
      isPrimary: true,
      pointerId: 1,
    });
    act(() => input.focus());
    fireEvent.click(input, { clientX: 70 });

    expect(container.querySelector('[data-slot="otp-input"]')).toHaveAttribute(
      "data-state",
      "complete",
    );
    const pressedSlot = getSlots(container)[1];
    expect(pressedSlot).toBeDefined();
    expect(pressedSlot).toHaveAttribute("data-state", "active");
    expect(
      pressedSlot?.querySelector('[data-slot="otp-input-active"]'),
    ).not.toBeNull();
  });

  it("restores the active wash after deleting a complete code", async () => {
    const user = userEvent.setup();
    const { container } = render(<OtpInput length={4} />);
    const input = screen.getByRole<HTMLInputElement>("textbox");

    await user.click(input);
    await user.keyboard("1234");
    await user.keyboard("{Backspace}");

    expect(container.querySelector('[data-slot="otp-input"]')).toHaveAttribute(
      "data-state",
      "focused",
    );
    expect(
      container.querySelector('[data-slot="otp-input-active"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-slot="otp-input-caret"]'),
    ).not.toBeNull();
  });

  it("keeps invalid above complete when the field is full", () => {
    const { container } = render(
      <OtpInput
        defaultValue="1234"
        error="That PIN was not accepted."
        length={4}
      />,
    );

    expect(container.querySelector('[data-slot="otp-input"]')).toHaveAttribute(
      "data-state",
      "invalid",
    );
    expect(screen.getByText("That PIN was not accepted.")).toBeInTheDocument();
  });

  it("composes keyboard and paste handlers and honors preventDefault", async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn((event: React.KeyboardEvent<HTMLInputElement>) => {
      event.preventDefault();
    });
    const onPaste = vi.fn((event: React.ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault();
    });
    render(<OtpInput onKeyDown={onKeyDown} onPaste={onPaste} />);
    const input = screen.getByRole<HTMLInputElement>("textbox");

    input.focus();
    await user.keyboard("1");
    paste(input, "123456");

    expect(onKeyDown).toHaveBeenCalled();
    expect(onPaste).toHaveBeenCalled();
    expect(input).toHaveValue("");
  });

  it("renders consistently on the server", () => {
    const markup = renderToStaticMarkup(
      <OtpInput defaultValue="12" length={4} size="sm" />,
    );

    expect(markup).toContain('data-slot="otp-input"');
    expect(markup.match(/data-slot="otp-input-slot"/g)).toHaveLength(4);
    expect(markup).toContain('value="12"');
    expect(markup).toContain('maxLength="4"');
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <OtpInput aria-label="Verification code" defaultValue="12" length={6} />,
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
