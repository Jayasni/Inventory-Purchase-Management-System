
export default function DataTable({
  columns,
  rows,
  loading,
  emptyMessage = "No records found.",
}) {
  if (loading) {
    return <div className="table-message">Loading...</div>;
  }

  if (!rows || rows.length === 0) {
    return <div className="table-message">{emptyMessage}</div>;
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id ?? index}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render
                    ? column.render(row[column.key], row)
                    : row[column.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
