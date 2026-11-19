
import { useEffect, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import api, { getErrorMessage } from "../services/api";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";

const initialForm = {
  name: "",
  sku: "",
  description: "",
  category_id: "",
  supplier_id: "",
  min_stock: 5,
  unit_price: 0,
};

function getList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

export default function Products() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [p, c, s] = await Promise.all([
        api.get("/products/", {
          params: {
            keyword: keyword.trim() || undefined,
            category_id: categoryFilter || undefined,
          },
        }),
        api.get("/categories/"),
        api.get("/suppliers/"),
      ]);

      setProducts(getList(p.data));
      setCategories(getList(c.data));
      setSuppliers(getList(s.data));

    } catch (err) {
      console.error("Loading error:", err.response?.data || err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [keyword, categoryFilter]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      await api.post("/products/", {
        name: form.name.trim(),
        sku: form.sku.trim(),
        description: form.description.trim() || null,
        category_id: Number(form.category_id),
        supplier_id: form.supplier_id
          ? Number(form.supplier_id)
          : null,
        min_stock: Number(form.min_stock),
        unit_price: Number(form.unit_price),
      });

      setShowModal(false);
      setForm(initialForm);
      await loadData();
    } catch (err) {
      console.error("Product creation error:", err.response?.data || err);
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">CATALOGUE</span>
          <h1>Products</h1>
          <p>Manage products and stock information.</p>
        </div>

        {isAdmin && (
          <button
            className="primary-button"
            onClick={() => setShowModal(true)}
          >
            <Plus size={17} />
            Add Product
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <section className="content-card">
        <div className="section-heading">
          <h3>Product Catalogue</h3>
          <div className="heading-actions">
            <input
              type="search"
              aria-label="Search products"
              placeholder="Search name or SKU"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <button
            className="secondary-button"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        <DataTable
          rows={products}
          loading={loading}
          columns={[
            { key: "name", label: "Product" },
            { key: "sku", label: "SKU" },
            { key: "quantity", label: "Stock" },
            { key: "min_stock", label: "Minimum Stock" },
            {
              key: "unit_price",
              label: "Unit Price",
              render: (v) => `₹${v}`,
            },
            {
              key: "is_active",
              label: "Status",
              render: (v) => v ? "Active" : "Inactive",
            },
          ]}
        />
      </section>

      {isAdmin && showModal && (
        <Modal
          title="Add New Product"
          onClose={() => {
            setShowModal(false);
            setForm(initialForm);
            setError("");
          }}
        >
          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              Product Name
              <input
                required
                minLength={2}
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                placeholder="Enter product name"
              />
            </label>

            <label>
              SKU
              <input
                required
                minLength={2}
                value={form.sku}
                onChange={(e) =>
                  setForm({ ...form, sku: e.target.value })
                }
                placeholder="Example: ELEC-001"
              />
            </label>

            <label>
              Category
              <select
                required
                value={form.category_id}
                onChange={(e) =>
                  setForm({ ...form, category_id: e.target.value })
                }
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              {categories.length === 0 && (
                <small>
                  No categories available. Create a category first.
                </small>
              )}
            </label>

            <label>
              Supplier
              <select
                value={form.supplier_id}
                onChange={(e) =>
                  setForm({ ...form, supplier_id: e.target.value })
                }
              >
                <option value="">Select supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>

              {suppliers.length === 0 && (
                <small>
                  No suppliers available. Create a supplier first.
                </small>
              )}
            </label>

            <label>
              Minimum Stock
              <input
                type="number"
                min="0"
                value={form.min_stock}
                onChange={(e) =>
                  setForm({ ...form, min_stock: e.target.value })
                }
              />
            </label>

            <label>
              Unit Price
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.unit_price}
                onChange={(e) =>
                  setForm({ ...form, unit_price: e.target.value })
                }
              />
            </label>

            <label className="full-field">
              Description
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Enter product description"
              />
            </label>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setShowModal(false);
                  setForm(initialForm);
                  setError("");
                }}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={saving || categories.length === 0}
              >
                {saving ? "Saving..." : "Save Product"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
