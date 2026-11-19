
import { AlertTriangle } from "lucide-react";

export default function LowStockAlert({ products = [] }) {
  return (
    <section className="content-card">
      <div className="section-heading">
        <div>
          <h3>Low Stock Alerts</h3>
          <p>Products that need replenishment</p>
        </div>

        <AlertTriangle className="warning-icon" size={21} />
      </div>

      {products.length === 0 ? (
        <p className="empty-message">
          No low-stock products currently.
        </p>
      ) : (
        <div className="alert-list">
          {products.slice(0, 6).map((product) => (
            <div className="alert-item" key={product.id}>
              <div>
                <strong>{product.name}</strong>
                <small>SKU: {product.sku}</small>
              </div>

              <span className="stock-badge">
                {product.quantity} left
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
