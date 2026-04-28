import React, { useState } from "react";
import InputField from "../customer_components/atoms/InputField";
import {
  FaStore,
  FaUser,
  FaEnvelope,
  FaLock,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { PiShoppingCartSimpleFill } from "react-icons/pi";
import { RxQuestionMarkCircled } from "react-icons/rx";

const categoriesList = ["Meat", "Fish", "Fruits", "Vegetables", "Frozen Goods"];

function SignUpSeller() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    shopName: "",
    ownerName: "",
    address: "",
    categories: [],
    permit: null,
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleCategory = (cat) => {
    setForm((prev) => {
      const exists = prev.categories.includes(cat);
      return {
        ...prev,
        categories: exists
          ? prev.categories.filter((c) => c !== cat)
          : [...prev.categories, cat],
      };
    });
  };

  const handleFile = (e) => {
    setForm({ ...form, permit: e.target.files[0] });
  };

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  const handleSubmit = (e) => {
    e.preventDefault();

    let newErrors = {};

    if (!form.email) newErrors.email = "Email is required";
    if (!form.password) newErrors.password = "Password is required";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      console.log("SELLER DATA:", form);
    }
  };

  const handleFaqClick = () => {
    navigate("/faq");
  };
  return (
    <div className="flex flex-col w-full bg-primary  items-center justify-center ">
      <header className="w-full h-[70px] bg-secondary text-white shadow-xs px-8 flex justify-between items-center">
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
      {/* CARD */}
      <div className="w-full max-w-xl bg-white rounded-xl shadow-md p-6 my-10">
        {/* TITLE */}
        <h1 className="text-2xl font-bold text-primary text-center mb-4">
          Seller Registration
        </h1>

        <p className="text-sm text-gray-500 text-center mb-6">
          Join OSYUSO as a verified seller
        </p>

        {/* STEP INDICATOR */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 mt-1 w-10 rounded-full transition ${
                step >= s ? "bg-secondary" : "bg-gray-300"
              }`}
            />
          ))}
        </div>

        {/* FORM */}
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
              />

              <InputField
                label="Owner Name"
                name="ownerName"
                value={form.ownerName}
                onChange={handleChange}
                placeholder="Enter owner name"
                icon={FaUser}
              />

              <InputField
                label="Address"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Shop address"
                icon={FaMapMarkerAlt}
              />
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <p className="text-sm font-semibold text-primary">
                Select Categories
              </p>

              <div className="flex flex-wrap gap-2 mt-2">
                {categoriesList.map((cat) => (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1 text-sm rounded-full border transition ${
                      form.categories.includes(cat)
                        ? "bg-secondary text-white border-secondary"
                        : "bg-white text-gray-600"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <p className="text-sm font-semibold text-primary mt-4">
                  Business Permit
                </p>

                <input
                  type="file"
                  onChange={handleFile}
                  className="w-full border p-2 rounded-md"
                />
              </div>
            </>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <>
              <InputField
                label="Email"
                name="email"
                type="email"
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

              {/* SUMMARY */}
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
                <p>
                  <b>Shop:</b> {form.shopName}
                </p>
                <p>
                  <b>Owner:</b> {form.ownerName}
                </p>
                <p>
                  <b>Categories:</b> {form.categories.join(", ")}
                </p>
              </div>
            </>
          )}

          {/* BUTTONS */}
          <div className="flex justify-between mt-6">
            {step > 1 && (
              <button
                type="button"
                onClick={back}
                className="px-4 py-2 text-sm border border-gray-500 rounded-md"
              >
                Back
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={next}
                className="ml-auto px-4 py-2 text-sm bg-secondary text-white rounded-md"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className="ml-auto text-sm px-4 py-2 bg-secondary text-white rounded-md"
              >
                Submit
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default SignUpSeller;
