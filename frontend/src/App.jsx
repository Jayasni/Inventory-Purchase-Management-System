
import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Suppliers from "./pages/Suppliers";
import Purchases from "./pages/Purchases";
import StockTransactions from "./pages/StockTransactions";
import Reports from "./pages/Reports";

function MainLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-content">
        <Navbar />

        <main className="page-container">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? <Navigate to="/" replace /> : <Login />
        }
      />

      <Route
        path="/register"
        element={
          user ? <Navigate to="/" replace /> : <Register />
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <MainLayout><Products /></MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/suppliers"
        element={
          <ProtectedRoute>
            <MainLayout><Suppliers /></MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/purchases"
        element={
          <ProtectedRoute>
            <MainLayout><Purchases /></MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <MainLayout><StockTransactions /></MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <MainLayout><Reports /></MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={
          <Navigate to={user ? "/" : "/login"} replace />
        }
      />
    </Routes>
  );
}
