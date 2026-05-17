import React from "react";
import { Link, useSearchParams } from "react-router-dom";

function PaymentFailed() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
          <span className="text-3xl font-bold">×</span>
        </div>

        <h1 className="text-xl font-semibold text-primary">Payment Failed</h1>

        <p className="mt-2 text-sm text-gray-500">
          Your payment was not completed. You can try checking out again.
        </p>

        {orderId && (
          <p className="mt-3 text-sm text-gray-600">
            Order ID: <span className="font-semibold">#{orderId}</span>
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <Link
            to="/"
            className="w-1/2 rounded-md bg-secondary py-2 text-sm text-white hover:opacity-90 transition"
          >
            Home
          </Link>

          <Link
            to="/orders"
            className="w-1/2 rounded-md border py-2 text-sm hover:bg-gray-100 transition"
          >
            View Orders
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PaymentFailed;
