import React, { useState } from "react";
import { FaEnvelope } from "react-icons/fa";
import { PiShoppingCartSimpleFill } from "react-icons/pi";
import { RxQuestionMarkCircled } from "react-icons/rx";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import useFormSubmit from "../hooks/useFormSubmit";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const { showToast } = useToast();

  const { submit, loading } = useFormSubmit(
    "auth/forgot-password.php",
    (res) => {
      showToast({
        type: "success",
        message: res.message,
        duration: 20000,
      });

      setEmail("");
    },
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      showToast({
        type: "error",
        message: "Email is required",
        duration: 3000,
      });
      return;
    }

    try {
      await submit({ email });
    } catch (err) {
      showToast({
        type: "error",
        message: err?.message || "Something went wrong",
        duration: 6000,
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
            <FaEnvelope className="text-2xl" />
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Forgot Password
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Enter your account email and we’ll send you a reset link.
            </p>
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Email Address
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-5 flex h-11 w-full items-center justify-center rounded-lg bg-secondary text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Sending reset link..." : "Send Reset Link"}
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

export default ForgotPassword;
