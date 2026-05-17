import React, { useEffect, useState } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { FiPackage, FiClock, FiCheckCircle, FiXCircle } from "react-icons/fi";

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
                Track your recent purchases and payment status.
              </p>
            </div>

            <span className="rounded-full bg-white px-4 py-2 text-xs font-medium text-gray-600 shadow-sm">
              {orders.length} {orders.length === 1 ? "order" : "orders"}
            </span>
          </div>

          <div className="space-y-4">
            {orders.map((order) => {
              const status = getStatusStyle(order.payment_status);
              const StatusIcon = status.icon;

              const amount =
                order.unit_type === "kg"
                  ? `${order.weight} kg`
                  : `${order.quantity} pcs`;

              const isPending = order.payment_status === "pending";

              return (
                <div
                  key={order.order_id}
                  className="overflow-hidden rounded-xl bg-white shadow-sm"
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

                    <div
                      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ${status.className}`}
                    >
                      <StatusIcon />
                      {status.label}
                    </div>
                  </div>

                  <div className="flex gap-4 p-4">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      <LazyLoadImage
                        src={order.image_path || "/placeholder.png"}
                        alt={order.product_name}
                        effect="opacity"
                        wrapperClassName="!block !h-full !w-full"
                        className="!h-full !w-full object-cover"
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
                            {amount} • ₱{Number(order.unit_price).toFixed(2)} /{" "}
                            {order.unit_type}
                          </p>
                        </div>

                        <div className="sm:text-right">
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="text-lg font-bold text-secondary">
                            ₱{Number(order.total_amount).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {isPending && (
                        <div className="mt-4 flex flex-wrap justify-end gap-2">
                          {order.xendit_checkout_url && (
                            <a
                              href={order.xendit_checkout_url}
                              className="rounded-lg bg-secondary px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                            >
                              Continue Payment
                            </a>
                          )}

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
