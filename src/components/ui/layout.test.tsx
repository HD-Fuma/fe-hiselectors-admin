import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { Button, TextInput } from "./Controls";
import { ChoiceTabs } from "./ChoiceTabs";
import { DenseTable, type DenseTableColumn, type DenseTableProps } from "./DenseTable";
import { EmptyState } from "./EmptyState";
import { FilterField } from "./FilterField";
import { FormRow, type FormRowProps } from "./FormRow";
import { Modal } from "./Modal";
import { Pagination } from "./Pagination";
import { ResultToolbar } from "./ResultToolbar";
import { SearchActions } from "./SearchActions";
import { SearchPanel } from "./SearchPanel";
import { SidePanel } from "./SidePanel";
import { StatusPill } from "./StatusPill";

// @ts-expect-error Form-row labels are text-only contracts.
const invalidFormRowLabel: FormRowProps = { children: "field", label: 42 };
// @ts-expect-error Form-row help is a text-only contract.
const invalidFormRowHelp: FormRowProps = { children: "field", help: 42, label: "Label" };
void invalidFormRowLabel;
void invalidFormRowHelp;

test("renders a form row label, required marker, control, and help text", () => {
  render(
    <FormRow label="Product code" required help="Use the OMS product code.">
      <TextInput aria-label="Product code value" />
    </FormRow>,
  );

  expect(screen.getByRole("group", { name: "Product code" })).toBeInTheDocument();
  expect(screen.getByText("Product code")).toBeInTheDocument();
  expect(screen.getByText("필수")).toHaveClass("hsas-visually-hidden");
  expect(screen.getByText("Use the OMS product code.")).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Product code value" })).toBeInTheDocument();
});

test("names and describes a stable multi-control form group", () => {
  const row = (
    <FormRow label="Date range" help="Choose the campaign start and end dates.">
      <div>
        <TextInput aria-label="Start date" required />
        <TextInput aria-label="End date" />
      </div>
    </FormRow>
  );

  const { rerender } = render(row);
  const group = screen.getByRole("group", { name: "Date range" });
  const labelledBy = group.getAttribute("aria-labelledby");
  const describedBy = group.getAttribute("aria-describedby");

  expect(group).toHaveAccessibleDescription("Choose the campaign start and end dates.");
  expect(document.getElementById(labelledBy!)).toHaveTextContent("Date range");
  expect(document.getElementById(describedBy!)).toHaveTextContent(
    "Choose the campaign start and end dates.",
  );
  expect(screen.getByRole("textbox", { name: "Start date" })).toBeRequired();
  expect(screen.getByRole("textbox", { name: "End date" })).not.toBeRequired();

  rerender(row);
  const rerenderedGroup = screen.getByRole("group", { name: "Date range" });
  expect(rerenderedGroup).toHaveAttribute("aria-labelledby", labelledBy);
  expect(rerenderedGroup).toHaveAttribute("aria-describedby", describedBy);
});

test("renders search fields and actions inside an accessible search landmark", () => {
  render(
    <SearchPanel actions={<Button variant="primary">Search</Button>}>
      <TextInput aria-label="Search term" />
    </SearchPanel>,
  );

  const search = screen.getByRole("search", { name: "검색 조건" });
  expect(within(search).getByRole("textbox", { name: "Search term" })).toBeInTheDocument();
  expect(within(search).getByRole("button", { name: "Search" })).toBeInTheDocument();
});

test("shows the current page, total pages, and page size", () => {
  render(<Pagination page={2} totalPages={7} pageSize={25} />);

  const pagination = screen.getByRole("navigation", { name: "페이지 이동" });
  expect(within(pagination).getByText("2 / 7 페이지")).toBeInTheDocument();
  expect(within(pagination).getByText("페이지당 25개")).toBeInTheDocument();
  expect(within(pagination).getByRole("button", { name: "이전 페이지" })).toBeDisabled();
  expect(within(pagination).getByRole("button", { name: "다음 페이지" })).toBeDisabled();
});

test("renders modal content and actions only while open", () => {
  const { rerender } = render(
    <Modal open={false} title="Approve product" actions={<Button>Confirm</Button>}>
      Review the product before approval.
    </Modal>,
  );

  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

  rerender(
    <Modal open title="Approve product" actions={<Button>Confirm</Button>}>
      Review the product before approval.
    </Modal>,
  );

  const dialog = screen.getByRole("dialog", { name: "Approve product" });
  expect(within(dialog).getByText("Review the product before approval.")).toBeInTheDocument();
  expect(within(dialog).getByRole("button", { name: "Confirm" })).toBeInTheDocument();
});

