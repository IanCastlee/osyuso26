import React, { useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import CustomerHomePage from "./customer_components/pages/CustomerHomePage";

function HomeRedirect() {
  const { user } = useAuth();

  const storedAuth = useMemo(() => {
    try {
      const raw = sessionStorage.getItem("auth-storage");
      if (!raw) return {};

      const parsed = JSON.parse(raw);

      return {
        token: parsed?.state?.token || parsed?.token || null,
        user: parsed?.state?.user || parsed?.user || null,
      };
    } catch {
      return {};
    }
  }, []);

  const authUser = user || storedAuth.user;
  const role = String(authUser?.role || "").toLowerCase();

  if (storedAuth.token && role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  if (storedAuth.token && role === "vendor") {
    return <Navigate to="/vendor" replace />;
  }

  return <CustomerHomePage />;
}

export default HomeRedirect;
