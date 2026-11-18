import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, getToken, setToken } from "../api";

const AuthContext = createContext(null);
export const RANK = { member: 1, officer: 2, admin: 3 };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  // On page load, use the saved token (if any) to find out who is logged in.
  useEffect(() => {
    if (!getToken()) return;
    api("/auth/me")
      .then((d) => setUser(d.user))
      .catch(() => setToken(null)) // expired or invalid token
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const d = await api("/auth/login", { method: "POST", body: { email, password } });
    setToken(d.token);
    setUser(d.user);
    return d.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    const d = await api("/auth/me");
    setUser(d.user);
    return d.user;
  }, []);

  const rank = user ? RANK[user.role] || 1 : 0;
  const value = { user, setUser, loading, login, logout, refresh, isOfficer: rank >= 2, isAdmin: rank >= 3 };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
