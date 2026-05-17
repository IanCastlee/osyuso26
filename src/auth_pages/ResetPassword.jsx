import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaEye, FaEyeSlash, FaLock } from "react-icons/fa";
import { PiShoppingCartSimpleFill } from "react-icons/pi";
import { RxQuestionMarkCircled } from "react-icons/rx";
import { useToast } from "../context/ToastContext";
import useFormSubmit from "../hooks/useFormSubmit";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const { showToast } = useToast();

  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const { submit, loading } = useFormSubmit(
    "auth/reset-password.php",
    (res) => {
      showToast({
        type: "success",
        message: res.message,
        duration: 4000,
      });

      setTimeout(() => {
        navigate("/signin");
      }, 1500);
    },
  );

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      showToast({
        type: "error",
        message: "Invalid reset token",
      });
      return;
    }

    if (!form.password || !form.confirmPassword) {
      showToast({
        type: "error",
        message: "All fields are required",
      });
      return;
    }

    if (form.password.length < 6) {
      showToast({
        type: "error",
        message: "Password must be at least 6 characters",
      });
      return;
    }

    if (form.password !== form.confirmPassword) {
      showToast({
        type: "error",
        message: "Passwords do not match",
      });
      return;
    }

    try {
      await submit({
        token,
        password: form.password,
      });
    } catch (err) {
      showToast({
        type: "error",
        message: err?.message || "Something went wrong",
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
          OSY <PiShoppingCartSimpleFill className="mx-1" /> SO
        </h2>

        <button
          onClick={() => navigate("/faq")}
          className="flex items-center gap-1 rounded-full px-3 py-2 text-xs font-medium transition hover:bg-white/15"
        >
          <RxQuestionMarkCircled className="text-base" />
          FAQ
        </button>
      </header>

      <main className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center px-4 py-8 sm:px-6">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-secondary">
            <FaLock className="text-2xl" />
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Create a new password for your OSYUSO account.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                New Password
              </label>

              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter new password"
                  value={form.password}
                  onChange={handleChange}
                  className="h-11 w-full rounded-lg border border-gray-200 pl-10 pr-10 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Confirm Password
              </label>

              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="h-11 w-full rounded-lg border border-gray-200 pl-10 pr-10 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-5 flex h-11 w-full items-center justify-center rounded-lg bg-secondary text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Updating password..." : "Update Password"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/signin")}
            className="mt-4 w-full text-center text-xs font-medium text-secondary hover:underline"
          >
            Back to Sign In
          </button>
        </form>
      </main>
    </div>
  );
}

export default ResetPassword;
