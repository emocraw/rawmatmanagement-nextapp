"use client";

import type { ReactNode } from "react";

export type SelectableTableColumn<T> = {
  key: string;
  header: ReactNode;
  renderCell: (row: T) => ReactNode;
};

type SelectableDataTableProps<T> = {
  rows: T[];
  columns: SelectableTableColumn<T>[];
  getRowKey: (row: T) => string;
  selectedKey?: string | null;
  onSelectRow?: (row: T) => void;
  tbodyId?: string;
  wrapperClassName?: string;
  tableClassName?: string;
};

export function SelectableDataTable<T>({
  rows,
  columns,
  getRowKey,
  selectedKey = null,
  onSelectRow,
  tbodyId,
  wrapperClassName = "table-wrap",
  tableClassName = "table border border-1"
}: SelectableDataTableProps<T>) {
  return (
    <div className={wrapperClassName}>
      <table className={tableClassName}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody id={tbodyId}>
          {rows.map((row) => {
            const key = getRowKey(row);
            return (
              <tr
                key={key}
                className={selectedKey === key ? "selected-row" : ""}
                style={{ cursor: onSelectRow ? "pointer" : "default" }}
                onClick={onSelectRow ? () => onSelectRow(row) : undefined}
              >
                {columns.map((column) => (
                  <td key={column.key}>{column.renderCell(row)}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
