import React, { useEffect, useState } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { BsCart4 } from "react-icons/bs";

import Loader from "../../reusable_components/Loader";
import NoData from "../../reusable_components/NoData";
import useGetData from "../../hooks/useGetData";
import useFormSubmit from "../../hooks/useFormSubmit";
import { useToast } from "../../context/ToastContext";

function Cart() {
  // ================= DATA =================
  const { data, loading } = useGetData("cart/get-cart.php");
  const [items, setItems] = useState([]);

  const { submit: updateSubmit } = useFormSubmit("cart/update-cart.php");
  const { submit: removeSubmit } = useFormSubmit("cart/remove-cart-item.php");

  const { showToast } = useToast();

  useEffect(() => {
    if (data) setItems(data);
  }, [data]);

  if (loading) return <Loader />;
  if (!items.length) return <NoData text="Your cart is empty" />;

  // ================= UPDATE CART =================
  const updateCart = async (item, newValue) => {
    try {
      let payload = {
        cart_item_id: item.cart_item_id,
        quantity: item.quantity,
        weight: item.weight,
      };

      let updated = { ...item };

      if (item.unit_type === "kg") {
        updated.weight = Math.max(0.5, Number(newValue));
        updated.quantity = 1;

        payload.weight = updated.weight;
        payload.quantity = 1;
      } else {
        updated.quantity = Math.max(1, Number(newValue));
        updated.weight = 0;

        payload.quantity = updated.quantity;
        payload.weight = 0;
      }

      await updateSubmit(payload);

      // 🔥 realtime UI update
      setItems((prev) =>
        prev.map((i) =>
          i.cart_item_id === item.cart_item_id
            ? {
                ...i,
                weight: updated.weight,
                quantity: updated.quantity,
              }
            : i,
        ),
      );

      showToast({
        type: "success",
        message: "Cart updated!",
        duration: 3000,
      });
    } catch (err) {
      showToast({
        type: "error",
        message: "Update failed",
        duration: 3000,
      });
    }
  };

  // ================= REMOVE ITEM =================
  const removeItem = async (id) => {
    try {
      await removeSubmit({ cart_item_id: id });

      setItems((prev) => prev.filter((i) => i.cart_item_id !== id));

      showToast({
        type: "success",
        message: "Item removed",
        duration: 3000,
      });
    } catch (err) {
      showToast({
        type: "error",
        message: "Remove failed",
        duration: 3000,
      });
    }
  };

  // ================= TOTAL =================
  const grandTotal = items.reduce((sum, item) => {
    const qty = item.unit_type === "kg" ? item.weight : item.quantity;

    return sum + item.price * qty;
  }, 0);

  return (
    <div className="w-full bg-gray-100 px-4 md:px-10 lg:px-28 py-6">
      {/* HEADER */}
      <h1 className="flex items-center gap-2 text-xl md:text-2xl font-bold text-primary mb-6">
        <BsCart4 /> Your Cart
      </h1>

      {/* ITEMS */}
      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div
            key={item.cart_item_id}
            className="bg-white rounded-xl shadow-sm p-4 flex flex-col md:flex-row gap-4"
          >
            {/* IMAGE */}
            <div className="w-full md:w-[120px] h-[120px] bg-gray-100 rounded-lg overflow-hidden">
              <LazyLoadImage
                src={item.image_path}
                className="w-full h-full object-cover"
              />
            </div>

            {/* DETAILS */}
            <div className="flex-1 flex flex-col justify-between gap-3">
              <div>
                <h3 className="font-semibold text-primary">{item.name}</h3>

                <p className="text-sm text-gray-500">{item.shop_name}</p>

                <p className="text-secondary font-bold">
                  ₱{item.price} / {item.unit_type}
                </p>
              </div>

              {/* CONTROLS */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    updateCart(
                      item,
                      item.unit_type === "kg"
                        ? item.weight - 0.5
                        : item.quantity - 1,
                    )
                  }
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                  -
                </button>

                <span className="px-3 font-medium">
                  {item.unit_type === "kg"
                    ? `${item.weight} kg`
                    : `${item.quantity} pcs`}
                </span>

                <button
                  onClick={() =>
                    updateCart(
                      item,
                      item.unit_type === "kg"
                        ? item.weight + 0.5
                        : item.quantity + 1,
                    )
                  }
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                  +
                </button>
              </div>

              {/* SUBTOTAL */}
              <div className="flex justify-end">
                <p className="font-bold text-primary text-lg">
                  ₱
                  {(
                    item.price *
                    (item.unit_type === "kg" ? item.weight : item.quantity)
                  ).toFixed(2)}
                </p>
              </div>

              {/* ACTIONS */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => removeItem(item.cart_item_id)}
                  className="px-4 py-1 text-sm border border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-white transition"
                >
                  Remove
                </button>

                <button className="px-4 py-1 text-sm bg-secondary text-white rounded hover:opacity-90 transition">
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* TOTAL */}
      <div className="mt-6 bg-white p-4 rounded-xl shadow flex justify-between">
        <h2 className="font-semibold text-primary">Total</h2>
        <p className="text-secondary font-bold text-xl">
          ₱{grandTotal.toFixed(2)}
        </p>
      </div>
    </div>
  );
}

export default Cart;
