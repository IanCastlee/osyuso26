import React from "react";
import { FaBox, FaMoneyBill } from "react-icons/fa";

import offer1 from "../../assets/hero_images/offer1.png";
import addImage from "../../assets/icons/addimage.png";

import LoaderWithText from "../../reusable_components/LoaderWithText";
import InputField from "../atoms/InputField";
import useGetData from "../../hooks/useGetData";

function AddFeaturedPromotion({
  form,
  errors,
  preview,
  handleChange,
  handleImages,
  handleSubmit,
  submitLoading,
}) {
  // ================= ADMIN SETTINGS =================
  const { data, loading } = useGetData("admin_setting/admin-setting.php");

  console.log("data : ", data);

  // ================= PRICE =================
  const PRICE_PER_HOUR = Number(data?.price_per_hour) || 20;

  console.log("DATA :     -- ", PRICE_PER_HOUR);

  // ================= MIN DATE =================
  const now = new Date();

  const localDateTime = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000,
  )
    .toISOString()
    .slice(0, 16);

  // ================= HOURS =================
  const calculateHours = () => {
    if (!form.start_date || !form.expires_at) return 1;

    const start = new Date(form.start_date);
    const end = new Date(form.expires_at);

    const diffMs = end - start;

    // INVALID
    if (diffMs <= 0) return 1;

    const hours = Math.ceil(diffMs / (1000 * 60 * 60));

    return hours;
  };

  const totalHours = calculateHours();

  // ================= TOTAL PRICE =================
  const totalPrice = totalHours * PRICE_PER_HOUR;

  return (
    <div className="bg-white rounded-xl shadow px-4 py-4">
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* LEFT */}
        <div className="space-y-4">
          {/* TAG */}
          <InputField
            label="Tag"
            placeholder="Eg. 🔥 LIMITED OFFER"
            name="tag"
            value={form.tag}
            onChange={handleChange}
            icon={FaBox}
            error={errors.tag}
          />

          {/* TITLE */}
          <InputField
            label="Title"
            name="title"
            value={form.title}
            onChange={handleChange}
            error={errors.title}
          />

          {/* DESCRIPTION */}
          <InputField
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            icon={FaMoneyBill}
            error={errors.description}
          />

          {/* DATES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* START DATE */}
            <div className="w-full">
              <label className="text-sm font-medium">Start Date</label>

              <input
                type="datetime-local"
                name="start_date"
                value={form.start_date}
                min={localDateTime}
                onChange={(e) =>
                  handleChange({
                    target: {
                      name: "start_date",
                      value: e.target.value,
                    },
                  })
                }
                className="
                  w-full border border-gray-300
                  rounded-lg px-3 py-2 mt-1
                  focus:outline-none focus:ring-2
                  focus:ring-orange-400
                "
              />

              {errors.start_date && (
                <p className="text-xs text-red-500 mt-1">{errors.start_date}</p>
              )}
            </div>

            {/* EXPIRES */}
            <div className="w-full">
              <label className="text-sm font-medium">Expires At</label>

              <input
                type="datetime-local"
                name="expires_at"
                value={form.expires_at}
                min={form.start_date || localDateTime}
                onChange={(e) =>
                  handleChange({
                    target: {
                      name: "expires_at",
                      value: e.target.value,
                    },
                  })
                }
                className="
                  w-full border border-gray-300
                  rounded-lg px-3 py-2 mt-1
                  focus:outline-none focus:ring-2
                  focus:ring-orange-400
                "
              />

              {errors.expires_at && (
                <p className="text-xs text-red-500 mt-1">{errors.expires_at}</p>
              )}
            </div>
          </div>

          {/* LIVE INFO */}

          {/* IMAGE UPLOAD */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-2">Banner Image</label>

            {/* HIDDEN INPUT */}
            <input
              id="banner-upload"
              type="file"
              accept="image/*"
              onChange={handleImages}
              className="hidden"
            />

            {/* CUSTOM PICKER */}
            <label
              htmlFor="banner-upload"
              className="
                w-full h-[180px]
                border-2 border-dashed border-gray-300
                rounded-xl
                overflow-hidden
                cursor-pointer
                hover:border-secondary
                transition
                bg-gray-50
                flex items-center justify-center
                relative
                group
              "
            >
              {/* PREVIEW */}
              {preview[0] ? (
                <>
                  <img
                    src={preview[0]}
                    alt="preview"
                    className="
                      w-full h-full object-cover
                      group-hover:scale-105
                      transition duration-300
                    "
                  />

                  {/* OVERLAY */}
                  <div
                    className="
                      absolute inset-0
                      bg-black/30
                      opacity-0 group-hover:opacity-100
                      transition
                      flex items-center justify-center
                    "
                  >
                    <span className="text-white text-sm font-semibold">
                      Change Image
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <img
                    src={addImage}
                    alt="upload"
                    className="w-14 h-14 object-contain opacity-70"
                  />

                  <span className="mt-2 text-xs sm:text-sm">
                    Click to upload banner
                  </span>
                </div>
              )}
            </label>

            {/* ERROR */}
            {errors.images && (
              <p className="text-xs text-red-500 mt-1">{errors.images}</p>
            )}
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={submitLoading || !form.start_date || !form.expires_at}
            className="
              w-full bg-secondary text-white py-2
              rounded-md font-semibold
              flex items-center justify-center gap-2
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            {submitLoading ? (
              <LoaderWithText text="Submit..." />
            ) : (
              `Submit Promotion • ₱${totalPrice}`
            )}
          </button>
        </div>

        {/* RIGHT PREVIEW */}
        <div className="flex flex-col gap-2">
          <div className="w-full h-[250px]">
            <div
              className="
              w-full h-[250px] lg:h-full
              flex flex-row
              rounded-lg lg:rounded-xl
              overflow-hidden
              shadow-sm hover:shadow-lg
              transition
              bg-gradient-to-r
              from-orange-500
              via-orange-400
              to-yellow-400
              text-white
              relative
            "
            >
              {/* IMAGE */}
              <div className="w-[35%] h-full overflow-hidden relative">
                <img
                  src={preview[0] || offer1}
                  alt="offer"
                  className="
                  w-full h-full object-cover
                  lg:object-contain lg:object-center
                  scale-x-[-1]
                "
                />

                <div className="absolute inset-0 bg-black/10"></div>
              </div>

              {/* CONTENT */}
              <div className="w-[65%] p-4 flex flex-col justify-center gap-2">
                {/* TAG */}
                <span
                  className="
                  text-[10px] lg:text-xs
                  font-semibold
                  bg-white/20
                  w-fit
                  px-2 lg:px-3
                  py-0 lg:py-1
                  rounded-full
                  backdrop-blur-md
                "
                >
                  {form.tag || "🔥 LIMITED OFFER"}
                </span>

                {/* TITLE */}
                <h2 className="text-sm md:text-xl lg:text-3xl font-bold leading-tight">
                  {form.title || "Special Vendor Offer!"}
                </h2>

                {/* DESCRIPTION */}
                <p className="text-[10px] lg:text-sm text-white/90 leading-snug">
                  {form.description ||
                    "Get fresh products at discounted prices from local sellers near you."}
                </p>

                {/* PRICE */}
                {/* <div className="flex flex-col mt-1">
                <span className="text-[10px] lg:text-xs text-white/80">
                  Promotion Fee
                </span>

                <div className="flex items-end gap-2">
                  <h2 className="text-lg lg:text-2xl font-bold text-white">
                    ₱{totalPrice}
                  </h2>

                  <span className="text-[10px] lg:text-xs text-white/80 mb-1">
                    ({totalHours} hour
                    {totalHours > 1 ? "s" : ""} × ₱{PRICE_PER_HOUR})
                  </span>
                </div>
              </div> */}

                {/* BUTTON */}
                <button
                  type="button"
                  className="
                  mt-0 lg:mt-2
                  w-fit
                  px-2 lg:px-4
                  py-0 lg:py-1
                  text-[10px] lg:text-sm
                  bg-white
                  text-orange-500
                  font-semibold
                  rounded-md
                  hover:bg-gray-100
                  transition
                "
                >
                  Shop Now
                </button>
              </div>

              {/* DOTS */}
              <div className="absolute bottom-2 right-4 flex gap-1 lg:gap-2">
                {[1, 2, 3].map((_, i) => (
                  <button
                    key={i}
                    className="
                    w-1 lg:w-2
                    h-1 lg:h-2
                    rounded-full
                    bg-white/40
                  "
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-xs text-orange-700 font-semibold">
              Duration:
              <span className="ml-1">
                {totalHours} hour
                {totalHours > 1 ? "s" : ""}
              </span>
            </p>

            <p className="text-xs text-orange-600 mt-1">
              Estimated Cost:
              <span className="font-bold ml-1">₱{totalPrice}</span>
            </p>

            <p className="text-[11px] text-orange-500 mt-1">
              {loading ? "Loading pricing..." : `₱${PRICE_PER_HOUR} per hour`}
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AddFeaturedPromotion;
