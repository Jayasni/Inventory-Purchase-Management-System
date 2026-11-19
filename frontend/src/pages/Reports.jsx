import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";

import api, { getErrorMessage } from "../services/api";
import DataTable from "../components/DataTable";

function downloadCSV(filename, columns, rows) {
  const escape = (value) => {
    const text = String(value ?? "");
    return `"${text.replaceAll('"', '""')}"`;
  };
  const csv = [
    columns.map(escape).join(","),
    ...rows.map((row) => columns.map((column) => escape(row[column])).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");

  async function loadReports() {
    setError("");
    try {
      const [s, l, p, t] = await Promise.all([
        api.get("/dashboard/summary"),
        api.get("/dashboard/low-stock"),
        api.get("/products/"),
        api.get("/inventory/transactions"),
      ]);
      setSummary(s.data);
      setLowStock(Array.isArray(l.data) ? l.data : []);
      setProducts(Array.isArray(p.data) ? p.data : []);
      setTransactions(Array.isArray(t.data) ? t.data : []);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  const productById = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p])),
    [products]
  );

  function exportLowStock() {
    downloadCSV(
      "low-stock-report.csv",
      ["id", "name", "sku", "quantity", "min_stock", "unit_price"],
      lowStock
    );
  }

  function exportInventory() {
    downloadCSV(
      "inventory-stock-report.csv",
      ["id", "name", "sku", "quantity", "min_stock", "unit_price", "is_active"],
      products
    );
  }

  function exportTransactions() {
    const rows = transactions.map((tx) => ({
      ...tx,
      product_name: productById[tx.product_id]?.name || `Product #${tx.product_id}`,
      sku: productById[tx.product_id]?.sku || "",
    }));
    downloadCSV(
      "stock-transaction-history.csv",
      ["id", "product_name", "sku", "transaction_type", "quantity", "user_id", "reference_type", "reference_id", "notes", "created_at"],
      rows
    );
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">INSIGHTS</span>
          <h1>Reports</h1>
          <p>Review inventory levels, stock alerts and movement history.</p>
        </div>
        <div className="heading-actions">
          <button className="secondary-button" onClick={loadReports}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="report-grid">
        <div className="report-card"><span>Active Products</span><strong>{summary?.total_products ?? "—"}</strong></div>
        <div className="report-card"><span>Total Stock Units</span><strong>{summary?.total_stock_units ?? "—"}</strong></div>
        <div className="report-card"><span>Stock Value</span><strong>₹{Number(summary?.total_stock_value || 0).toLocaleString("en-IN")}</strong></div>
        <div className="report-card"><span>Low Stock Products</span><strong>{summary?.low_stock_products ?? "—"}</strong></div>
      </div>

      <section className="content-card">
        <div className="section-heading">
          <div><h3>Download Reports</h3><p>Export inventory and transaction records as CSV files.</p></div>
        </div>
        <div className="heading-actions report-download-actions">
          <button className="primary-button" onClick={exportInventory} disabled={!products.length}>
            <Download size={16} /> Inventory Stock CSV
          </button>
          <button className="secondary-button" onClick={exportTransactions} disabled={!transactions.length}>
            <Download size={16} /> Transaction History CSV
          </button>
          <button className="secondary-button" onClick={exportLowStock} disabled={!lowStock.length}>
            <Download size={16} /> Low Stock CSV
          </button>
        </div>
      </section>

      <section className="content-card">
        <div className="section-heading">
          <div><h3>Low Stock Report</h3><p>Products that need replenishment.</p></div>
        </div>
        <DataTable
          rows={lowStock}
          columns={[
            { key: "name", label: "Product" },
            { key: "sku", label: "SKU" },
            { key: "quantity", label: "Available" },
            { key: "min_stock", label: "Minimum Stock" },
            { key: "unit_price", label: "Unit Price" },
          ]}
        />
      </section>
    </>
  );
}
