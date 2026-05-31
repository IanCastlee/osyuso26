import React, { useState } from "react";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { PiShoppingCartSimpleFill } from "react-icons/pi";
import { RxQuestionMarkCircled } from "react-icons/rx";
import { useLocation, useNavigate } from "react-router-dom";

import InputField from "../customer_components/atoms/InputField";
import useFormSubmit from "../hooks/useFormSubmit";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import fetchInstance from "../utils/fetchInstance";

function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});

  const { submit, loading, error } = useFormSubmit("auth/sign-in.php");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const redirectByRole = (userData) => {
    const role = String(userData?.role || "").toLowerCase();

    if (role === "admin") {
      navigate("/admin", { replace: true });
      return;
    }

    if (role === "vendor") {
      navigate("/vendor", { replace: true });
      return;
    }

    const from = location.state?.from;

    if (from && from !== "/signin") {
      navigate(from, { replace: true });
      return;
    }

    navigate("/", { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!navigator.onLine) {
      showToast({
        type: "error",
        message: "No internet connection. Please check your network.",
        duration: 5000,
      });
      return;
    }

    const newErrors = {};

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    try {
      const res = await submit({
        email: form.email.trim(),
        password: form.password,
      });

      const payload = res?.data || res || {};
      const authToken = payload?.token || res?.token;
      const signinUser = payload?.user || res?.user || null;

      if (!authToken) {
        throw new Error("Login token was not returned by the server.");
      }

      sessionStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            token: authToken,
            user: signinUser,
          },
        }),
      );

      const userRes = await fetchInstance("auth/user.php");
      const fullUser = userRes?.data?.user || userRes?.user || signinUser;

      if (!fullUser) {
        throw new Error("User profile was not returned by the server.");
      }

      login(fullUser, authToken);

      showToast({
        type: "success",
        message: "Signed in successfully.",
        duration: 2500,
      });

      redirectByRole(fullUser);
    } catch (err) {
      showToast({
        type: "error",
        message: err?.message || "Sign in failed",
        duration: 4000,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between bg-secondary px-4 text-white shadow-md sm:px-6 md:h-[70px] md:px-10">
        <h2
          onClick={() => navigate("/")}
          className="flex cursor-pointer items-center text-xl font-bold tracking-wide sm:text-2xl"
        >
          OSY
          <PiShoppingCartSimpleFill className="mx-1" />
          SO
        </h2>

        <button
          type="button"
          onClick={() => navigate("/faq")}
          className="flex items-center gap-1 rounded-full px-3 py-2 text-xs font-medium transition hover:bg-white/15"
          title="FAQ"
        >
          <RxQuestionMarkCircled className="text-base" />
          FAQ
        </button>
      </header>

      <main className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center px-2 py-8 sm:px-6">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
          <section className="hidden bg-secondary p-8 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
                <PiShoppingCartSimpleFill className="text-2xl" />
              </div>

              <h1 className="mt-6 text-3xl font-bold leading-tight">
                Welcome back to OSYUSO.
              </h1>

              <p className="mt-4 text-sm leading-7 text-white/80">
                Sign in to continue shopping fresh local products, manage your
                orders, and access your account.
              </p>
            </div>

            <div className="rounded-xl bg-white/10 p-4 text-sm leading-6 text-white/80">
              Fresh products from nearby sellers, ready when you are.
            </div>
          </section>

          <section className="p-5 sm:p-6 md:p-8">
            <div className="mb-6 text-center sm:text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
                Customer Account
              </p>

              <h1 className="mt-2 text-2xl font-bold text-gray-900">Sign In</h1>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Enter your account details to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mb-1">
              <InputField
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                icon={FaEnvelope}
                error={errors.email}
              />

              <InputField
                label="Password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                icon={FaLock}
                error={errors.password}
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-xs font-semibold text-secondary hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-center text-xs font-medium text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-secondary px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-gray-500">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/signup")}
                className="font-semibold text-secondary hover:underline"
              >
                Create Account
              </button>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

export default SignIn;
