
import { useEffect, useState } from "react";
import {
  Boxes,
  Truck,
  PackageCheck,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

import api, { getErrorMessage } from "../services/api";
import StatCard from "../components/StatCard";
import LowStockAlert from "../components/LowStockAlert";
import DataTable from "../components/DataTable";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const [summaryRes, lowRes, transactionRes] =
        await Promise.all([
          api.get("/dashboard/summary"),
          api.get("/dashboard/low-stock"),
          api.get("/dashboard/recent-transactions"),
        ]);

      setSummary(summaryRes.data);
      setLowStock(lowRes.data);
      setTransactions(transactionRes.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">OVERVIEW</span>
          <h1>Dashboard</h1>
          <p>Here's what's happening with your inventory.</p>
        </div>

        <button
          className="secondary-button"
          onClick={loadDashboard}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="stats-grid">
        <StatCard
          title="Active Products"
          value={loading ? "..." : summary?.total_products}
          icon={Boxes}
        />

        <StatCard
          title="Active Suppliers"
          value={loading ? "..." : summary?.total_suppliers}
          icon={Truck}
          color="mint"
        />

        <StatCard
          title="Stock Units"
          value={loading ? "..." : summary?.total_stock_units}
          icon={PackageCheck}
          color="gold"
        />

        <StatCard
          title="Low Stock Items"
          value={loading ? "..." : summary?.low_stock_products}
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      <div className="dashboard-grid">
        <LowStockAlert products={lowStock} />

        <section className="content-card">
          <h3>Inventory Snapshot</h3>
          <p className="card-subtitle">
            Current inventory overview
          </p>

          <h2 className="stock-value">
            ₹{Number(summary?.total_stock_value || 0).toLocaleString("en-IN")}
          </h2>

          <span className="muted-text">Estimated stock value</span>

          <div className="snapshot-row">
            <span>Pending purchase orders</span>
            <strong>{summary?.pending_purchase_orders ?? "—"}</strong>
          </div>

          <div className="snapshot-row">
            <span>Total categories</span>
            <strong>{summary?.total_categories ?? "—"}</strong>
          </div>

          <div className="snapshot-row">
            <span>Stock transactions</span>
            <strong>{summary?.total_stock_transactions ?? "—"}</strong>
          </div>
        </section>
      </div>

      <section className="content-card">
        <div className="section-heading">
          <div>
            <h3>Recent Stock Transactions</h3>
            <p>Latest inventory movements</p>
          </div>
        </div>

        <DataTable
          loading={loading}
          rows={transactions}
          columns={[
            { key: "id", label: "ID" },
            { key: "product_id", label: "Product ID" },
            { key: "transaction_type", label: "Type" },
            { key: "quantity", label: "Quantity" },
            {
              key: "created_at",
              label: "Date",
              render: (value) =>
                value ? new Date(value).toLocaleString() : "—",
            },
          ]}
        />
      </section>
    </>
  );
}
