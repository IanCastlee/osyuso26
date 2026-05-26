import React, { useState } from "react";
import InputField from "../customer_components/atoms/InputField";
import {
  FaStore,
  FaUser,
  FaEnvelope,
  FaLock,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaFileUpload,
} from "react-icons/fa";
import { FiCheck } from "react-icons/fi";

import { PiShoppingCartSimpleFill } from "react-icons/pi";
import { RxQuestionMarkCircled } from "react-icons/rx";
import useFormSubmit from "../hooks/useFormSubmit";
import { useNavigate } from "react-router-dom";
import LoaderWithText from "../reusable_components/LoaderWithText";
import { useToast } from "../context/ToastContext";

function SignUpSeller() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    shopName: "",
    fname: "",
    lname: "",
    phone: "",
    address: "",
    nearby: "",
    permit: null,
    permit_number: "",
    email: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });

  const [errors, setErrors] = useState({});

  const steps = [
    { id: 1, label: "Shop Info" },
    { id: 2, label: "Permit" },
    { id: 3, label: "Account" },
  ];

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

  const handleFile = (e) => {
    setForm((prev) => ({
      ...prev,
      permit: e.target.files[0],
    }));

    setErrors((prev) => ({
      ...prev,
      permit: "",
    }));
  };

  const openLegalPage = (path) => {
    window.open(path, "_blank", "noopener,noreferrer");
  };

  const { submit, loading } = useFormSubmit("auth/signup-seller.php", () => {
    showToast({
      type: "success",
      message: "Verification email sent. Please check your inbox.",
      duration: 5000,
    });

    navigate("/verify-email-sent");
  });

  const validateStep = (step) => {
    const errors = {};

    if (step === 1) {
      if (!form.shopName.trim()) errors.shopName = "Shop name is required";
      if (!form.fname.trim()) errors.fname = "First name is required";
      if (!form.lname.trim()) errors.lname = "Last name is required";

      if (!form.phone.trim()) {
        errors.phone = "Phone number is required";
      } else if (!/^09\d{9}$/.test(form.phone.trim())) {
        errors.phone = "Must start with 09 and be 11 digits";
      }

      if (!form.address.trim()) errors.address = "Address is required";
      if (!form.nearby.trim()) errors.nearby = "Nearby landmark is required";
    }

    if (step === 2) {
      if (!form.permit) errors.permit = "Business permit is required";
      if (!form.permit_number.trim()) {
        errors.permit_number = "Permit number is required";
      }
    }

    if (step === 3) {
      if (!form.email.trim()) errors.email = "Email is required";

      if (!form.password) {
        errors.password = "Password is required";
      } else if (form.password.length < 8) {
        errors.password = "Min 8 characters required";
      } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) {
        errors.password = "Must include special character";
      }

      if (!form.confirmPassword) {
        errors.confirmPassword = "Confirm password is required";
      } else if (form.confirmPassword !== form.password) {
        errors.confirmPassword = "Passwords do not match";
      }

      if (!form.agree) {
        errors.agree =
          "You must agree to the Terms and Conditions and Privacy Policy.";
      }
    }

    return errors;
  };

  const next = () => {
    const stepErrors = validateStep(step);
    setErrors(stepErrors);

    if (Object.keys(stepErrors).length === 0) {
      setStep((s) => s + 1);
    }
  };

  const back = () => setStep((s) => s - 1);

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

    const submitErrors = validateStep(3);
    setErrors(submitErrors);

    if (Object.keys(submitErrors).length > 0) return;

    const data = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      if (key === "agree") {
        data.append("agreed_to_terms", value ? "1" : "0");
        return;
      }

      data.append(key, value);
    });

    try {
      await submit(data);
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
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between bg-secondary px-4 text-white shadow-md sm:px-6 lg:px-12">
        <h2
          onClick={() => navigate("/")}
          className="flex cursor-pointer items-center text-xl font-bold tracking-wide"
        >
          OSY <PiShoppingCartSimpleFill className="mx-1" /> SO
        </h2>

        <button
          onClick={() => navigate("/faq")}
          className="flex items-center gap-1 rounded-full px-3 py-2 text-xs font-medium hover:bg-white/15"
        >
          <RxQuestionMarkCircled className="text-base" />
          FAQ
        </button>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[360px_1fr] lg:px-8 lg:py-10">
        <section className="rounded-2xl bg-secondary p-6 text-white shadow-sm lg:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
            <FaStore className="text-xl" />
          </div>

          <h1 className="mt-5 text-2xl font-bold">Become an OSYUSO seller</h1>

          <p className="mt-3 text-sm leading-7 text-white/80">
            Register your shop, submit your permit, and start reaching nearby
            customers looking for fresh local products.
          </p>

          <div className="mt-8 space-y-4">
            {steps.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                    step >= item.id
                      ? "bg-white text-secondary"
                      : "bg-white/15 text-white/70"
                  }`}
                >
                  {item.id}
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl bg-white/10 p-4 text-sm leading-6 text-white/80">
            Seller accounts are reviewed by OSYUSO before shop activation.
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
              Seller Registration
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              {steps.find((item) => item.id === step)?.label}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Step {step} of {steps.length}
            </p>
          </div>

          <div className="mb-6 flex gap-2">
            {steps.map((item) => (
              <div
                key={item.id}
                className={`h-1.5 flex-1 rounded-full ${
                  step >= item.id ? "bg-secondary" : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <InputField
                    label="Shop Name"
                    name="shopName"
                    value={form.shopName}
                    onChange={handleChange}
                    placeholder="Enter shop name"
                    icon={FaStore}
                    error={errors.shopName}
                  />
                </div>

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

                <InputField
                  label="Phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="09XXXXXXXXX"
                  icon={FaPhoneAlt}
                  error={errors.phone}
                />

                <InputField
                  label="Nearby Landmark"
                  name="nearby"
                  value={form.nearby}
                  onChange={handleChange}
                  placeholder="e.g. Church, School, Park"
                  icon={FaMapMarkerAlt}
                  error={errors.nearby}
                />

                <div className="md:col-span-2">
                  <InputField
                    label="Address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Shop address"
                    icon={FaMapMarkerAlt}
                    error={errors.address}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Business Permit
                  </label>

                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center transition hover:border-secondary hover:bg-orange-50">
                    <FaFileUpload className="text-2xl text-secondary" />

                    <span className="mt-3 text-sm font-medium text-gray-800">
                      {form.permit ? form.permit.name : "Upload permit file"}
                    </span>

                    <span className="mt-1 text-xs text-gray-500">
                      JPG, PNG, or PDF file
                    </span>

                    <input
                      type="file"
                      onChange={handleFile}
                      accept="image/*,.pdf"
                      className="hidden"
                    />
                  </label>

                  {errors.permit && (
                    <p className="mt-2 text-xs text-red-500">{errors.permit}</p>
                  )}
                </div>

                <InputField
                  label="Permit Number"
                  name="permit_number"
                  value={form.permit_number}
                  onChange={handleChange}
                  placeholder="Enter permit number"
                  icon={FaLock}
                  error={errors.permit_number}
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <InputField
                  label="Email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter email"
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
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  icon={FaLock}
                  error={errors.confirmPassword}
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
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={back}
                  disabled={loading}
                  className="rounded-lg border border-gray-200 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={next}
                  className="rounded-lg bg-secondary px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-secondary px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <LoaderWithText text="Processing..." size="w-3 h-3" />
                  ) : (
                    "Submit Registration"
                  )}
                </button>
              )}
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

export default SignUpSeller;
