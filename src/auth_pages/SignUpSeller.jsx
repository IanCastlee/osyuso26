import React, { useState } from "react";
import InputField from "../customer_components/atoms/InputField";
import {
  FaStore,
  FaUser,
  FaEnvelope,
  FaLock,
  FaMapMarkerAlt,
  FaPhoneAlt,
} from "react-icons/fa";

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
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFile = (e) => {
    setForm({ ...form, permit: e.target.files[0] });
  };

  const { submit, loading } = useFormSubmit("auth/signup-seller.php", (res) => {
    showToast({
      type: "success",
      message: "Account created!",
      duration: 5000,
    });

    navigate("/signin");
  });

  // ================= VALIDATION =================
  const validateStep = (step) => {
    let errors = {};

    if (step === 1) {
      if (!form.shopName) errors.shopName = "Shop name is required";
      if (!form.fname) errors.fname = "First name is required";
      if (!form.lname) errors.lname = "Last name is required";

      if (!form.phone) {
        errors.phone = "Phone number is required";
      } else if (!/^09\d{9}$/.test(form.phone)) {
        errors.phone = "Must start with 09 and be 11 digits";
      }

      if (!form.address) errors.address = "Address is required";
      if (!form.nearby) errors.nearby = "Nearby landmark is required";
    }

    if (step === 2) {
      if (!form.permit) errors.permit = "Business permit is required";
      if (!form.permit_number)
        errors.permit_number = "Permit number is required";
    }

    if (step === 3) {
      if (!form.email) errors.email = "Email is required";

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
    }

    return errors;
  };

  // ================= STEP CONTROL =================
  const next = () => {
    const stepErrors = validateStep(step);
    setErrors(stepErrors);

    if (Object.keys(stepErrors).length === 0) {
      setStep((s) => s + 1);
    }
  };

  const back = () => setStep((s) => s - 1);

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const submitErrors = validateStep(3);
    setErrors(submitErrors);

    if (Object.keys(submitErrors).length > 0) return;

    const data = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      data.append(key, value);
    });

    try {
      await submit(data);
    } catch (err) {
      showToast({
        type: "error",
        message: err?.message || "Something went wrong",
      });
    }
  };
  // ================= UI =================
  return (
    <>
      <header className="w-full h-[70px] bg-secondary text-white flex justify-between items-center px-6">
        <h2 className="flex items-center font-bold text-xl">
          OSY <PiShoppingCartSimpleFill /> SO
        </h2>

        <button
          onClick={() => navigate("/faq")}
          className="flex items-center gap-1 text-xs"
        >
          <RxQuestionMarkCircled /> FAQ
        </button>
      </header>

      <div className="flex justify-center bg-primary min-h-screen p-4">
        <div className="w-full max-w-xl bg-white p-6 rounded-xl shadow-md">
          <h1 className="text-2xl font-bold text-center mb-2">
            Seller Registration
          </h1>

          {/* STEP INDICATOR */}
          <div className="flex gap-2 justify-center mb-5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 w-10 rounded-full ${
                  step >= s ? "bg-secondary" : "bg-gray-300"
                }`}
              />
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* STEP 1 */}
            {step === 1 && (
              <>
                <InputField
                  label="Shop Name"
                  name="shopName"
                  value={form.shopName}
                  onChange={handleChange}
                  placeholder="Enter shop name"
                  icon={FaStore}
                  error={errors.shopName}
                />

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
                  label="Address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Shop address"
                  icon={FaMapMarkerAlt}
                  error={errors.address}
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
              </>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <>
                <input
                  type="file"
                  onChange={handleFile}
                  className="w-full border p-2 rounded-md"
                />
                {errors.permit && (
                  <p className="text-red-500 text-xs">{errors.permit}</p>
                )}

                <InputField
                  label="Permit Number"
                  name="permit_number"
                  value={form.permit_number}
                  onChange={handleChange}
                  icon={FaLock}
                  error={errors.permit_number}
                />
              </>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <>
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
              </>
            )}

            {/* BUTTONS */}
            <div className="flex justify-between pt-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={back}
                  className="border px-4 py-2"
                >
                  Back
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={next}
                  className="ml-auto bg-secondary text-white px-4 py-2 rounded"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="ml-auto bg-secondary text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <LoaderWithText text="Processing..." size="w-3 h-3" />
                    </>
                  ) : (
                    "Submit"
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default SignUpSeller;
