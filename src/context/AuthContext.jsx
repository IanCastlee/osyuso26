import { createContext, useContext, useEffect, useState } from "react";
import fetchInstance from "../utils/fetchInstance";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const getStoredAuth = () => {
    try {
      const raw = sessionStorage.getItem("auth-storage");
      if (!raw) return { token: null, user: null };

      const parsed = JSON.parse(raw);

      return {
        token: parsed?.state?.token || parsed?.token || null,
        user: parsed?.state?.user || parsed?.user || null,
      };
    } catch {
      return { token: null, user: null };
    }
  };

  const saveAuth = (authToken, userData) => {
    sessionStorage.setItem(
      "auth-storage",
      JSON.stringify({
        state: {
          token: authToken,
          user: userData,
        },
      }),
    );
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const stored = getStoredAuth();

        if (!stored.token) {
          setUser(null);
          setToken(null);
          return;
        }

        setToken(stored.token);

        const res = await fetchInstance("auth/user.php");
        const fetchedUser = res?.data?.user || res?.user || stored.user;

        if (!fetchedUser) {
          throw new Error("User not found");
        }

        setUser(fetchedUser);
        saveAuth(stored.token, fetchedUser);
      } catch (err) {
        sessionStorage.removeItem("auth-storage");
        localStorage.removeItem("auth-storage");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);

    if (authToken && userData) {
      saveAuth(authToken, userData);
    }
  };

  const logout = () => {
    sessionStorage.removeItem("auth-storage");
    localStorage.removeItem("auth-storage");
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
