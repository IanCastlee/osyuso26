import React, { useEffect, useMemo, useState } from "react";
import {
  FiDollarSign,
  FiMail,
  FiPercent,
  FiPhone,
  FiRefreshCw,
  FiSave,
  FiSettings,
} from "react-icons/fi";
import { FaFacebookF } from "react-icons/fa";

import InputField from "../atoms/InputField";
import useGetData from "../../hooks/useGetData";
import useFormSubmit from "../../hooks/useFormSubmit";
import { useToast } from "../../context/ToastContext";

const defaultForm = {
  promotion_price_per_hour: "",
  platform_commission_rate: "",
  email: "",
  phone: "",
  fb_url: "",
};

function AdminSetting() {
  const { showToast } = useToast();

  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});

  const { data, loading, error, refetch } = useGetData(
    "admin_setting/get-admin-settings.php",
  );

  const { submit: updateSettings, loading: saving } = useFormSubmit(
    "admin_setting/update-admin-settings.php",
    () => {
      showToast({
        type: "success",
        message: "Admin settings updated successfully",
        duration: 3000,
      });

      refetch();
    },
  );
  const settings = useMemo(() => data?.data || data || {}, [data]);

  useEffect(() => {
    if (!settings || Object.keys(settings).length === 0) return;

    setForm({
      promotion_price_per_hour: settings.promotion_price_per_hour ?? "",
      platform_commission_rate: settings.platform_commission_rate ?? "",
      email: settings.email ?? "",
      phone: settings.phone ?? "",
      fb_url: settings.fb_url ?? "",
    });
  }, [settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const nextErrors = {};

    const promoPrice = Number(form.promotion_price_per_hour);
    const commissionRate = Number(form.platform_commission_rate);

    if (form.promotion_price_per_hour === "" || Number.isNaN(promoPrice)) {
      nextErrors.promotion_price_per_hour = "Promotion price is required.";
    } else if (promoPrice < 0) {
      nextErrors.promotion_price_per_hour =
        "Promotion price cannot be negative.";
    }

    if (form.platform_commission_rate === "" || Number.isNaN(commissionRate)) {
      nextErrors.platform_commission_rate = "Commission rate is required.";
    } else if (commissionRate < 0 || commissionRate > 100) {
      nextErrors.platform_commission_rate = "Commission rate must be 0 to 100.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Support email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!form.phone.trim()) {
      nextErrors.phone = "Support phone is required.";
    }

    if (!form.fb_url.trim()) {
      nextErrors.fb_url = "Facebook URL is required.";
    } else if (!/^https?:\/\/.+/i.test(form.fb_url.trim())) {
      nextErrors.fb_url = "Enter a valid URL starting with http or https.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    await updateSettings({
      promotion_price_per_hour: Number(form.promotion_price_per_hour),
      platform_commission_rate: Number(form.platform_commission_rate),
      email: form.email.trim(),
      phone: form.phone.trim(),
      fb_url: form.fb_url.trim(),
    });
  };

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-50 text-secondary">
                <FiSettings className="text-xl" />
              </span>

              <div>
                <h1 className="text-xl font-bold text-slate-950">
                  Admin Settings
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Manage platform fees, promotion pricing, and public contact
                  information.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={refetch}
              disabled={loading || saving}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-5 lg:grid-cols-[1fr_340px]"
        >
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-950">
              Platform Configuration
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              These values affect vendor payouts, featured promotions, and
              contact details shown in the system.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <InputField
                label="Promotion Price Per Hour"
                name="promotion_price_per_hour"
                type="number"
                placeholder="Example: 50"
                value={form.promotion_price_per_hour}
                onChange={handleChange}
                icon={FiDollarSign}
                error={errors.promotion_price_per_hour}
              />

              <InputField
                label="Platform Commission Rate (%)"
                name="platform_commission_rate"
                type="number"
                placeholder="Example: 10"
                value={form.platform_commission_rate}
                onChange={handleChange}
                icon={FiPercent}
                error={errors.platform_commission_rate}
              />

              <InputField
                label="Support Email"
                name="email"
                type="email"
                placeholder="osyuso38@gmail.com"
                value={form.email}
                onChange={handleChange}
                icon={FiMail}
                error={errors.email}
              />

              <InputField
                label="Support Phone"
                name="phone"
                type="text"
                placeholder="+63 912 345 6789"
                value={form.phone}
                onChange={handleChange}
                icon={FiPhone}
                error={errors.phone}
              />

              <div className="md:col-span-2">
                <InputField
                  label="Facebook URL"
                  name="fb_url"
                  type="url"
                  placeholder="https://www.facebook.com/osyuso"
                  value={form.fb_url}
                  onChange={handleChange}
                  icon={FaFacebookF}
                  error={errors.fb_url}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={saving || loading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-secondary px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiSave />
                {saving ? "Updating..." : "Update Settings"}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-950">
              Current Public Info
            </h2>

            <div className="mt-5 space-y-3">
              <div className="rounded-lg bg-orange-50 p-4">
                <p className="text-xs font-semibold uppercase text-orange-500">
                  Platform Fee
                </p>
                <p className="mt-1 text-2xl font-bold text-secondary">
                  {form.platform_commission_rate || 0}%
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Promotion Rate
                </p>
                <p className="mt-1 text-lg font-bold text-slate-950">
                  ₱{Number(form.promotion_price_per_hour || 0).toFixed(2)} / hr
                </p>
              </div>

              <div className="rounded-lg border border-slate-100 p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Contact
                </p>
                <p className="mt-2 break-words text-sm font-semibold text-slate-900">
                  {form.email || "No email"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {form.phone || "No phone"}
                </p>
              </div>

              <a
                href={form.fb_url || "#"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <FaFacebookF />
                Open Facebook Page
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminSetting;
