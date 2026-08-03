import { render, screen, within } from "@testing-library/react";
import { Button, TextInput } from "./Controls";
import { DenseTable, type DenseTableColumn } from "./DenseTable";
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

  expect(screen.getByText("Product code")).toBeInTheDocument();
  expect(screen.getByText("required")).toHaveClass("hsas-visually-hidden");
  expect(screen.getByText("Use the OMS product code.")).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Product code value" })).toBeInTheDocument();
});

test("uses the visible form-row label as the control's accessible name", () => {
  render(
    <FormRow label="Owner">
      <TextInput />
    </FormRow>,
  );

  expect(screen.getByRole("textbox", { name: "Owner" })).toBeInTheDocument();
});

test("renders search fields and actions inside an accessible search landmark", () => {
  render(
    <SearchPanel actions={<Button variant="primary">Search</Button>}>
      <TextInput aria-label="Search term" />
    </SearchPanel>,
  );

  const search = screen.getByRole("search", { name: "Search filters" });
  expect(within(search).getByRole("textbox", { name: "Search term" })).toBeInTheDocument();
  expect(within(search).getByRole("button", { name: "Search" })).toBeInTheDocument();
});

test("marks the active section tab as selected", () => {
  render(
    <SectionTabs
      activeId="media"
      items={[
        { id: "details", label: "Details" },
        { id: "media", label: "Media" },
      ]}
    />,
  );

  expect(screen.getByRole("tablist", { name: "Sections" })).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "Media" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("tab", { name: "Details" })).toHaveAttribute(
    "aria-selected",
    "false",
  );
});

test("shows the current page, total pages, and page size", () => {
  render(<Pagination page={2} totalPages={7} pageSize={25} />);

  const pagination = screen.getByRole("navigation", { name: "Pagination" });
  expect(within(pagination).getByText("Page 2 of 7")).toBeInTheDocument();
  expect(within(pagination).getByText("25 per page")).toBeInTheDocument();
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
  expect(within(emptyTile).getByText("Upload image")).toBeInTheDocument();
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
  { key: "code", header: "Code", width: 90 },
  { key: "name", header: "Product name" },
  {
    key: "status",
    header: "Status",
    align: "center",
    render: (row) => <StatusPill status={row.status}>{row.status}</StatusPill>,
  },
];

// @ts-expect-error Dense table keys must identify a property on the typed row.
const invalidProductColumns: DenseTableColumn<ProductRow>[] = [{ key: "missing", header: "Missing" }];
void invalidProductColumns;

test("renders typed table columns, rows, custom cells, and a footer", () => {
  render(
    <DenseTable
      columns={productColumns}
      footer="1 product"
      rowKey="id"
      rows={[{ id: 101, code: "P-001", name: "FUMA sample", status: "approved" }]}
    />,
  );

  const table = screen.getByRole("table");
  expect(within(table).getByRole("columnheader", { name: "Code" })).toBeInTheDocument();
  expect(within(table).getByRole("cell", { name: "P-001" })).toBeInTheDocument();
  expect(within(table).getByText("approved")).toHaveClass("hsas-status-pill--approved");
  expect(screen.getByText("1 product")).toBeInTheDocument();
});

test("renders a table-specific empty message when there are no rows", () => {
  render(
    <DenseTable
      columns={productColumns}
      emptyMessage="No matching products."
      rowKey="id"
      rows={[]}
    />,
  );

  expect(screen.getByRole("cell", { name: "No matching products." })).toBeInTheDocument();
});

test("uses the HSAS empty-result copy when no table message is supplied", () => {
  render(<DenseTable columns={productColumns} rowKey="id" rows={[]} />);

  expect(screen.getByRole("cell", { name: "조회 결과가 없습니다." })).toBeInTheDocument();
});
