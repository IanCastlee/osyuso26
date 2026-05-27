import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiAlertCircle, FiArrowRight } from "react-icons/fi";

function PromotionPaymentFailed() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const promotionId = searchParams.get("promotion_id");

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
          <FiAlertCircle className="text-3xl" />
        </div>

        <h1 className="mt-5 text-2xl font-bold text-slate-950">
          Payment Not Completed
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Your promotion payment was not completed. You can return to your
          promotions page and continue payment if the invoice is still valid.
        </p>

        {promotionId && (
          <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
            Promotion ID: #{promotionId}
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate("/vendor/promotions")}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Back to Promotions
          <FiArrowRight />
        </button>
      </div>
    </div>
  );
}

export default PromotionPaymentFailed;