test("isolates the background, traps focus, and restores focus when a modal closes", async () => {
  const user = userEvent.setup();
  const modalState = (open: boolean) => (
    <>
      <button data-testid="modal-trigger" type="button">
        Open modal
      </button>
      <Modal
        actions={
          <>
            <Button>Cancel</Button>
            <Button variant="primary">Confirm</Button>
          </>
        }
        open={open}
        title="Approve product"
      >
        <TextInput aria-label="Approval reason" />
      </Modal>
    </>
  );
  const { rerender } = render(modalState(false));
  const trigger = screen.getByTestId("modal-trigger");
  const backgroundRoot = trigger.parentElement!;
  const previousOverflow = document.body.style.overflow;
  trigger.focus();

  rerender(modalState(true));

  const dialog = screen.getByRole("dialog", { name: "Approve product" });
  const firstControl = within(dialog).getByRole("textbox", { name: "Approval reason" });
  const lastControl = within(dialog).getByRole("button", { name: "Confirm" });
  expect(firstControl).toHaveFocus();
  expect(document.body).toHaveStyle({ overflow: "hidden" });
  expect(backgroundRoot).toHaveAttribute("aria-hidden", "true");
  expect(backgroundRoot).toHaveAttribute("inert");

  await user.tab({ shift: true });
  expect(lastControl).toHaveFocus();
  await user.tab();
  expect(firstControl).toHaveFocus();

  rerender(modalState(false));

  expect(trigger).toHaveFocus();
  expect(document.body.style.overflow).toBe(previousOverflow);
  expect(backgroundRoot).not.toHaveAttribute("aria-hidden");
  expect(backgroundRoot).not.toHaveAttribute("inert");
});

test("composes shared list filters, search actions, and result metadata", async () => {
  const user = userEvent.setup();
  const onReset = vi.fn();
  const onSearch = vi.fn();

  render(
    <>
      <SearchPanel actions={<SearchActions onReset={onReset} onSearch={onSearch} />}>
        <FilterField htmlFor="shared-keyword" label="검색어">
          <TextInput id="shared-keyword" />
        </FilterField>
      </SearchPanel>
      <ResultToolbar
        actions={<Button>새 항목</Button>}
        description="목록 설명"
        meta={<span>총 12건</span>}
        title="공통 목록"
      />
    </>,
  );

  expect(screen.getByLabelText("검색어")).toBeInTheDocument();
  expect(screen.getByText("공통 목록")).toBeInTheDocument();
  expect(screen.getByText("목록 설명")).toHaveClass("fuma-result-toolbar__description");
  expect(screen.getByText("총 12건")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "조회" }));
  await user.click(screen.getByRole("button", { name: "초기화" }));
  expect(onSearch).toHaveBeenCalledOnce();
  expect(onReset).toHaveBeenCalledOnce();
});

test("shares scroll locking, focus containment, Escape close, and focus restore with side panels", async () => {
  const user = userEvent.setup();

  function SidePanelHarness() {
    const [open, setOpen] = useState(false);

    return (
      <>
        <button onClick={() => setOpen(true)} type="button">Open details</button>
        {open ? (
          <SidePanel onClose={() => setOpen(false)} title="Product details">
            <div className="fuma-detail-panel__content">
              <button type="button">Panel action</button>
            </div>
          </SidePanel>
        ) : null}
      </>
    );
  }

  render(<SidePanelHarness />);
  const trigger = screen.getByRole("button", { name: "Open details" });
  const backgroundRoot = trigger.parentElement!;
  const previousOverflow = document.body.style.overflow;

  await user.click(trigger);

  const dialog = screen.getByRole("dialog", { name: "Product details" });
  const resizeHandle = within(dialog).getByRole("separator", { name: "패널 너비 조절" });
  const closeButton = within(dialog).getByRole("button", { name: "상세 패널 닫기" });
  const panelAction = within(dialog).getByRole("button", { name: "Panel action" });
  expect(closeButton).toHaveFocus();
  expect(document.body).toHaveStyle({ overflow: "hidden" });
  expect(backgroundRoot).toHaveAttribute("aria-hidden", "true");
  expect(backgroundRoot).toHaveAttribute("inert");

  panelAction.focus();
  await user.tab();
  expect(resizeHandle).toHaveFocus();
  await user.tab({ shift: true });
  expect(panelAction).toHaveFocus();

  fireEvent.pointerDown(resizeHandle, { button: 0 });
  expect(document.body).toHaveClass("fuma-detail-panel-is-resizing");
  await user.keyboard("{Escape}");

  expect(screen.queryByRole("dialog", { name: "Product details" })).not.toBeInTheDocument();
  expect(document.body).not.toHaveClass("fuma-detail-panel-is-resizing");
  expect(trigger).toHaveFocus();
  expect(document.body.style.overflow).toBe(previousOverflow);
  expect(backgroundRoot).not.toHaveAttribute("aria-hidden");
  expect(backgroundRoot).not.toHaveAttribute("inert");
});

