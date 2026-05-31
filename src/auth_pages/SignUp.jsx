import React, { useState } from "react";
import { FaUser, FaEnvelope, FaLock } from "react-icons/fa";
import { FiCheck } from "react-icons/fi";
import InputField from "../customer_components/atoms/InputField";
import { useNavigate } from "react-router-dom";
import { RxQuestionMarkCircled } from "react-icons/rx";
import { PiShoppingCartSimpleFill } from "react-icons/pi";
import useFormSubmit from "../hooks/useFormSubmit";
import { useToast } from "../context/ToastContext";

function SignUp() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    fname: "",
    lname: "",
    email: "",
    password: "",
    confirm: "",
    agree: false,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleFaqClick = () => {
    navigate("/faq");
  };

  const handleSignInClick = () => {
    navigate("/signin");
  };

  const openLegalPage = (path) => {
    window.open(path, "_blank", "noopener,noreferrer");
  };

  const { submit, loading, error } = useFormSubmit("auth/sign-up.php", () => {
    showToast({
      type: "success",
      message: "Verification email sent. Please check your inbox.",
      duration: 5000,
    });

    navigate("/verify-email-sent");
  });

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

    if (!form.fname.trim()) newErrors.fname = "First name is required";
    if (!form.lname.trim()) newErrors.lname = "Last name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    if (!form.password) newErrors.password = "Password is required";

    if (form.password !== form.confirm) {
      newErrors.confirm = "Passwords do not match";
    }

    if (!form.agree) {
      newErrors.agree =
        "You must agree to the Terms and Conditions and Privacy Policy.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        await submit({
          name: `${form.fname.trim()} ${form.lname.trim()}`,
          email: form.email.trim(),
          password: form.password,
          agreed_to_terms: 1,
        });
      } catch (err) {
        showToast({
          type: "error",
          message: navigator.onLine
            ? err?.message || "Something went wrong"
            : "No internet connection. Please check your network.",
          duration: 5000,
        });

        console.error(err);
      }
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
          onClick={handleFaqClick}
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
                Fresh local products, one account away.
              </h1>

              <p className="mt-4 text-sm leading-7 text-white/80">
                Create your OSYUSO account to discover nearby shops, save your
                cart, and checkout faster.
              </p>
            </div>

            <div className="rounded-xl bg-white/10 p-4 text-sm leading-6 text-white/80">
              Support local sellers while shopping for fresh meat, fruits, and
              vegetables from your community.
            </div>
          </section>

          <section className="p-5 sm:p-6 md:p-8">
            <div className="mb-6 text-center sm:text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
                Customer Account
              </p>

              <h1 className="mt-2 text-2xl font-bold text-gray-900">
                Create Account
              </h1>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Join OSYUSO marketplace and start buying fresh products.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mb-1">
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label="First Name"
                  name="fname"
                  value={form.fname}
                  onChange={handleChange}
                  placeholder="Enter first name"
                  icon={FaUser}
                  error={errors.fname}
                />

                <InputField
                  label="Last Name"
                  name="lname"
                  value={form.lname}
                  onChange={handleChange}
                  placeholder="Enter last name"
                  icon={FaUser}
                  error={errors.lname}
                />
              </div>

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
                placeholder="Enter password"
                icon={FaLock}
                error={errors.password}
              />

              <InputField
                label="Confirm Password"
                name="confirm"
                type="password"
                value={form.confirm}
                onChange={handleChange}
                placeholder="Confirm password"
                icon={FaLock}
                error={errors.confirm}
              />

              <label
                className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition ${
                  errors.agree
                    ? "border-red-300 bg-red-50"
                    : form.agree
                      ? "border-orange-200 bg-orange-50"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <input
                  type="checkbox"
                  name="agree"
                  checked={form.agree}
                  onChange={handleChange}
                  className="sr-only"
                />

                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                    form.agree
                      ? "border-secondary bg-secondary text-white"
                      : "border-slate-300 bg-white text-transparent"
                  }`}
                >
                  <FiCheck className="text-sm" />
                </span>

                <span className="text-xs leading-6 text-slate-600">
                  I have read and agree to OSYUSO's{" "}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      openLegalPage("/terms-and-conditions");
                    }}
                    className="font-bold text-secondary hover:underline"
                  >
                    Terms and Conditions
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      openLegalPage("/privacy-policy");
                    }}
                    className="font-bold text-secondary hover:underline"
                  >
                    Privacy Policy
                  </button>
                  .
                </span>
              </label>

              {errors.agree && (
                <p className="-mt-2 text-xs font-medium text-red-500">
                  {errors.agree}
                </p>
              )}

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
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-gray-500">
              Already have an account?{" "}
              <button
                type="button"
                onClick={handleSignInClick}
                className="font-semibold text-secondary hover:underline"
              >
                Sign In
              </button>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

export default SignUp;
