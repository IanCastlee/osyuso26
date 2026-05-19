import React, { useEffect, useRef, useState } from "react";
import {
  FiCamera,
  FiMapPin,
  FiPhone,
  FiSave,
  FiSettings,
  FiUser,
} from "react-icons/fi";
import { LazyLoadImage } from "react-lazy-load-image-component";

import { icons } from "../../constant/icons";
import bgImg from "../../assets/assets_osyuso/bg.webp";
import profileImage from "../../assets/assets_osyuso/shop.png";
import InputField from "../atoms/InputField";
import useFormSubmit from "../../hooks/useFormSubmit";
import useGetData from "../../hooks/useGetData";
import Loader from "../../reusable_components/Loader";
import LoaderWithText from "../../reusable_components/LoaderWithText";
import { useToast } from "../../context/ToastContext";

function MarketSetting() {
  const profileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const { showToast } = useToast();

  const { data, loading: fetching } = useGetData(
    "market/get-market-settings.php",
  );

  const [profilePreview, setProfilePreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const [profileObjectUrl, setProfileObjectUrl] = useState(null);
  const [coverObjectUrl, setCoverObjectUrl] = useState(null);

  const [profileFile, setProfileFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);

  const [form, setForm] = useState({
    fullname: "",
    address: "",
    nearby: "",
    shop_name: "",
    shop_description: "",
    phone: "",
  });

  const { submit, loading } = useFormSubmit(
    "market/update-market-settings.php",
    () => {
      showToast({
        type: "success",
        message: "Market settings updated successfully!",
        duration: 5000,
      });
    },
  );

  useEffect(() => {
    if (!data) return;

    setForm({
      fullname: data.fullname || "",
      address: data.address || "",
      nearby: data.nearby || "",
      shop_name: data.shop_name || "",
      shop_description: data.shop_description || "",
      phone: data.phone || "",
    });

    setProfilePreview(data.shop_logo || null);
    setCoverPreview(data.shop_cover_photo || null);
  }, [data]);

  useEffect(() => {
    return () => {
      if (profileObjectUrl) URL.revokeObjectURL(profileObjectUrl);
      if (coverObjectUrl) URL.revokeObjectURL(coverObjectUrl);
    };
  }, [profileObjectUrl, coverObjectUrl]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!navigator.onLine) {
      showToast({
        type: "error",
        message: "No internet connection. Please check your network.",
        duration: 5000,
      });
      return;
    }

    const formData = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value);
    });

    if (profileFile) formData.append("profile_picture", profileFile);
    if (coverFile) formData.append("cover_photo", coverFile);

    try {
      await submit(formData);
    } catch (err) {
      showToast({
        type: "error",
        message: err?.message || "Failed to update market settings",
        duration: 5000,
      });
    }
  };

  const handleProfileClick = () => {
    profileInputRef.current?.click();
  };

  const handleCoverClick = () => {
    coverInputRef.current?.click();
  };

  const handleProfileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (profileObjectUrl) URL.revokeObjectURL(profileObjectUrl);

    const url = URL.createObjectURL(file);
    setProfileFile(file);
    setProfileObjectUrl(url);
    setProfilePreview(url);
  };

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (coverObjectUrl) URL.revokeObjectURL(coverObjectUrl);

    const url = URL.createObjectURL(file);
    setCoverFile(file);
    setCoverObjectUrl(url);
    setCoverPreview(url);
  };

  if (fetching) {
    return (
      <div className="flex min-h-full items-center justify-center bg-slate-50 p-6">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-secondary">
                <FiSettings className="text-xl" />
              </span>

              <div>
                <h1 className="text-xl font-bold text-slate-950">
                  Market Settings
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Update your shop profile, location, and public details.
                </p>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <LoaderWithText text="Updating..." size="w-3 h-3" />
              ) : (
                <>
                  <FiSave className="text-lg" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={handleCoverClick}
            className="group relative block h-52 w-full overflow-hidden text-left sm:h-64"
          >
            <LazyLoadImage
              src={coverPreview || bgImg}
              alt="Market cover"
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />

            <div className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm transition group-hover:bg-white">
              <FiCamera />
              Change cover
            </div>
          </button>

          <div className="relative px-5 pb-5 pt-16">
            <button
              type="button"
              onClick={handleProfileClick}
              className="group absolute -top-14 left-5 h-28 w-28 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-lg"
            >
              <LazyLoadImage
                src={profilePreview || profileImage}
                alt="Shop logo"
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/45 text-white opacity-0 transition group-hover:opacity-100">
                <FiCamera className="text-xl" />
              </div>
            </button>

            <div className="min-w-0">
              <h2 className="text-xl font-bold text-slate-950">
                {form.shop_name || "Your Shop"}
              </h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-500">
                {form.shop_description ||
                  "Add a short description so buyers know what your shop offers."}
              </p>
            </div>
          </div>
        </div>

        <input
          type="file"
          ref={profileInputRef}
          onChange={handleProfileChange}
          accept="image/*"
          hidden
        />

        <input
          type="file"
          ref={coverInputRef}
          onChange={handleCoverChange}
          accept="image/*"
          hidden
        />

        <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <FiUser className="text-secondary" />
              <h3 className="text-sm font-semibold text-slate-950">
                Owner and Shop Details
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                label="Full Name"
                name="fullname"
                value={form.fullname}
                onChange={handleChange}
              />

              <InputField
                label="Shop Name"
                name="shop_name"
                value={form.shop_name}
                onChange={handleChange}
              />

              <div className="sm:col-span-2">
                <InputField
                  label="Shop Description"
                  name="shop_description"
                  value={form.shop_description}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <FiMapPin className="text-secondary" />
              <h3 className="text-sm font-semibold text-slate-950">
                Contact and Location
              </h3>
            </div>

            <div className="space-y-4">
              <InputField
                label="Phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                icon={FiPhone}
              />

              <InputField
                label="Address"
                name="address"
                value={form.address}
                onChange={handleChange}
              />

              <InputField
                label="Nearby Landmark"
                name="nearby"
                value={form.nearby}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarketSetting;
