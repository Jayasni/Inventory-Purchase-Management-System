
import { Bell, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  const displayName =
    user?.full_name || user?.email || "User";

  return (
    <header className="navbar">
      <div>
        <span className="navbar-label">
          INVENTORY MANAGEMENT
        </span>
      </div>

      <div className="navbar-actions">
        <button className="icon-button" title="Notifications">
          <Bell size={19} />
        </button>

        <div className="user-profile">
          <div className="user-avatar">
            {displayName.charAt(0).toUpperCase()}
          </div>

          <span>{displayName} <small className="muted-text">({user?.role || "user"})</small></span>
        </div>

        <button
          className="icon-button"
          onClick={logout}
          title="Logout"
        >
          <LogOut size={19} />
        </button>
      </div>
    </header>
  );
}
