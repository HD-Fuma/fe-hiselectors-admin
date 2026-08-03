import { isValidElement, type CSSProperties, type Key, type ReactNode } from "react";

interface DenseTableColumnBase {
  header: ReactNode;
  width?: CSSProperties["width"];
  align?: "left" | "center" | "right";
}

export type DenseTableColumn<T> =
  | (DenseTableColumnBase & {
      key: keyof T;
      id?: string;
      render?: (row: T) => ReactNode;
    })
  | (DenseTableColumnBase & {
      id: string;
      key?: never;
      render: (row: T) => ReactNode;
    });

export interface DenseTableProps<T extends object> {
  columns: DenseTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => Key;
  emptyMessage?: ReactNode;
  footer?: ReactNode;
}

function cellValue<T extends object>(row: T, key: keyof T): ReactNode {
  const value = row[key];

  if (value == null || typeof value === "string" || typeof value === "number") {
    return value as ReactNode;
  }

  if (typeof value === "boolean") {
    return value ? "예" : "아니오";
  }

  if (isValidElement(value)) {
    return value;
  }

  return String(value);
}

function columnIdentity<T>(column: DenseTableColumn<T>) {
  return column.id ?? String(column.key);
}

function renderedCell<T extends object>(column: DenseTableColumn<T>, row: T) {
  if (column.render) {
    return column.render(row);
  }

  return column.key === undefined ? null : cellValue(row, column.key);
}

export function DenseTable<T extends object>({
  columns,
  emptyMessage = "조회 결과가 없습니다.",
  footer,
  rowKey,
  rows,
}: DenseTableProps<T>) {
  return (
    <div className="hsas-dense-table-wrap" data-visual-contract="dense-table">
      <table className="hsas-dense-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                className={`hsas-dense-table__cell--${column.align ?? "left"}`}
                key={columnIdentity(column)}
                scope="col"
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="hsas-dense-table__empty" colSpan={Math.max(columns.length, 1)}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((column) => (
                  <td
                    className={`hsas-dense-table__cell--${column.align ?? "left"}`}
                    key={columnIdentity(column)}
                  >
                    {renderedCell(column, row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {footer ? <div className="hsas-dense-table__footer">{footer}</div> : null}
    </div>
  );
}
