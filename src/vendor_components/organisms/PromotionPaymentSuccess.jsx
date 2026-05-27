import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiCheckCircle, FiClock, FiArrowRight } from "react-icons/fi";

function PromotionPaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const promotionId = searchParams.get("promotion_id");

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <FiCheckCircle className="text-3xl" />
        </div>

        <h1 className="mt-5 text-2xl font-bold text-slate-950">
          Payment Successful
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Your featured promotion payment has been received. Your promotion is
          now pending admin approval before it becomes visible to customers.
        </p>

        {promotionId && (
          <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
            Promotion ID: #{promotionId}
          </div>
        )}

        <div className="mt-5 flex items-start gap-3 rounded-xl bg-orange-50 p-4 text-left">
          <FiClock className="mt-0.5 shrink-0 text-orange-600" />

          <p className="text-sm leading-6 text-orange-700">
            Admin will review your promotion details, image, and product before
            approval.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => navigate("/vendor/featured-promotion")}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to Promotions
          </button>

          <button
            type="button"
            onClick={() => navigate("/vendor/featured-promotion")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            View Status
            <FiArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
}

export default PromotionPaymentSuccess;
