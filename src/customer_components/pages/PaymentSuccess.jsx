import React, { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { FiDownload, FiHome, FiList } from "react-icons/fi";

import useGetData from "../../hooks/useGetData";
import fetchInstance from "../../utils/fetchInstance";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");

  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { logout } = useAuth();

  const [downloading, setDownloading] = useState(false);

  const { data, loading } = useGetData(
    orderId ? `order/get-receipt.php?order_id=${orderId}` : null,
  );

  const receipt = data?.receipt;

  const handleDownloadReceipt = async () => {
    if (!orderId || downloading) return;

    try {
      setDownloading(true);

      const blob = await fetchInstance(
        `order/download-receipt.php?order_id=${orderId}`,
        {
          method: "GET",
          responseType: "blob",
        },
      );

      const fileUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = fileUrl;
      link.download = receipt?.receipt_no
        ? `${receipt.receipt_no}.pdf`
        : `receipt-order-${orderId}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(fileUrl);
    } catch (err) {
      console.error("DOWNLOAD RECEIPT ERROR:", err);

      if (err?.status === 401) {
        sessionStorage.removeItem("auth-storage");
        logout?.();

        navigate("/signin", {
          replace: true,
          state: {
            from: location.pathname,
          },
        });

        return;
      }

      showToast({
        type: "error",
        message: err?.message || "Failed to download receipt",
        duration: 3000,
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-orange-500 px-6 py-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-orange-500 shadow-sm">
            <span className="text-3xl font-bold">✓</span>
          </div>

          <h1 className="text-2xl font-bold">Payment Successful</h1>

          <p className="mt-2 text-sm text-white/85">
            Thank you! Your payment has been confirmed.
          </p>
        </div>

        <div className="p-6">
          <div className="rounded-xl bg-slate-50 p-4">
            <Info label="Order ID" value={orderId ? `#${orderId}` : "-"} />

            <div className="mt-3">
              <Info
                label="Receipt"
                value={
                  loading ? "Checking..." : receipt?.receipt_no || "Processing"
                }
              />
            </div>

            {receipt && (
              <div className="mt-3">
                <Info
                  label="Amount Paid"
                  value={`₱${Number(receipt.amount_paid || 0).toFixed(2)}`}
                />
              </div>
            )}
          </div>

          <button
            onClick={handleDownloadReceipt}
            disabled={!orderId || loading || !receipt || downloading}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiDownload />
            {downloading ? "Downloading..." : "Download Receipt"}
          </button>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <Link
              to="/orders"
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              <FiList />
              Orders
            </Link>

            <Link
              to="/"
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <FiHome />
              Home
            </Link>
          </div>

          {!loading && !receipt && (
            <p className="mt-4 text-center text-xs leading-5 text-slate-500">
              Receipt is still processing. Please refresh this page in a few
              seconds.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-semibold text-slate-900">
        {value || "-"}
      </span>
    </div>
  );
}

export default PaymentSuccess;
