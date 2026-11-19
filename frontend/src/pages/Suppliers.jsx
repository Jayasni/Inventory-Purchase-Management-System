import { useEffect, useState } from "react";
import { Plus, RefreshCw, Pencil, Trash2 } from "lucide-react";
import api, { getErrorMessage } from "../services/api";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
};

export default function Suppliers() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadSuppliers() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/suppliers/");
      setSuppliers(
        Array.isArray(response.data)
          ? response.data
          : response.data.items || []
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSuppliers();
  }, []);

  function openAddModal() {
    setEditingSupplier(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  }

  function openEditModal(supplier) {
    setEditingSupplier(supplier);
    setForm({
      name: supplier.name || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
    });
    setError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingSupplier(null);
    setForm(emptyForm);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
    };

    try {
      if (editingSupplier) {
        await api.put(`/suppliers/${editingSupplier.id}`, payload);
      } else {
        await api.post("/suppliers/", payload);
      }
      closeModal();
      await loadSuppliers();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(supplier) {
    const confirmed = window.confirm(
      `Are you sure you want to delete supplier "${supplier.name}"? This will deactivate the supplier.`
    );
    if (!confirmed) return;

    setError("");
    try {
      await api.delete(`/suppliers/${supplier.id}`);
      await loadSuppliers();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const columns = [
    { key: "name", label: "Supplier" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "address", label: "Address" },
    {
      key: "is_active",
      label: "Status",
      render: (v) => v ? "Active" : "Inactive",
    },
  ];

  if (isAdmin) {
    columns.push({
      key: "actions",
      label: "Actions",
      render: (_, supplier) => (
        <div className="heading-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => openEditModal(supplier)}
            aria-label={`Edit ${supplier.name}`}
            title="Edit supplier"
          >
            <Pencil size={15} /> Edit
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => handleDelete(supplier)}
            aria-label={`Delete ${supplier.name}`}
            title="Delete supplier"
          >
            <Trash2 size={15} /> Delete
          </button>
        </div>
      ),
    });
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">PARTNERS</span>
          <h1>Suppliers</h1>
          <p>Manage your supplier directory.</p>
        </div>

        {isAdmin && (
          <button className="primary-button" onClick={openAddModal}>
            <Plus size={17} /> Add Supplier
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <section className="content-card">
        <div className="section-heading">
          <h3>Supplier Directory</h3>
          <button
            className="secondary-button"
            onClick={loadSuppliers}
            disabled={loading}
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        <DataTable rows={suppliers} loading={loading} columns={columns} />
      </section>

      {isAdmin && showModal && (
        <Modal
          title={editingSupplier ? "Edit Supplier" : "Add Supplier"}
          onClose={closeModal}
        >
          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              Supplier Name
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>

            <label>
              Phone
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>

            <label>
              Address
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </label>

            <div className="form-actions">
              <button type="button" className="secondary-button" onClick={closeModal}>
                Cancel
              </button>
              <button className="primary-button" disabled={saving}>
                {saving ? "Saving..." : editingSupplier ? "Update Supplier" : "Save Supplier"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
