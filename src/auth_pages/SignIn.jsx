import React, { useState } from "react";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { RxQuestionMarkCircled } from "react-icons/rx";
import { useNavigate } from "react-router-dom";
import { PiShoppingCartSimpleFill } from "react-icons/pi";

import InputField from "../customer_components/atoms/InputField";
import useFormSubmit from "../hooks/useFormSubmit";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import fetchInstance from "../utils/fetchInstance";

function SignIn() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleUseTesterAccount = () => {
    setForm({
      email: "tester@gmail.com",
      password: "Tester@8",
    });

    setErrors({});
  };

  const { submit, loading } = useFormSubmit(
    "auth/sign-in.php",
    async (data) => {
      try {
        const storage = rememberMe ? localStorage : sessionStorage;

        storage.setItem(
          "auth-storage",
          JSON.stringify({
            state: {
              token: data.token,
              role: data.role,
            },
          }),
        );

        const res = await fetchInstance("auth/user.php");

        login(res.user);

        showToast({
          type: "success",
          message: "Login successful!",
          duration: 3000,
        });

        if (data.role === "admin") {
          navigate("/admin");
        } else if (data.role === "vendor") {
          navigate("/vendor");
        } else {
          navigate("/");
        }
      } catch (err) {
        console.error(err);
      }
    },
  );

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

    let newErrors = {};

    if (!form.email) {
      newErrors.email = "Email is required";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        await submit({
          email: form.email,
          password: form.password,
        });
      } catch (err) {
        console.error(err.message);

        showToast({
          type: "error",
          message: navigator.onLine
            ? err?.message || "Login failed"
            : "No internet connection. Please check your network.",
          duration: 5000,
        });
      }
    }
  };

  const handleFaqClick = () => navigate("/faq");
  const handleSignUpClick = () => navigate("/signup");
  const handleForgotPassword = () => navigate("/forgot-password");

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between bg-secondary px-4 text-white shadow-md sm:px-6 md:h-[70px] md:px-10">
        <h2
          onClick={() => navigate("/")}
          className="flex cursor-pointer items-center text-xl font-bold tracking-wide sm:text-2xl"
        >
          OSY <PiShoppingCartSimpleFill className="mx-1" /> SO
        </h2>

        <button
          onClick={handleFaqClick}
          className="flex items-center gap-1 rounded-full px-3 py-2 text-xs font-medium transition hover:bg-white/15"
        >
          <RxQuestionMarkCircled className="text-base" />
          FAQ
        </button>
      </header>

      <main className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center px-4 py-8 sm:px-6">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
          <section className="hidden bg-secondary p-8 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
                <PiShoppingCartSimpleFill className="text-2xl" />
              </div>

              <h1 className="mt-6 text-3xl font-bold leading-tight">
                Welcome back to your local marketplace.
              </h1>

              <p className="mt-4 text-sm leading-7 text-white/80">
                Sign in to continue browsing fresh products, manage your cart,
                and track your orders from nearby sellers.
              </p>
            </div>

            <div className="rounded-xl bg-white/10 p-4 text-sm leading-6 text-white/80">
              Fresh meat, fruits, and vegetables from trusted local shops in
              your community.
            </div>
          </section>

          <section className="p-5 sm:p-6 md:p-8">
            <div className="mb-6 text-center sm:text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
                Customer Login
              </p>

              <h1 className="mt-2 text-2xl font-bold text-gray-900">
                Welcome Back
              </h1>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Sign in to continue shopping with OSYUSO.
              </p>
            </div>

            {/* Tester Account Suggestion */}
            <div className="mb-5 rounded-xl border border-orange-200 bg-orange-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-secondary">
                    Try Demo Account
                  </p>

                  <p className="mt-1 text-xs text-gray-600">
                    Use our tester account for quick access.
                  </p>

                  <div className="mt-2 text-xs text-gray-700">
                    <p>
                      <span className="font-semibold">Email:</span>{" "}
                      tester@gmail.com
                    </p>

                    <p>
                      <span className="font-semibold">Password:</span> Tester@8
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleUseTesterAccount}
                  className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Use Account
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div className="relative">
                <InputField
                  label="Password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  icon={FaLock}
                  error={errors.password}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-gray-500 transition hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 cursor-pointer accent-orange-500"
                  />
                  Remember me
                </label>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-medium text-secondary hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}

                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-gray-500">
              Don’t have an account?{" "}
              <button
                type="button"
                onClick={handleSignUpClick}
                className="font-semibold text-secondary hover:underline"
              >
                Sign Up
              </button>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

export default SignIn;
