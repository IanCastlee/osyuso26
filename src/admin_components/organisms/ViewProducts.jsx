import React from "react";
import { FiBox, FiX } from "react-icons/fi";

function ViewProducts({
  product,
  onClose,
  fileUrl,
  formatPeso,
  formatDate,
  getStatusClass,
}) {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-bold text-slate-950">
            Product Details
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <FiX />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-5">
          <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
            {product.image_path ? (
              <img
                src={fileUrl(product.image_path)}
                alt={product.name}
                className="h-44 w-full rounded-xl bg-slate-100 object-cover sm:h-40"
              />
            ) : (
              <div className="flex h-44 w-full items-center justify-center rounded-xl bg-slate-100 text-slate-400 sm:h-40">
                <FiBox className="text-3xl" />
              </div>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
                {product.shop_name || "Shop"}
              </p>

              <h3 className="mt-2 text-xl font-bold text-slate-950">
                {product.name}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {product.description || "No description"}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(
                    product.status,
                  )}`}
                >
                  Product: {product.status}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(
                    product.shop_status,
                  )}`}
                >
                  Shop: {product.shop_status}
                </span>

                {product.is_on_sale && (
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                    {product.sale_label || "On Sale"}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-400">
                Price
              </p>
              <p className="mt-2 text-lg font-bold text-slate-950">
                {formatPeso(product.price)}
              </p>
              <p className="text-xs text-slate-500">per {product.unit_type}</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-400">
                Stock
              </p>
              <p className="mt-2 text-lg font-bold text-slate-950">
                {Number(product.stock || 0)} {product.unit_type}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-400">
                Created
              </p>
              <p className="mt-2 text-sm font-bold text-slate-950">
                {formatDate(product.created_at)}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Vendor
            </p>

            <p className="mt-2 text-sm font-bold text-slate-950">
              {product.vendor_name || "Vendor"}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {product.vendor_email || "No email"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewProducts;
