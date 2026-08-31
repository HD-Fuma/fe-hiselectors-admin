import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import adminStyles from "../../styles/admin.css?raw";
import {
  Button,
  buttonClassNames,
  Checkbox,
  SegmentedControl,
  Select,
  TextInput,
  type SegmentedControlProps,
} from "./Controls";
import { StatusPill, type StatusPillProps } from "./StatusPill";
import { ViewModeToggle } from "./ViewModeToggle";

// @ts-expect-error Segmented controls use the documented value/options vocabulary.
const invalidSegmentedAliases: SegmentedControlProps = { activeId: "yes", items: [] };
// @ts-expect-error Status pills use tone rather than the removed status alias.
const invalidStatusAlias: StatusPillProps = { status: "approved" };
void invalidSegmentedAliases;
void invalidStatusAlias;

function setShowPicker(showPicker?: () => void) {
  const descriptor = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "showPicker",
  );

  if (showPicker) {
    Object.defineProperty(HTMLInputElement.prototype, "showPicker", {
      configurable: true,
      value: showPicker,
    });
  } else {
    Reflect.deleteProperty(HTMLInputElement.prototype, "showPicker");
  }

  return () => {
    if (descriptor) {
      Object.defineProperty(HTMLInputElement.prototype, "showPicker", descriptor);
    } else {
      Reflect.deleteProperty(HTMLInputElement.prototype, "showPicker");
    }
  };
}

