import React, { useEffect } from "react";
import { FiDownload, FiX } from "react-icons/fi";

function ReceiptModal({ order, onClose }) {
  useEffect(() => {
    if (!order) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEsc);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [order, onClose]);

  if (!order) return null;

  const formatMoney = (value) => `₱${Number(value || 0).toFixed(2)}`;

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getQty = () => {
    if (Number(order.weight) > 0) return `${order.weight} kg`;
    return `${order.quantity || 0} pcs`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Receipt</h2>
            <p className="text-xs text-slate-500">
              {order.receipt_no || `Order #${order.id}`}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100"
          >
            <FiX />
          </button>
        </div>

        <div className="p-5">
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  OSYUSO Receipt
                </p>
                <h3 className="mt-1 text-xl font-black text-slate-950">
                  {formatMoney(order.amount_paid || order.total_amount)}
                </h3>
              </div>

              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                Paid
              </span>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <ReceiptRow label="Order ID" value={`#${order.id}`} />
              <ReceiptRow label="Receipt No." value={order.receipt_no || "-"} />
              <ReceiptRow label="Paid At" value={formatDate(order.paid_at)} />
              <ReceiptRow label="Customer" value={order.customer_name || "-"} />
              <ReceiptRow label="Shop" value={order.shop_name || "-"} />
              <ReceiptRow label="Product" value={order.product_name || "-"} />
              <ReceiptRow label="Qty/Weight" value={getQty()} />
              <ReceiptRow
                label="Unit Price"
                value={formatMoney(order.unit_price)}
              />
              <ReceiptRow
                label="Total"
                value={formatMoney(order.total_amount)}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-bold text-white transition hover:opacity-90"
          >
            <FiDownload />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

function ReceiptRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-800">{value}</span>
    </div>
  );
}

export default ReceiptModal;
