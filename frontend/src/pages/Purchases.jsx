import { useEffect, useState } from "react";
import { Plus, RefreshCw, Pencil, Trash2 } from "lucide-react";
import api, { getErrorMessage } from "../services/api";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";

export default function Purchases() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);

  const [supplier, setSupplier] = useState("");
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [editForm, setEditForm] = useState({
    supplier_id: "",
    product_id: "",
    quantity: 1,
    unit_price: 0,
    status: "draft",
  });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [p, s, pr] = await Promise.all([
        api.get("/purchases/"),
        api.get("/suppliers/"),
        api.get("/products/"),
      ]);
      setPurchases(Array.isArray(p.data) ? p.data : p.data.items || []);
      setSuppliers(Array.isArray(s.data) ? s.data : s.data.items || []);
      setProducts(Array.isArray(pr.data) ? pr.data : pr.data.items || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createPurchase(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    try {
      await api.post("/purchases/", {
        supplier_id: Number(supplier),
        items: [
          {
            product_id: Number(product),
            quantity: Number(quantity),
            unit_price: Number(price),
          },
        ],
      });
      setShowModal(false);
      setSupplier("");
      setProduct("");
      setQuantity(1);
      setPrice(0);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function updateStatus(id, status) {
    setError("");
    setNotice("");
    try {
      await api.put(`/purchases/${id}`, { status });
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  function openEdit(purchase) {
    const firstItem = purchase.items?.[0] || {};
    setEditingPurchase(purchase);
    setEditForm({
      supplier_id: String(purchase.supplier_id ?? ""),
      product_id: String(firstItem.product_id ?? ""),
      quantity: firstItem.quantity ?? 1,
      unit_price: firstItem.unit_price ?? 0,
      status: purchase.status ?? "draft",
    });
    setNotice("");
    setError("");
  }

  function saveEditPreview(e) {
    e.preventDefault();
    if (!editingPurchase) return;

    const selectedProduct = products.find(
      (item) => String(item.id) === String(editForm.product_id)
    );
    const updatedItem = {
      ...(editingPurchase.items?.[0] || {}),
      product_id: Number(editForm.product_id),
      quantity: Number(editForm.quantity),
      unit_price: Number(editForm.unit_price),
    };

    setPurchases((current) =>
      current.map((purchase) =>
        purchase.id === editingPurchase.id
          ? {
              ...purchase,
              supplier_id: Number(editForm.supplier_id),
              status: editForm.status,
              items: [updatedItem, ...(purchase.items || []).slice(1)],
              total_amount: Number(editForm.quantity) * Number(editForm.unit_price),
              _preview_product_name: selectedProduct?.name,
            }
          : purchase
      )
    );
    setEditingPurchase(null);
    setNotice("Edit preview updated on this page only. It has not been saved to the database because the backend currently supports status updates only.");
  }

  function deletePurchasePreview(purchase) {
    const confirmed = window.confirm(
      `Remove purchase order #${purchase.id} from this page preview? This will not delete it from the database.`
    );
    if (!confirmed) return;
    setPurchases((current) => current.filter((item) => item.id !== purchase.id));
    setNotice(`Purchase order #${purchase.id} was removed from this page preview only. It is still stored in the database.`);
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">PROCUREMENT</span>
          <h1>Purchases</h1>
          <p>Create and manage purchase orders.</p>
        </div>
        {isAdmin && (
          <button className="primary-button" onClick={() => setShowModal(true)}>
            <Plus size={17} /> New Purchase
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
      {notice && <div className="info-message">{notice}</div>}

      <section className="content-card">
        <div className="section-heading">
          <h3>Purchase Orders</h3>
          <button className="secondary-button" onClick={loadData}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        <DataTable
          rows={purchases}
          loading={loading}
          columns={[
            { key: "id", label: "Order ID" },
            {
              key: "supplier_id",
              label: "Supplier",
              render: (id) => suppliers.find((item) => item.id === id)?.name || `Supplier #${id}`,
            },
            {
              key: "created_at",
              label: "Date",
              render: (value) => value ? new Date(value).toLocaleDateString() : "—",
            },
            {
              key: "total_amount",
              label: "Total",
              render: (value) => `₹${Number(value || 0).toFixed(2)}`,
            },
            { key: "status", label: "Status" },
            {
              key: "id",
              label: "Actions",
              render: (id, row) => (
                <div className="table-actions">
                  {isAdmin && (
                    <>
                      <button type="button" onClick={() => openEdit(row)} title="Edit purchase order">
                        <Pencil size={14} /> Edit
                      </button>
                      <button type="button" className="danger-button" onClick={() => deletePurchasePreview(row)} title="Delete purchase order">
                        <Trash2 size={14} /> Delete
                      </button>
                    </>
                  )}
                  {isAdmin && row.status === "draft" && (
                    <button type="button" onClick={() => updateStatus(id, "ordered")}>Order</button>
                  )}
                  {isAdmin && row.status === "ordered" && (
                    <button type="button" onClick={() => updateStatus(id, "received")}>Receive</button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </section>

      {isAdmin && showModal && (
        <Modal title="Create Purchase Order" onClose={() => setShowModal(false)}>
          <form className="form-grid" onSubmit={createPurchase}>
            <label className="full-field">
              Supplier
              <select required value={supplier} onChange={(e) => setSupplier(e.target.value)}>
                <option value="">Select supplier</option>
                {suppliers.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label className="full-field">
              Product
              <select required value={product} onChange={(e) => {
                setProduct(e.target.value);
                const selected = products.find((item) => String(item.id) === e.target.value);
                if (selected) setPrice(selected.unit_price);
              }}>
                <option value="">Select product</option>
                {products.map((item) => <option value={item.id} key={item.id}>{item.name} - {item.sku}</option>)}
              </select>
            </label>
            <label>
              Quantity
              <input type="number" min="1" required value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </label>
            <label>
              Unit Price
              <input type="number" min="0" step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)} />
            </label>
            <div className="form-actions">
              <button type="button" className="secondary-button" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="primary-button">Create Purchase</button>
            </div>
          </form>
        </Modal>
      )}

      {isAdmin && editingPurchase && (
        <Modal title={`Edit Purchase Order #${editingPurchase.id}`} onClose={() => setEditingPurchase(null)}>
          <form className="form-grid" onSubmit={saveEditPreview}>
            <label className="full-field">
              Supplier
              <select required value={editForm.supplier_id} onChange={(e) => setEditForm({ ...editForm, supplier_id: e.target.value })}>
                <option value="">Select supplier</option>
                {suppliers.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label className="full-field">
              Product
              <select required value={editForm.product_id} onChange={(e) => setEditForm({ ...editForm, product_id: e.target.value })}>
                <option value="">Select product</option>
                {products.map((item) => <option value={item.id} key={item.id}>{item.name} - {item.sku}</option>)}
              </select>
            </label>
            <label>
              Quantity
              <input type="number" min="1" required value={editForm.quantity} onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })} />
            </label>
            <label>
              Unit Price
              <input type="number" min="0" step="0.01" required value={editForm.unit_price} onChange={(e) => setEditForm({ ...editForm, unit_price: e.target.value })} />
            </label>
            <label className="full-field">
              Status
              <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="ordered">Ordered</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <div className="form-actions">
              <button type="button" className="secondary-button" onClick={() => setEditingPurchase(null)}>Cancel</button>
              <button className="primary-button">Save Preview</button>
            </div>
            <p className="full-field" style={{ fontSize: 12, color: "#9a6700", margin: 0 }}>
              Demo preview only: these edits are shown on this page and are not saved to the database.
            </p>
          </form>
        </Modal>
      )}
    </>
  );
}