describe("HSAS controls", () => {
  test("changes view mode with the shared sliding toggle", async () => {
    const onChange = vi.fn();
    const { rerender } = render(<ViewModeToggle onChange={onChange} value="grid" />);

    const toggle = screen.getByRole("switch", { name: "보기 방식" });
    expect(toggle).toHaveClass("is-grid");
    expect(toggle).not.toBeChecked();
    expect(screen.getByRole("tooltip")).toHaveTextContent("보기를 변경할 수 있습니다");
    expect(screen.getByRole("tooltip")).toHaveClass("is-visible");

    expect(adminStyles).toMatch(
      /\.hsas-view-mode-toggle-wrap:hover > \.hsas-tooltip\s*\{[^}]*opacity:\s*1;/,
    );
    expect(adminStyles).toMatch(
      /\.hsas-view-mode-toggle-wrap\s*\{[^}]*position:\s*relative;/,
    );
    expect(adminStyles).toMatch(
      /\.hsas-view-mode-toggle-wrap > \.hsas-tooltip--top\s*\{[^}]*bottom:\s*calc\(100% \+ 8px\);/,
    );
    expect(adminStyles).toMatch(
      /\.hsas-view-mode-toggle-wrap > \.hsas-tooltip--bottom\s*\{[^}]*top:\s*calc\(100% \+ 8px\);/,
    );
    expect(adminStyles).toMatch(
      /\.hsas-tooltip\s*\{[^}]*white-space:\s*nowrap;/,
    );
    expect(screen.getByRole("tooltip")).toHaveClass("hsas-tooltip--top");

    await userEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith("list");

    rerender(<ViewModeToggle onChange={onChange} value="list" />);
    expect(toggle).toHaveClass("is-list");
    expect(toggle).toBeChecked();

    await userEvent.click(toggle);
    expect(onChange).toHaveBeenLastCalledWith("grid");
  });

  test("hides the view mode guidance after two seconds", () => {
    vi.useFakeTimers();
    render(<ViewModeToggle onChange={vi.fn()} value="grid" />);

    expect(screen.getByRole("tooltip")).toHaveClass("is-visible");
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByRole("tooltip")).not.toHaveClass("is-visible");
    vi.useRealTimers();
  });

  test("keeps content inspection guidance hover-only below the toggle", () => {
    render(
      <ViewModeToggle
        autoShowTooltip={false}
        onChange={vi.fn()}
        tooltipPlacement="bottom"
        value="grid"
      />,
    );

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveClass("hsas-tooltip--bottom");
    expect(tooltip).not.toHaveClass("is-visible");
  });

  test("shares the button class contract with non-button elements", () => {
    expect(buttonClassNames("primary", "custom-link")).toBe(
      "hsas-button ui-button hsas-button--primary ui-button--primary custom-link",
    );
  });

  test("renders the primary button treatment", () => {
    render(<Button variant="primary">Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toHaveClass(
      "hsas-button",
      "hsas-button--primary",
    );
  });

  test("renders a dense text input with native input attributes", () => {
    render(<TextInput aria-label="Product name" defaultValue="FUMA" />);

    expect(screen.getByRole("textbox", { name: "Product name" })).toHaveClass(
      "hsas-control",
      "hsas-text-input",
    );
  });

  test.each(["date", "month"] as const)(
    "opens the %s picker and blocks direct keyboard editing",
    async (type) => {
      const showPicker = vi.fn();
      const restoreShowPicker = setShowPicker(showPicker);
      const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
      });
      const user = userEvent.setup();

      try {
        render(
          <form onSubmit={onSubmit}>
            <TextInput aria-label={`${type} input`} type={type} />
            <button type="submit">Submit</button>
          </form>,
        );

        const input = screen.getByLabelText(`${type} input`);
        fireEvent.click(input);
        expect(showPicker).toHaveBeenCalledTimes(1);

        expect(fireEvent.keyDown(input, { key: " " })).toBe(false);
        expect(showPicker).toHaveBeenCalledTimes(2);

        for (const key of [
          "1",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Home",
          "End",
          "PageUp",
          "PageDown",
          "Delete",
          "Backspace",
        ]) {
          expect(fireEvent.keyDown(input, { key })).toBe(false);
        }

        for (const [key, modifiers] of [
          ["r", { ctrlKey: true }],
          ["f", { metaKey: true }],
          ["y", { metaKey: true }],
          ["ArrowDown", { altKey: true }],
          [" ", { ctrlKey: true }],
          ["F5", {}],
          ["F11", {}],
        ] as const) {
          expect(fireEvent.keyDown(input, { key, ...modifiers })).toBe(true);
        }

        for (const [key, modifiers] of [
          ["v", { ctrlKey: true }],
          ["x", { metaKey: true }],
          ["z", { ctrlKey: true, shiftKey: true }],
          ["y", { ctrlKey: true }],
          ["Insert", { shiftKey: true }],
        ] as const) {
          expect(fireEvent.keyDown(input, { key, ...modifiers })).toBe(false);
        }

        expect(fireEvent.keyDown(input, { key: "Tab" })).toBe(true);
        expect(fireEvent.keyDown(input, { key: "Escape" })).toBe(true);

        input.focus();
        await user.keyboard("{Enter}");
        expect(onSubmit).toHaveBeenCalledTimes(1);
      } finally {
        restoreShowPicker();
      }
    },
  );

  test("composes picker handlers and keeps fallback input behavior", () => {
    const order: string[] = [];
    const showPicker = vi.fn(() => order.push("picker"));
    let restoreShowPicker = setShowPicker(showPicker);

    try {
      render(
        <>
          <TextInput
            aria-label="composed date"
            onClick={() => order.push("consumer click")}
            onKeyDown={() => order.push("consumer keydown")}
            type="date"
          />
          <TextInput
            aria-label="prevented date"
            onClick={(event) => event.preventDefault()}
            onKeyDown={(event) => event.preventDefault()}
            type="date"
          />
          <TextInput aria-label="disabled date" disabled type="date" />
          <TextInput aria-label="readonly date" readOnly type="date" />
          <TextInput aria-label="plain text" type="text" />
        </>,
      );

      const composed = screen.getByLabelText("composed date");
      fireEvent.click(composed);
      expect(order).toEqual(["consumer click", "picker"]);

      order.length = 0;
      expect(fireEvent.keyDown(composed, { key: " " })).toBe(false);
      expect(order).toEqual(["consumer keydown", "picker"]);

      showPicker.mockClear();
      fireEvent.click(screen.getByLabelText("prevented date"));
      fireEvent.keyDown(screen.getByLabelText("prevented date"), { key: " " });
      fireEvent.click(screen.getByLabelText("disabled date"));
      fireEvent.keyDown(screen.getByLabelText("disabled date"), { key: " " });
      fireEvent.click(screen.getByLabelText("readonly date"));
      fireEvent.keyDown(screen.getByLabelText("readonly date"), { key: " " });
      expect(showPicker).not.toHaveBeenCalled();

      const plainText = screen.getByLabelText("plain text");
      expect(fireEvent.keyDown(plainText, { key: "1" })).toBe(true);
      fireEvent.click(plainText);
      expect(showPicker).not.toHaveBeenCalled();

      restoreShowPicker();
      restoreShowPicker = setShowPicker();
      expect(fireEvent.click(composed)).toBe(true);
      expect(fireEvent.keyDown(composed, { key: " " })).toBe(true);

      restoreShowPicker();
      restoreShowPicker = setShowPicker(() => {
        throw new DOMException("Picker unavailable");
      });
      expect(fireEvent.click(composed)).toBe(true);
      expect(fireEvent.keyDown(composed, { key: " " })).toBe(true);
    } finally {
      restoreShowPicker();
    }
  });

  test("renders a native select control", () => {
    render(
      <Select aria-label="Approval status" defaultValue="approved">
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
      </Select>,
    );

    expect(screen.getByRole("combobox", { name: "Approval status" })).toHaveClass(
      "hsas-control",
      "hsas-select",
    );
  });

  test("associates a checkbox with its visible label", () => {
    render(<Checkbox label="Include inactive" />);

    expect(screen.getByRole("checkbox", { name: "Include inactive" })).toHaveClass(
      "hsas-checkbox__input",
    );
  });

  test("marks the active segmented option as pressed", () => {
    render(
      <SegmentedControl
        ariaLabel="Display mode"
        options={[
          { value: "list", label: "List" },
          { value: "grid", label: "Grid" },
        ]}
        value="list"
      />,
    );

    expect(screen.getByRole("button", { name: "List" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Grid" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});

test("renders the approved status treatment", () => {
  render(<StatusPill tone="approved">Approved</StatusPill>);

  expect(screen.getByText("Approved")).toHaveClass(
    "hsas-status-pill",
    "hsas-status-pill--approved",
  );
});

test("renders the danger status treatment", () => {
  render(<StatusPill tone="danger">Danger</StatusPill>);

  expect(screen.getByText("Danger")).toHaveClass(
    "hsas-status-pill",
    "hsas-status-pill--danger",
  );
});

test("supports the documented compact option props and utility classes", () => {
  render(
    <>
      <Button variant="primary">Query</Button>
      <StatusPill tone="approved">Accepted</StatusPill>
      <TextInput aria-label="Keyword" />
      <Select
        aria-label="State"
        options={[
          { value: "all", label: "All" },
          { value: "approved", label: "Approved" },
        ]}
      />
      <SegmentedControl
        options={[
          { value: "yes", label: "Enabled" },
          { value: "no", label: "Disabled" },
        ]}
        value="yes"
      />
    </>,
  );

  expect(screen.getByRole("button", { name: "Query" })).toHaveClass("ui-button--primary");
  expect(screen.getByText("Accepted")).toHaveClass("status-pill--approved");
  expect(screen.getByRole("textbox", { name: "Keyword" })).toHaveClass("ui-input");
  expect(screen.getByRole("combobox", { name: "State" })).toHaveValue("all");
  expect(screen.getByRole("button", { name: "Enabled" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByRole("group", { name: "선택 옵션" })).toBeInTheDocument();
});
