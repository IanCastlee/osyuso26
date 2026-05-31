import React, { useEffect, useState } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import {
  FiAlertCircle,
  FiPackage,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiMapPin,
} from "react-icons/fi";

import useGetData from "../../hooks/useGetData";
import useFormSubmit from "../../hooks/useFormSubmit";
import Loader from "../../reusable_components/Loader";
import NoData from "../../reusable_components/NoData";
import ConfirmationModal from "../../reusable_components/ConfirmationModal";
import { useToast } from "../../context/ToastContext";

function Orders() {
  const { data, loading } = useGetData("order/get-order.php");
  const { submit: cancelSubmit, loading: cancelLoading } = useFormSubmit(
    "order/cancel-order.php",
  );

  const { showToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [cancelTarget, setCancelTarget] = useState(null);

  useEffect(() => {
    setOrders(Array.isArray(data) ? data : []);
  }, [data]);

  const toBoolean = (value) => {
    return value === true || value === 1 || value === "1" || value === "true";
  };

  const isShopOpen = (order) => {
    return toBoolean(order?.is_shop_open ?? 1);
  };

  const formatMoney = (value) => `₱${Number(value || 0).toFixed(2)}`;

  const formatTime = (value) => {
    if (!value) return null;
    return String(value).slice(0, 5);
  };

  const getUnavailableText = (order) => {
    if (order?.unavailable_reason) return order.unavailable_reason;

    if (!isShopOpen(order)) {
      return order?.shop_closed_message || "Shop is closed now.";
    }

    return "This order is not available for payment right now.";
  };

  const getStatusStyle = (status) => {
    if (status === "paid") {
      return {
        label: "Paid",
        icon: FiCheckCircle,
        className: "bg-emerald-50 text-emerald-600",
      };
    }

    if (status === "expired" || status === "failed") {
      return {
        label: status,
        icon: FiXCircle,
        className: "bg-red-50 text-red-600",
      };
    }

    return {
      label: "Pending",
      icon: FiClock,
      className: "bg-orange-50 text-orange-600",
    };
  };

  const getClaimStyle = (status) => {
    if (status === "claimed") {
      return {
        label: "Claimed",
        icon: FiCheckCircle,
        className: "bg-blue-50 text-blue-600",
      };
    }

    return {
      label: "Unclaimed",
      icon: FiMapPin,
      className: "bg-slate-100 text-slate-600",
    };
  };

  const handleCancelOrder = async () => {
    if (!cancelTarget) return;

    try {
      await cancelSubmit({
        order_id: cancelTarget.order_id,
      });

      setOrders((prev) =>
        prev.filter((order) => order.order_id !== cancelTarget.order_id),
      );

      showToast({
        type: "success",
        message: "Order deleted successfully",
        duration: 3000,
      });

      setCancelTarget(null);
    } catch (err) {
      showToast({
        type: "error",
        message: err?.message || "Failed to delete order",
        duration: 4000,
      });
    }
  };

  const handleContinuePayment = (order) => {
    if (!isShopOpen(order)) {
      showToast({
        type: "error",
        message: getUnavailableText(order),
        duration: 4000,
      });
      return;
    }

    if (!order.xendit_checkout_url) {
      showToast({
        type: "error",
        message: "Payment link is not available.",
        duration: 3000,
      });
      return;
    }

    window.location.assign(order.xendit_checkout_url);
  };

  if (loading) return <Loader />;

  if (!orders.length) {
    return (
      <NoData
        text="No orders yet"
        subText="Your paid and pending orders will appear here."
      />
    );
  }

  return (
    <>
      <div className="min-h-screen w-full bg-gray-100 px-1 py-6 md:px-10 lg:px-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 md:text-2xl">
                <FiPackage className="text-secondary" />
                My Orders
              </h1>

              <p className="mt-1 hidden text-xs text-gray-500 lg:flex">
                Track your recent purchases, payment status, and claim status.
              </p>
            </div>

            <span className="rounded-full bg-white px-4 py-2 text-xs font-medium text-gray-600 shadow-sm">
              {orders.length} {orders.length === 1 ? "order" : "orders"}
            </span>
          </div>

          <div className="space-y-2">
            {orders.map((order) => {
              const status = getStatusStyle(order.payment_status);
              const StatusIcon = status.icon;

              const claim = getClaimStyle(order.claim_status || "unclaimed");
              const ClaimIcon = claim.icon;

              const amount =
                order.unit_type === "kg"
                  ? `${order.weight} kg`
                  : `${order.quantity} pcs`;

              const isPending = order.payment_status === "pending";
              const isPaid = order.payment_status === "paid";
              const shopOpen = isShopOpen(order);
              const canContinuePayment =
                isPending && shopOpen && order.xendit_checkout_url;

              return (
                <div
                  key={order.order_id}
                  className={`overflow-hidden rounded-xl bg-white shadow-sm ${
                    isPending && !shopOpen ? "ring-1 ring-red-100" : ""
                  }`}
                >
                  <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Order #{order.order_id}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {order.created_at}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <div
                        className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ${status.className}`}
                      >
                        <StatusIcon />
                        {status.label}
                      </div>

                      {isPaid && (
                        <div
                          className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ${claim.className}`}
                        >
                          <ClaimIcon />
                          {claim.label}
                        </div>
                      )}

                      {isPending && !shopOpen && (
                        <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                          <FiClock />
                          Shop Closed
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 p-4">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      <LazyLoadImage
                        src={order.image_path || "/placeholder.png"}
                        alt={order.product_name}
                        effect="opacity"
                        wrapperClassName="!block !h-full !w-full"
                        className={`!h-full !w-full object-cover ${
                          isPending && !shopOpen ? "grayscale-[0.25]" : ""
                        }`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                        <div>
                          <h2 className="line-clamp-2 text-sm font-semibold text-gray-900">
                            {order.product_name}
                          </h2>

                          <p className="mt-1 text-xs text-gray-500">
                            {order.shop_name}
                          </p>

                          <p className="mt-2 text-xs text-gray-500">
                            {amount} • {formatMoney(order.unit_price)} /{" "}
                            {order.unit_type}
                          </p>

                          {order.claim_status === "claimed" &&
                            order.claimed_at && (
                              <p className="mt-2 text-xs text-blue-500">
                                Claimed at {order.claimed_at}
                              </p>
                            )}

                          {isPending && !shopOpen && (
                            <div className="mt-3 flex gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                              <FiAlertCircle className="mt-0.5 shrink-0" />
                              <div>
                                <p>{getUnavailableText(order)}</p>

                                {order.shop_opens_at &&
                                  order.shop_closes_at && (
                                    <p className="mt-1 font-bold">
                                      Hours: {formatTime(order.shop_opens_at)} -{" "}
                                      {formatTime(order.shop_closes_at)}
                                    </p>
                                  )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="sm:text-right">
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="text-lg font-bold text-secondary">
                            {formatMoney(order.total_amount)}
                          </p>
                        </div>
                      </div>

                      {isPending && (
                        <div className="mt-4 flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            disabled={!canContinuePayment}
                            onClick={() => handleContinuePayment(order)}
                            className="rounded-lg bg-secondary px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            Continue Payment
                          </button>

                          <button
                            type="button"
                            onClick={() => setCancelTarget(order)}
                            className="rounded-lg border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            Cancel Order
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <ConfirmationModal
        open={!!cancelTarget}
        title="Delete pending order?"
        message="This order will be deleted permanently. You will not be able to recover it after confirming."
        confirmText="Delete Order"
        cancelText="Keep Order"
        loading={cancelLoading}
        onCancel={() => setCancelTarget(null)}
        onConfirm={handleCancelOrder}
      />
    </>
  );
}

export default Orders;
