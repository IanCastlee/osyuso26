import React, { useState } from "react";
import { FaEnvelope, FaLock } from "react-icons/fa";
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

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ================= SIGN IN =================
  const { submit, loading } = useFormSubmit(
    "auth/sign-in.php",
    async (data) => {
      try {
        // SAVE TOKEN
        sessionStorage.setItem(
          "auth-storage",
          JSON.stringify({
            state: {
              token: data.token,
              role: data.role,
            },
          }),
        );

        // GET USER INFO
        const res = await fetchInstance("auth/user.php");

        // UPDATE GLOBAL AUTH STATE
        login(res.user);

        console.log("DJHHDFH", res);

        // SUCCESS TOAST
        showToast({
          type: "success",
          message: "Login successful!",
          duration: 3000,
        });

        // ROLE REDIRECT
        if (data.role === "admin") navigate("/admin");
        else if (data.role === "vendor") navigate("/vendor");
        else navigate("/");
      } catch (err) {
        console.error(err);
      }
    },
  );

  // ================= HANDLE SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = {};
    if (!form.email) newErrors.email = "Email is required";
    if (!form.password) newErrors.password = "Password is required";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        await submit({
          email: form.email,
          password: form.password,
        });
      } catch (err) {
        console.error(err.message);
        alert(err.message || "Login failed");
      }
    }
  };

  const handleFaqClick = () => navigate("/faq");
  const handleSignUpClick = () => navigate("/signup");

  return (
    <>
      {/* HEADER */}
      <header className="w-full h-[70px] bg-secondary text-white shadow-xs px-8 flex justify-between items-center">
        <h2 className="flex items-center font-bold text-2xl tracking-wide">
          OSY <PiShoppingCartSimpleFill /> SO
        </h2>

        <button
          onClick={handleFaqClick}
          className="flex items-center gap-1 text-xs"
        >
          <RxQuestionMarkCircled className="text-sm" />
          FAQ
        </button>
      </header>

      {/* BODY */}
      <div className="flex flex-col w-full bg-primary items-center justify-center px-1">
        <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6 space-y-4 my-10">
          <h1 className="text-2xl font-bold text-primary text-center">
            Welcome Back
          </h1>

          <p className="text-sm text-gray-500 text-center">
            Sign in to continue shopping
          </p>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
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

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-secondary text-white py-2 rounded-md font-semibold flex items-center justify-center gap-2"
            >
              {loading && (
                <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
              )}

              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* SIGNUP LINK */}
          <p className="text-xs text-center text-gray-500">
            Don’t have an account?{" "}
            <span
              onClick={handleSignUpClick}
              className="text-secondary cursor-pointer"
            >
              Sign Up
            </span>
          </p>
        </div>
      </div>
    </>
  );
}

export default SignIn;
