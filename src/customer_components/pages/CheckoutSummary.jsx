import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useFormSubmit from "../../hooks/useFormSubmit";
import { icons } from "../../constant/icons";

function CheckoutSummary() {
  const navigate = useNavigate();
  const location = useLocation();

  const { product, unit, quantity, weight, total } = location.state || {};

  if (!product) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-100 px-4">
        <div className="rounded-lg bg-white px-6 py-5 text-center shadow-sm">
          <p className="text-sm font-medium text-gray-700">
            Invalid checkout session
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 rounded-md bg-secondary px-4 py-2 text-sm text-white"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const { submit, loading } = useFormSubmit("order/order.php", (res) => {
    if (res.checkout_url) {
      window.location.href = res.checkout_url;
      return;
    }

    alert("Checkout URL not found.");
  });

  const handleBack = () => {
    navigate(-1);
  };

  const handlePlaceOrder = async () => {
    try {
      await submit({
        product_id: product.id,
        quantity: unit === "kg" ? 0 : quantity,
        weight: unit === "kg" ? weight : 0,
      });
    } catch (err) {
      alert(err?.message || "Failed to create checkout.");
    }
  };

  const orderAmount = Number(total || 0).toFixed(2);
  const unitPrice = Number(product.price || 0).toFixed(2);

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-5">
          <button
            onClick={handleBack}
            disabled={loading}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-secondary disabled:opacity-50"
          >
            <span className="text-lg">‹</span>
            Back to checkout
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <section className="rounded-lg bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    Checkout Summary
                  </h1>
                  <p className="mt-1 text-xs text-gray-500">
                    Review your item before continuing to payment.
                  </p>
                </div>

                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-secondary">
                  Xendit Payment
                </span>
              </div>

              <div className="mt-5 flex gap-4">
                <img
                  src={product.image_path || "/placeholder.png"}
                  alt={product.name}
                  className="h-24 w-24 rounded-lg border border-gray-100 object-cover"
                />

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold text-gray-900">
                    {product.name}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    ₱{unitPrice} / {product.unit_type}
                  </p>

                  <div className="mt-3 inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                    {unit === "kg" ? `${weight} kg` : `${quantity} pcs`}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-lg bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">
                Shop Details
              </h2>

              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900">
                    {product.shop_name}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    {product.address || "No address available"}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-gray-50 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-gray-400">
                      Phone
                    </p>
                    <p className="mt-1 text-xs font-medium text-gray-700">
                      {product.phone || "N/A"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-gray-400">
                      Landmark
                    </p>
                    <p className="mt-1 text-xs font-medium text-gray-700">
                      {product.nearby_landmark || "No nearby landmark"}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className="flex h-full flex-col rounded-lg bg-white p-5 shadow-sm lg:sticky">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Payment Summary
              </h2>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Unit Price</span>
                  <span className="font-medium text-gray-800">
                    ₱{unitPrice}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">
                    {unit === "kg" ? "Weight" : "Quantity"}
                  </span>
                  <span className="font-medium text-gray-800">
                    {unit === "kg" ? `${weight} kg` : `${quantity} pcs`}
                  </span>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-end justify-between gap-4">
                    <span className="text-sm font-semibold text-gray-900">
                      Total
                    </span>
                    <span className="text-2xl font-bold text-secondary">
                      ₱{orderAmount}
                    </span>
                  </div>

                  <p className="mt-2 text-xs leading-5 text-gray-500">
                    You will be redirected to Xendit to complete your payment.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-auto space-y-3 pt-8">
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full rounded-lg bg-secondary px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Redirecting to Xendit..." : "Pay Now"}
              </button>

              <button
                onClick={handleBack}
                disabled={loading}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Back
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default CheckoutSummary;
