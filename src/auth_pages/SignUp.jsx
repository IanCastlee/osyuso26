import React, { useState } from "react";
import { FaUser, FaEnvelope, FaLock } from "react-icons/fa";
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
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFaqClick = () => {
    navigate("/faq");
  };

  const handleSignInClick = () => {
    navigate("/signin");
  };

  //SUBMIT LOGIC:
  const { submit, loading, error } = useFormSubmit(
    "auth/sign-up.php",
    (res) => {
      showToast({
        type: "success",
        message: "Account created!",
        duration: 5000,
      });
      navigate("/signin");
    },
  );

  //handleSubmit with frontend validation
  const handleSubmit = async (e) => {
    e.preventDefault();

    // CHECK INTERNET CONNECTION
    if (!navigator.onLine) {
      showToast({
        type: "error",
        message: "No internet connection. Please check your network.",
        duration: 5000,
      });

      return;
    }

    let newErrors = {};

    if (!form.fname) newErrors.fname = "First name is required";
    if (!form.lname) newErrors.lname = "Last name is required";
    if (!form.email) newErrors.email = "Email is required";
    if (!form.password) newErrors.password = "Password is required";
    if (form.password !== form.confirm)
      newErrors.confirm = "Passwords do not match";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        await submit({
          name: `${form.fname} ${form.lname}`,
          email: form.email,
          password: form.password,
        });
      } catch (err) {
        //  HANDLE NETWORK ERRORS DURING REQUEST
        if (!navigator.onLine) {
          showToast({
            type: "error",
            message: "No internet connection. Please check your network.",
            duration: 5000,
          });
        } else {
          showToast({
            type: "error",
            message: err?.message || "Something went wrong",

            duration: 5000,
          });
        }
        console.error(err.message);
      }
    }
  };
  return (
    <>
      <header className="w-full h-[70px] bg-secondary text-white shadow-md px-8 flex justify-between items-center">
        <h2 className="flex items-center font-bold text-2xl md:text-[24px] tracking-wide">
          OSY
          <PiShoppingCartSimpleFill />
          SO
        </h2>
        {/* FAQ */}
        <button
          onClick={handleFaqClick}
          className="flex items-center gap-1 text-xs hover:opacity-80 transition"
          title="FAQ"
        >
          <RxQuestionMarkCircled className="text-sm" />
          FAQ
        </button>
      </header>

      <div className="flex flex-col w-full bg-gray-100  items-center justify-center px-1">
        {/* CARD */}
        <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6 space-y-4 my-10">
          {/* TITLE */}
          <h1 className="text-2xl font-bold text-primary text-center">
            Create Account
          </h1>

          <p className="text-sm text-gray-500 text-center">
            Join OSYUSO marketplace and start buying fresh products
          </p>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div className="flex justify-between items-center gap-1">
              <InputField
                label="First Name"
                name="fname"
                value={form.fname}
                onChange={handleChange}
                placeholder="Enter your first name"
                icon={FaUser}
                error={errors.fname}
              />
              <InputField
                label="Last Name"
                name="lname"
                value={form.lname}
                onChange={handleChange}
                placeholder="Enter your last name"
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

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-secondary text-white py-2 rounded-md font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Creating..." : "Sign Up"}
            </button>

            {error && (
              <p className="text-xs text-red-500 text-center">{error}</p>
            )}
          </form>

          {/* FOOTER */}
          <p className="text-xs text-center text-gray-500">
            Already have an account?{" "}
            <span
              onClick={handleSignInClick}
              className="text-secondary cursor-pointer hover:underline"
            >
              Sign In
            </span>
          </p>
        </div>
      </div>
    </>
  );
}

export default SignUp;
