
import {
  createContext,
  useContext,
  useState,
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("inventory_user") || "null"
      );
    } catch {
      return null;
    }
  });

  async function login(email, password) {
    const formData = new URLSearchParams();

    formData.append("username", email);
    formData.append("password", password);

    const response = await api.post(
      "/auth/login",
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const token = response.data.access_token;

    localStorage.setItem("access_token", token);

    let profile = { email };

    // Optional profile endpoint, if your backend provides it.
    try {
      const profileResponse = await api.get("/auth/me");
      profile = profileResponse.data;
    } catch {
      // Login can still work without this endpoint.
    }

    localStorage.setItem(
      "inventory_user",
      JSON.stringify(profile)
    );

    setUser(profile);

    return response.data;
  }

  async function register(formData) {
    const response = await api.post(
      "/auth/register",
      formData
    );

    return response.data;
  }

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("inventory_user");

    setUser(null);
    window.location.href = "/login";
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
