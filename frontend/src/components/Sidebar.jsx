
import {
  LayoutDashboard,
  Boxes,
  Truck,
  ShoppingCart,
  ArrowLeftRight,
  ChartNoAxesCombined,
  Leaf,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const menuItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { path: "/products", label: "Products", icon: Boxes },
  { path: "/suppliers", label: "Suppliers", icon: Truck },
  { path: "/purchases", label: "Purchases", icon: ShoppingCart },
  { path: "/transactions", label: "Stock Transactions", icon: ArrowLeftRight },
  { path: "/reports", label: "Reports", icon: ChartNoAxesCombined },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-icon">
          <Leaf size={22} />
        </span>

        <div>
          <h2>Stockwise</h2>
          <span>Inventory workspace</span>
        </div>
      </div>

      <p className="nav-heading">WORKSPACE</p>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <strong>Stay in control</strong>
        <p>Keep stock levels healthy and orders moving.</p>
        <small>Stockwise Inventory Suite</small>
      </div>
    </aside>
  );
}