test("renders an empty-state title and description", () => {
  render(<EmptyState title="No products found" description="Change the filters and search again." />);

  expect(screen.getByRole("heading", { name: "No products found" })).toBeInTheDocument();
  expect(screen.getByText("Change the filters and search again.")).toBeInTheDocument();
});

interface ProductRow {
  id: number;
  code: string;
  name: string;
  status: "approved" | "pending";
}

const productColumns: DenseTableColumn<ProductRow>[] = [
  { id: "code", key: "code", header: "Code", width: 90 },
  { id: "name", key: "name", header: "Product name" },
  {
    id: "status",
    key: "status",
    header: "Status",
    align: "center",
    render: (row) => <StatusPill tone={row.status}>{row.status}</StatusPill>,
  },
];

// @ts-expect-error Dense table keys must identify a property on the typed row.
const invalidProductColumns: DenseTableColumn<ProductRow>[] = [{ id: "missing", key: "missing", header: "Missing" }];
// @ts-expect-error A derived column requires both a stable id and a render function.
const invalidDerivedWithoutRender: DenseTableColumn<ProductRow> = { id: "actions", header: "Actions" };
// @ts-expect-error A derived column render function still requires a stable id.
const invalidDerivedWithoutId: DenseTableColumn<ProductRow> = { header: "Actions", render: () => "View" };
// @ts-expect-error Dense table row identity must be provided by an accessor.
const invalidStringRowKey: DenseTableProps<ProductRow> = { columns: productColumns, rowKey: "id", rows: [] };
void invalidProductColumns;
void invalidDerivedWithoutRender;
void invalidDerivedWithoutId;
void invalidStringRowKey;

interface ReorderedRow {
  id: string;
  name: string;
}

function StatefulIdentityCell({ rowId }: { rowId: string }) {
  const [mountedRowId] = useState(rowId);
  return <span data-testid={`identity-${rowId}`}>{mountedRowId}</span>;
}

const derivedColumns: DenseTableColumn<ReorderedRow>[] = [
  {
    id: "identity",
    header: "Identity",
    render: (row) => <StatefulIdentityCell rowId={row.id} />,
  },
  {
    id: "actions",
    header: "Actions",
    render: (row) => <span>Inspect {row.name}</span>,
  },
];

test("preserves row identity through reordering and supports unique derived columns", () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
  const firstRows: ReorderedRow[] = [
    { id: "row-a", name: "Alpha" },
    { id: "row-b", name: "Beta" },
  ];

  try {
    const { rerender } = render(
      <DenseTable columns={derivedColumns} rowKey={(row) => row.id} rows={firstRows} />,
    );

    rerender(
      <DenseTable
        columns={derivedColumns}
        rowKey={(row) => row.id}
        rows={[firstRows[1], firstRows[0]]}
      />,
    );

    expect(screen.getByTestId("identity-row-a")).toHaveTextContent("row-a");
    expect(screen.getByTestId("identity-row-b")).toHaveTextContent("row-b");
    expect(screen.getByText("Inspect Alpha")).toBeInTheDocument();
    expect(screen.getByText("Inspect Beta")).toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalled();
  } finally {
    consoleError.mockRestore();
  }
});

test("renders a key-only data column using the data key as its stable identity", () => {
  const columns: DenseTableColumn<ProductRow>[] = [{ key: "name", header: "Product name" }];
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

  try {
    render(
      <DenseTable
        columns={columns}
        rowKey={(row) => row.id}
        rows={[{ id: 202, code: "P-002", name: "Key-only product", status: "pending" }]}
      />,
    );

    expect(screen.getByRole("cell", { name: "Key-only product" })).toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalled();
  } finally {
    consoleError.mockRestore();
  }
});

test("renders boolean data using Korean defaults", () => {
  const columns: DenseTableColumn<{ id: number; enabled: boolean }>[] = [
    { id: "enabled", key: "enabled", header: "사용 여부" },
  ];

  render(
    <DenseTable
      columns={columns}
      rowKey={(row) => row.id}
      rows={[
        { id: 1, enabled: true },
        { id: 2, enabled: false },
      ]}
    />,
  );

  expect(screen.getByRole("cell", { name: "예" })).toBeInTheDocument();
  expect(screen.getByRole("cell", { name: "아니오" })).toBeInTheDocument();
});

