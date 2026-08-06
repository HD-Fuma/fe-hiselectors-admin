import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { Button, TextInput } from "./Controls";
import { DenseTable, type DenseTableColumn, type DenseTableProps } from "./DenseTable";
import { EmptyState } from "./EmptyState";
import { FormRow, type FormRowProps } from "./FormRow";
import { ImageTile, type ImageTileProps } from "./ImageTile";
import { Modal } from "./Modal";
import { Pagination } from "./Pagination";
import { SearchPanel } from "./SearchPanel";
import { SectionTabs, type SectionTabsProps } from "./SectionTabs";
import { StatusPill } from "./StatusPill";

// @ts-expect-error Form-row labels are text-only contracts.
const invalidFormRowLabel: FormRowProps = { children: "field", label: 42 };
// @ts-expect-error Form-row help is a text-only contract.
const invalidFormRowHelp: FormRowProps = { children: "field", help: 42, label: "Label" };
// @ts-expect-error Section-tab labels are text-only contracts.
const invalidSectionTabLabel: SectionTabsProps = { activeId: "details", items: [{ id: "details", label: 42 }] };
// @ts-expect-error Image-tile actions must be string labels.
const invalidImageTileActions: ImageTileProps = { actions: [42], alt: "Product image" };
void invalidFormRowLabel;
void invalidFormRowHelp;
void invalidSectionTabLabel;
void invalidImageTileActions;

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

test("marks the active static section without interactive tab semantics", () => {
  render(
    <SectionTabs
      activeId="media"
      items={[
        { id: "details", label: "Details" },
        { id: "media", label: "Media" },
      ]}
    />,
  );

  const navigation = screen.getByRole("navigation", { name: "섹션" });
  expect(within(navigation).getByText("Media")).toHaveAttribute("aria-current", "page");
  expect(within(navigation).getByText("Details")).not.toHaveAttribute("aria-current");
  expect(within(navigation).queryByRole("tab")).not.toBeInTheDocument();
  expect(within(navigation).queryByRole("button")).not.toBeInTheDocument();
});

test("shows the current page, total pages, and page size", () => {
  render(<Pagination page={2} totalPages={7} pageSize={25} />);

  const pagination = screen.getByRole("navigation", { name: "페이지 이동" });
  expect(within(pagination).getByText("2 / 7 페이지")).toBeInTheDocument();
  expect(within(pagination).getByText("페이지당 25개")).toBeInTheDocument();
  expect(within(pagination).getByRole("button", { name: "이전 페이지" })).toBeDisabled();
  expect(within(pagination).getByRole("button", { name: "다음 페이지" })).toBeDisabled();
});

test("renders an image with alt text or an empty upload tile with actions", () => {
  render(
    <>
      <ImageTile alt="Product thumbnail" src="/product-thumbnail.png" />
      <ImageTile alt="Additional product image" empty actions={["Add image"]} />
    </>,
  );

  expect(screen.getByRole("img", { name: "Product thumbnail" })).toHaveAttribute(
    "src",
    "/product-thumbnail.png",
  );
  const emptyTile = screen.getByRole("group", { name: "Additional product image" });
  expect(within(emptyTile).getByText("이미지 등록")).toBeInTheDocument();
  expect(within(emptyTile).getByRole("button", { name: "Add image" })).toBeInTheDocument();
});

test("renders string image actions as inert tile controls", () => {
  render(<ImageTile alt="Gallery image" empty actions={["Register", "Delete", "View"]} />);

  const tile = screen.getByRole("group", { name: "Gallery image" });
  expect(within(tile).getByRole("button", { name: "Register" })).toBeInTheDocument();
  expect(within(tile).getByRole("button", { name: "Delete" })).toBeInTheDocument();
  expect(within(tile).getByRole("button", { name: "View" })).toBeInTheDocument();
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
  trigger.focus();

  rerender(modalState(true));

  const dialog = screen.getByRole("dialog", { name: "Approve product" });
  const firstControl = within(dialog).getByRole("textbox", { name: "Approval reason" });
  const lastControl = within(dialog).getByRole("button", { name: "Confirm" });
  expect(firstControl).toHaveFocus();
  expect(backgroundRoot).toHaveAttribute("aria-hidden", "true");
  expect(backgroundRoot).toHaveAttribute("inert");

  await user.tab({ shift: true });
  expect(lastControl).toHaveFocus();
  await user.tab();
  expect(firstControl).toHaveFocus();

  rerender(modalState(false));

  expect(trigger).toHaveFocus();
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
