import React, { useEffect, useMemo, useState } from "react";
import {
  FiBox,
  FiCamera,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiMail,
  FiRefreshCw,
  FiSave,
  FiShoppingBag,
  FiUser,
} from "react-icons/fi";

import useGetData from "../../hooks/useGetData";
import useFormSubmit from "../../hooks/useFormSubmit";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

function VendorPersonalAccount() {
  const { showToast } = useToast();
  const { login } = useAuth();

  const [form, setForm] = useState({
    fullname: "",
  });
  const [profileFile, setProfileFile] = useState(null);
  const [preview, setPreview] = useState("");

  const { data, loading, refetch } = useGetData("vendor_v/get-my-account.php");

  const account = useMemo(() => data?.data || data || {}, [data]);
  const user = account?.user || {};
  const stats = account?.stats || {};
  const recentOrders = account?.recent_orders || [];

  const { submit, loading: saving } = useFormSubmit(
    "vendor_v/update-profile.php",
  );

  useEffect(() => {
    if (!user?.user_id) return;

    setForm({
      fullname: user.fullname || "",
    });

    setPreview(user.profile_picture || "");
  }, [user?.user_id]);

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const getStoredToken = () => {
    try {
      const raw = sessionStorage.getItem("auth-storage");
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      return parsed?.state?.token || parsed?.token || null;
    } catch {
      return null;
    }
  };

  const syncStoredAuthUser = (updatedUser) => {
    try {
      const raw = sessionStorage.getItem("auth-storage");
      if (!raw) return;

      const parsed = JSON.parse(raw);

      if (parsed?.state?.user) {
        parsed.state.user = {
          ...parsed.state.user,
          ...updatedUser,
        };
      } else if (parsed?.state) {
        parsed.state.user = updatedUser;
      } else if (parsed?.user) {
        parsed.user = {
          ...parsed.user,
          ...updatedUser,
        };
      } else {
        parsed.user = updatedUser;
      }

      sessionStorage.setItem("auth-storage", JSON.stringify(parsed));
    } catch (err) {
      console.warn("Failed to sync stored user:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileFile = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setProfileFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.fullname.trim()) {
      showToast({
        type: "error",
        message: "Full name is required.",
        duration: 3000,
      });
      return;
    }

    const formData = new FormData();
    formData.append("fullname", form.fullname.trim());

    if (profileFile) {
      formData.append("profile_picture", profileFile);
    }

    try {
      const res = await submit(formData);
      const updatedUser = res?.data?.user || res?.user;

      if (updatedUser) {
        const token = getStoredToken();

        syncStoredAuthUser(updatedUser);
        login?.(updatedUser, token);
      }

      setProfileFile(null);
      refetch();

      showToast({
        type: "success",
        message: "Profile updated successfully.",
        duration: 3000,
      });
    } catch (err) {
      showToast({
        type: "error",
        message: err?.message || "Failed to update profile.",
        duration: 4000,
      });
    }
  };

  const initials = getInitials(user.fullname);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-1 sm:p-6">
        <div className="mx-auto max-w-6xl animate-pulse space-y-4">
          <div className="h-36 rounded-2xl bg-white" />
          <div className="grid gap-4 md:grid-cols-4">
            <div className="h-24 rounded-2xl bg-white" />
            <div className="h-24 rounded-2xl bg-white" />
            <div className="h-24 rounded-2xl bg-white" />
            <div className="h-24 rounded-2xl bg-white" />
          </div>
          <div className="h-96 rounded-2xl bg-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-1 sm:p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-secondary px-5 py-6 text-white sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
              Vendor Account
            </p>
            <h1 className="mt-1 text-2xl font-black">My Account</h1>
            <p className="mt-1 text-sm text-white/80">
              Manage your personal seller profile. Shop details are handled in
              Market Settings.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-6">
            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
              <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="relative">
                  <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-secondary shadow-sm">
                    {preview ? (
                      <img
                        src={preview}
                        alt={user.fullname || "Profile"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-3xl font-black text-white">
                        {initials}
                      </div>
                    )}
                  </div>

                  <label className="absolute bottom-1 right-1 grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-white text-secondary shadow-md transition hover:bg-orange-50">
                    <FiCamera />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileFile}
                      className="hidden"
                    />
                  </label>
                </div>

                <h2 className="mt-4 text-center text-lg font-bold text-slate-950">
                  {user.fullname || "Vendor"}
                </h2>

                <p className="mt-1 text-center text-sm text-slate-500">
                  {user.email}
                </p>

                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      Number(user.email_verified) === 1
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {Number(user.email_verified) === 1
                      ? "Verified Email"
                      : "Email Not Verified"}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      user.status === "active"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {user.status || "inactive"}
                  </span>
                </div>
              </div>

              <div className="grid content-start gap-4 sm:grid-cols-2">
                <Field
                  label="Full Name"
                  name="fullname"
                  value={form.fullname}
                  onChange={handleChange}
                  icon={FiUser}
                  required
                />

                <Field
                  label="Email"
                  value={user.email || ""}
                  icon={FiMail}
                  readOnly
                />

                <div className="sm:col-span-2 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm text-orange-800">
                  This page updates your personal vendor profile only. To update
                  shop logo, shop name, address, phone, and business details,
                  use Market Settings.
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {saving ? (
                      <>
                        <FiRefreshCw className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FiSave />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard
            icon={FiBox}
            label="Products"
            value={stats.products_count || 0}
          />
          <StatCard
            icon={FiClock}
            label="Pending Orders"
            value={stats.pending_orders || 0}
          />
          <StatCard
            icon={FiShoppingBag}
            label="To Prepare"
            value={stats.to_prepare_orders || 0}
          />
          <StatCard
            icon={FiDollarSign}
            label="Total Earnings"
            value={formatMoney(stats.total_earnings)}
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Recent Shop Orders
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest orders placed from your market.
              </p>
            </div>
          </div>

          {recentOrders.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
              No shop orders yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <RecentOrder key={order.id} order={order} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  icon: Icon,
  readOnly = false,
  required = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </label>

      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        )}

        <input
          name={name}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          required={required}
          className={`h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-secondary ${
            readOnly ? "bg-slate-100 text-slate-500" : "bg-white"
          }`}
        />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-orange-50 text-secondary">
          <Icon />
        </span>
        <span className="truncate text-2xl font-black text-slate-950">
          {value}
        </span>
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-600">{label}</p>
    </div>
  );
}

function RecentOrder({ order }) {
  const status = order.payment_status || "pending";

  const statusClass =
    status === "paid"
      ? "bg-emerald-50 text-emerald-700"
      : status === "expired" || status === "failed"
        ? "bg-red-50 text-red-700"
        : "bg-amber-50 text-amber-700";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-950">
          #{order.id} • {order.product_name || "Product"}
        </p>
        <p className="mt-1 truncate text-xs text-slate-500">
          {order.customer_name || "Customer"} • {order.amount_label}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span className="text-sm font-black text-slate-950">
          {formatMoney(order.total_amount)}
        </span>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusClass}`}
        >
          {status}
        </span>
      </div>
    </div>
  );
}

function formatMoney(value) {
  return `₱${Number(value || 0).toFixed(2)}`;
}

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return "V";

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default VendorPersonalAccount;
