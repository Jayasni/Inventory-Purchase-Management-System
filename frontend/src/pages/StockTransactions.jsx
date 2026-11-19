import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Search } from "lucide-react";

import api, { getErrorMessage } from "../services/api";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";

export default function StockTransactions() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    product_id: "",
    transaction_type: isAdmin ? "receipt" : "issue",
    quantity: 1,
    notes: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [t, p] = await Promise.all([
        api.get("/inventory/transactions"),
        api.get("/products/"),
      ]);
      setTransactions(Array.isArray(t.data) ? t.data : t.data.items || []);
      setProducts(Array.isArray(p.data) ? p.data : p.data.items || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const productById = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p])),
    [products]
  );

  const filteredTransactions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return transactions.filter((tx) => {
      const product = productById[tx.product_id];
      const searchable = [
        product?.name, product?.sku, tx.notes, tx.user_id, tx.id,
      ].join(" ").toLowerCase();
      return (!term || searchable.includes(term)) &&
        (!typeFilter || tx.transaction_type === typeFilter);
    });
  }, [transactions, productById, search, typeFilter]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/inventory/transactions", {
        ...form,
        product_id: Number(form.product_id),
        quantity: Number(form.quantity),
        transaction_type: isAdmin ? form.transaction_type : "issue",
      });
      setShowModal(false);
      setForm({
        product_id: "",
        transaction_type: isAdmin ? "receipt" : "issue",
        quantity: 1,
        notes: "",
      });
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">STOCK CONTROL</span>
          <h1>Stock Transactions</h1>
          <p>
            {isAdmin
              ? "Record receipts, issues and stock-count adjustments."
              : "View stock movement history and record stock issues."}
          </p>
        </div>
        <button className="primary-button" onClick={() => setShowModal(true)}>
          <Plus size={17} /> {isAdmin ? "New Transaction" : "Record Stock Issue"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <section className="content-card">
        <div className="section-heading">
          <h3>Stock Movement History</h3>
          <div className="heading-actions">
            <div className="search-field">
              <Search size={15} />
              <input
                type="search"
                aria-label="Search stock transactions"
                placeholder="Search product, SKU or notes"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              aria-label="Filter transaction type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All transaction types</option>
              <option value="receipt">Receipt</option>
              <option value="issue">Issue</option>
              <option value="adjustment">Adjustment</option>
            </select>
            <button className="secondary-button" onClick={loadData} disabled={loading}>
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
        </div>

        <DataTable
          rows={filteredTransactions.map((tx) => ({
            ...tx,
            product_name: productById[tx.product_id]?.name || `Product #${tx.product_id}`,
            sku: productById[tx.product_id]?.sku || "—",
          }))}
          loading={loading}
          columns={[
            { key: "id", label: "ID" },
            { key: "product_name", label: "Product" },
            { key: "sku", label: "SKU" },
            { key: "transaction_type", label: "Type" },
            { key: "quantity", label: "Quantity" },
            { key: "user_id", label: "User ID" },
            {
              key: "created_at",
              label: "Date",
              render: (v) => v ? new Date(v).toLocaleString() : "—",
            },
            { key: "notes", label: "Notes" },
          ]}
        />
        {!loading && filteredTransactions.length === 0 && (
          <p className="empty-state">No stock transactions match your filters.</p>
        )}
      </section>

      {showModal && (
        <Modal
          title={isAdmin ? "New Stock Transaction" : "Record Stock Issue"}
          onClose={() => setShowModal(false)}
        >
          <form className="form-grid" onSubmit={handleSubmit}>
            <label className="full-field">
              Product
              <select
                required
                value={form.product_id}
                onChange={(e) => setForm({ ...form, product_id: e.target.value })}
              >
                <option value="">Select product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — Available: {p.quantity}
                  </option>
                ))}
              </select>
            </label>

            {isAdmin ? (
              <label>
                Transaction Type
                <select
                  value={form.transaction_type}
                  onChange={(e) => setForm({ ...form, transaction_type: e.target.value })}
                >
                  <option value="receipt">Receipt</option>
                  <option value="issue">Issue</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </label>
            ) : (
              <div className="full-field">
                <strong>Transaction Type: Issue</strong>
                <p className="field-help">Staff can issue stock only. Receipts and adjustments require Admin access.</p>
              </div>
            )}

            <label>
              Quantity
              <input
                type="number"
                min="1"
                step="1"
                required
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </label>

            <label className="full-field">
              Notes
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Reason for issuing stock"
              />
            </label>

            <div className="form-actions">
              <button type="button" className="secondary-button" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="primary-button">
                {isAdmin ? "Save Transaction" : "Submit Stock Issue"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
