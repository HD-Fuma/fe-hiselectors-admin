import { render, screen } from "@testing-library/react";
import { Button, Checkbox, SegmentedControl, Select, TextInput } from "./Controls";
import { StatusPill } from "./StatusPill";

describe("HSAS controls", () => {
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
        activeId="list"
        items={[
          { id: "list", label: "List" },
          { id: "grid", label: "Grid" },
        ]}
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
  render(<StatusPill status="approved">Approved</StatusPill>);

  expect(screen.getByText("Approved")).toHaveClass(
    "hsas-status-pill",
    "hsas-status-pill--approved",
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
});