test("renders typed table columns, rows, custom cells, and a footer", () => {
  render(
    <DenseTable
      columns={productColumns}
      footer="1 product"
      rowKey={(row) => row.id}
      rows={[{ id: 101, code: "P-001", name: "FUMA sample", status: "approved" }]}
    />,
  );

  const table = screen.getByRole("table");
  expect(within(table).getByRole("columnheader", { name: "Code" })).toBeInTheDocument();
  expect(within(table).getByRole("cell", { name: "P-001" })).toBeInTheDocument();
  expect(within(table).getByText("approved")).toHaveClass("hsas-status-pill--approved");
  expect(screen.getByText("1 product")).toBeInTheDocument();
});

test("switches a typed choice tab while preserving an optional action", async () => {
  const user = userEvent.setup();

  function ChoiceTabsFixture() {
    const [value, setValue] = useState<"draft" | "done" | null>(null);

    return (
      <ChoiceTabs
        actions={<Button>Add item</Button>}
        ariaLabel="Review status"
        className="fixture-tabs"
        emptyOption={{ label: "All", onSelect: () => setValue(null) }}
        onChange={setValue}
        options={[
          { label: "Draft", value: "draft" },
          { label: "Complete", value: "done" },
        ]}
        value={value}
      />
    );
  }

  render(<ChoiceTabsFixture />);

  const navigation = screen.getByRole("navigation", { name: "Review status" });
  expect(navigation).toHaveClass("fuma-creator-category-filter", "fixture-tabs");
  expect(within(navigation).getByRole("button", { name: "All" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(within(navigation).getByRole("button", { name: "Add item" })).toBeInTheDocument();

  await user.click(within(navigation).getByRole("button", { name: "Complete" }));
  expect(within(navigation).getByRole("button", { name: "Complete" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("centers every cell when the table align is set", () => {
  render(
    <DenseTable
      align="center"
      columns={[
        { key: "code", header: "Code" },
        { key: "name", header: "Product name" },
      ]}
      rowKey={(row) => row.id}
      rows={[{ id: 101, code: "P-001", name: "Centered product", status: "approved" }]}
    />,
  );

  const dataRow = screen.getByRole("row", { name: /Centered product/ });
  expect(
    within(dataRow).getAllByRole("cell").every((cell) => (
      cell.classList.contains("hsas-dense-table__cell--center")
    )),
  ).toBe(true);
});

test("keeps read-only table rows out of the keyboard tab order", () => {
  render(
    <DenseTable
      columns={productColumns}
      rowKey={(row) => row.id}
      rows={[{ id: 101, code: "P-001", name: "Read-only product", status: "approved" }]}
    />,
  );

  const row = screen.getByRole("row", { name: /Read-only product/ });
  expect(row).not.toHaveAttribute("tabindex");
  expect(row).not.toHaveAttribute("aria-selected");
});

test("selects rows by mouse and keyboard and ignores nested controls", async () => {
  const user = userEvent.setup();
  const onRowClick = vi.fn();
  const columns: DenseTableColumn<ProductRow>[] = [
    { key: "name", header: "Product name" },
    { id: "action", header: "Action", render: () => <button type="button">Open</button> },
  ];
  const rows: ProductRow[] = [
    { id: 101, code: "P-001", name: "Clickable product", status: "approved" },
  ];
  render(
    <DenseTable
      columns={columns}
      onRowClick={onRowClick}
      rowKey={(row) => row.id}
      rows={rows}
    />,
  );

  const row = screen.getByRole("row", { name: /Clickable product/ });
  await user.click(row);
  expect(row).toHaveAttribute("aria-selected", "true");
  expect(onRowClick).toHaveBeenCalledTimes(1);

  await user.click(screen.getByRole("button", { name: "Open" }));
  expect(onRowClick).toHaveBeenCalledTimes(1);

  row.focus();
  await user.keyboard("{Enter}");
  expect(onRowClick).toHaveBeenCalledTimes(2);
});

test("renders a table-specific empty message when there are no rows", () => {
  render(
    <DenseTable
      columns={productColumns}
      emptyMessage="No matching products."
      rowKey={(row) => row.id}
      rows={[]}
    />,
  );

  expect(screen.getByRole("cell", { name: "No matching products." })).toBeInTheDocument();
});

test("uses the HSAS empty-result copy when no table message is supplied", () => {
  render(<DenseTable columns={productColumns} rowKey={(row) => row.id} rows={[]} />);

  expect(screen.getByRole("cell", { name: "조회 결과가 없습니다." })).toBeInTheDocument();
});
