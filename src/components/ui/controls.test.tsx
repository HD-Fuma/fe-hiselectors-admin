import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
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

describe("HSAS controls", () => {
  test("changes view mode with the shared sliding toggle", async () => {
    const onChange = vi.fn();
    const { rerender } = render(<ViewModeToggle onChange={onChange} value="grid" />);

    const toggle = screen.getByRole("switch", { name: "보기 방식" });
    expect(toggle).toHaveClass("is-grid");
    expect(toggle).not.toBeChecked();
    expect(screen.getByRole("tooltip")).toHaveTextContent("보기를 변경할 수 있습니다");
    expect(screen.getByRole("tooltip")).toHaveClass("is-visible");

    fireEvent.mouseEnter(toggle.parentElement!);
    expect(screen.getByRole("tooltip")).not.toHaveClass("is-visible");

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
