import { isValidElement, type CSSProperties, type Key, type ReactNode } from "react";

export interface DenseTableColumn<T> {
  id: string;
  key?: keyof T;
  header: ReactNode;
  width?: CSSProperties["width"];
  align?: "left" | "center" | "right";
  render?: (row: T) => ReactNode;
}

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

export function DenseTable<T extends object>({
  columns,
  emptyMessage = "조회 결과가 없습니다.",
  footer,
  rowKey,
  rows,
}: DenseTableProps<T>) {
  return (
    <div className="hsas-dense-table-wrap">
      <table className="hsas-dense-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                className={`hsas-dense-table__cell--${column.align ?? "left"}`}
                key={column.id}
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
                    key={column.id}
                  >
                    {column.render
                      ? column.render(row)
                      : column.key == null
                        ? null
                        : cellValue(row, column.key)}
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
