import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

const STORAGE_KEY = "hdpe_auth";
const AuthContext = createContext(null);

function readStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;

    if (!parsed?.token || parsed?.isDemo || String(parsed.token).startsWith("demo-")) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readStoredSession());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [session]);

  useEffect(() => {
    if (!session?.token) {
      return;
    }

    api
      .me(session.token)
      .then((payload) =>
        setSession((current) => (current ? { ...current, user: payload.data.user } : current))
      )
      .catch((error) => {
        if (error?.status === 401 || error?.status === 403) {
          setSession(null);
        }
      });
  }, [session?.token]);

  async function register(payload) {
    setLoading(true);

    try {
      const result = await api.register(payload);
      setSession({
        token: result.data.token,
        user: result.data.user
      });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }

  async function login(payload) {
    setLoading(true);

    try {
      const result = await api.login(payload);
      setSession({
        token: result.data.token,
        user: result.data.user
      });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setSession(null);
  }

  const value = useMemo(
    () => ({
      loading,
      session,
      user: session?.user || null,
      token: session?.token || null,
      isAuthenticated: Boolean(session?.token),
      isAdmin: session?.user?.role === "admin",
      register,
      login,
      logout
    }),
    [loading, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
