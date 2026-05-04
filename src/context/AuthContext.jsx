import { createContext, useContext, useEffect, useState } from "react";
import fetchInstance from "../utils/fetchInstance";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  //  AUTO RESTORE USER ON REFRESH
  useEffect(() => {
    const initAuth = async () => {
      try {
        const tokenData = sessionStorage.getItem("auth-storage");

        if (!tokenData) {
          setUser(null);
          return;
        }

        const res = await fetchInstance("auth/user.php");
        setUser(res.user);
      } catch (err) {
        sessionStorage.removeItem("auth-storage");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  //  LOGIN (ONLY SET STATE)
  const login = (userData) => {
    setUser(userData);
  };

  //  LOGOUT
  const logout = () => {
    sessionStorage.removeItem("auth-storage");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
