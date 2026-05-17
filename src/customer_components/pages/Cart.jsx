import React, { useEffect, useState } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { BsCart4 } from "react-icons/bs";
import { FiMinus, FiPlus, FiTrash2 } from "react-icons/fi";

import Loader from "../../reusable_components/Loader";
import NoData from "../../reusable_components/NoData";
import useGetData from "../../hooks/useGetData";
import useFormSubmit from "../../hooks/useFormSubmit";
import { useToast } from "../../context/ToastContext";

function Cart() {
  const { data, loading } = useGetData("cart/get-cart.php");

  const [items, setItems] = useState([]);

  // ================= SELECTED ITEM =================
  const [selectedItem, setSelectedItem] = useState(null);

  const { submit: updateSubmit } = useFormSubmit("cart/update-cart.php");
  const { submit: removeSubmit } = useFormSubmit("cart/remove-cart-item.php");

  const { showToast } = useToast();

  useEffect(() => {
    if (data) {
      setItems(data);

      // AUTO SELECT FIRST ITEM
      if (data.length > 0 && !selectedItem) {
        setSelectedItem(data[0].cart_item_id);
      }
    }
  }, [data]);

  if (loading) return <Loader />;

  if (!items.length) {
    return <NoData text="Your cart is empty" />;
  }

  // ================= UPDATE CART =================
  const updateCart = async (item, newValue) => {
    try {
      const updated = { ...item };

      if (item.unit_type === "kg") {
        updated.weight = Math.max(0.5, Number(newValue));
        updated.quantity = 0;
      } else {
        updated.quantity = Math.max(1, Number(newValue));
        updated.weight = 0;
      }

      await updateSubmit({
        cart_item_id: item.cart_item_id,
        quantity: updated.quantity,
        weight: updated.weight,
      });

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

      const updatedItems = items.filter((i) => i.cart_item_id !== id);

      setItems(updatedItems);

      // RESET SELECTED ITEM
      if (selectedItem === id) {
        setSelectedItem(updatedItems[0]?.cart_item_id || null);
      }

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

  // ================= GET ITEM TOTAL =================
  const getItemAmount = (item) => {
    const qty = item.unit_type === "kg" ? item.weight : item.quantity;

    return Number(item.price) * Number(qty);
  };

  // ================= SELECTED ITEM DATA =================
  const selectedCartItem = items.find(
    (item) => item.cart_item_id === selectedItem,
  );

  // ================= SUMMARY =================
  const total = selectedCartItem ? getItemAmount(selectedCartItem) : 0;

  return (
    <div className="min-h-screen w-full bg-gray-100 px-4 py-6 md:px-10 lg:px-28">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 md:text-2xl">
              <BsCart4 className="text-secondary" />
              Your Cart
            </h1>

            <p className="mt-1 text-xs text-gray-500">
              Select one item for checkout summary.
            </p>
          </div>

          <span className="rounded-full bg-white px-4 py-2 text-xs font-medium text-gray-600 shadow-sm">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          {/* CART ITEMS */}
          <div className="space-y-3">
            {items.map((item) => {
              const qtyValue =
                item.unit_type === "kg" ? item.weight : item.quantity;

              const subtotal = getItemAmount(item);

              const isSelected = selectedItem === item.cart_item_id;

              return (
                <div
                  key={item.cart_item_id}
                  className={`
                    rounded-xl bg-white p-4 shadow-sm transition
                    hover:shadow-md"
                  
                  `}
                >
                  <div className="flex gap-4">
                    {/* SELECT BUTTON */}
                    <div className="pt-1">
                      <button
                        onClick={() => setSelectedItem(item.cart_item_id)}
                        className={`
                          w-5 h-5 rounded-full
                          flex items-center justify-center
                          transition border border-gray-500
                        `}
                      >
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
                        )}
                      </button>
                    </div>

                    {/* IMAGE */}
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100 md:h-28 md:w-28">
                      <LazyLoadImage
                        src={item.image_path || "/placeholder.png"}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* CONTENT */}
                    <div className="min-w-0 flex-1">
                      <div className="flex gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">
                            {item.name}
                          </h3>

                          <p className="mt-1 text-xs text-gray-500">
                            {item.shop_name}
                          </p>

                          <p className="mt-2 text-sm font-bold text-secondary">
                            ₱{Number(item.price).toFixed(2)} / {item.unit_type}
                          </p>
                        </div>

                        {/* REMOVE */}
                        <button
                          onClick={() => removeItem(item.cart_item_id)}
                          className="
                            flex h-9 w-9 shrink-0 items-center
                            justify-center rounded-full
                            text-red-500 transition
                            hover:bg-red-50
                          "
                          title="Remove item"
                        >
                          <FiTrash2 />
                        </button>
                      </div>

                      {/* QUANTITY */}
                      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                            {item.unit_type === "kg" ? "Weight" : "Quantity"}
                          </p>

                          <div className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50">
                            {/* MINUS */}
                            <button
                              onClick={() =>
                                updateCart(
                                  item,
                                  item.unit_type === "kg"
                                    ? item.weight - 0.5
                                    : item.quantity - 1,
                                )
                              }
                              className="
                                flex h-9 w-9 items-center
                                justify-center text-gray-600
                                transition hover:bg-gray-100
                              "
                            >
                              <FiMinus />
                            </button>

                            {/* VALUE */}
                            <span className="min-w-20 px-3 text-center text-sm font-semibold text-gray-800">
                              {item.unit_type === "kg"
                                ? `${qtyValue} kg`
                                : `${qtyValue} pcs`}
                            </span>

                            {/* PLUS */}
                            <button
                              onClick={() =>
                                updateCart(
                                  item,
                                  item.unit_type === "kg"
                                    ? item.weight + 0.5
                                    : item.quantity + 1,
                                )
                              }
                              className="
                                flex h-9 w-9 items-center
                                justify-center text-gray-600
                                transition hover:bg-gray-100
                              "
                            >
                              <FiPlus />
                            </button>
                          </div>
                        </div>

                        {/* SUBTOTAL */}
                        <div className="text-left sm:text-right">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                            Subtotal
                          </p>

                          <p className="mt-1 text-lg font-bold text-gray-900">
                            ₱{subtotal.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* SUMMARY */}
          <aside className="h-fit rounded-xl bg-white p-5 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-sm font-semibold text-gray-900">
              Order Summary
            </h2>

            {selectedCartItem ? (
              <>
                <div className="mt-4 rounded-xl border border-gray-100 p-3">
                  <div className="flex gap-3">
                    <div className="h-16 w-16 overflow-hidden rounded-lg bg-gray-100">
                      <img
                        src={selectedCartItem.image_path || "/placeholder.png"}
                        alt={selectedCartItem.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="flex-1">
                      <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">
                        {selectedCartItem.name}
                      </h3>

                      <p className="mt-1 text-xs text-gray-500">
                        {selectedCartItem.shop_name}
                      </p>

                      <p className="mt-2 text-sm font-bold text-secondary">
                        ₱{Number(selectedCartItem.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Selected Item</span>

                    <span className="font-medium text-gray-800">1</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Quantity</span>

                    <span className="font-medium text-gray-800">
                      {selectedCartItem.unit_type === "kg"
                        ? `${selectedCartItem.weight} kg`
                        : `${selectedCartItem.quantity} pcs`}
                    </span>
                  </div>

                  <div className="flex justify-between border-t border-gray-100 pt-4">
                    <span className="font-semibold text-gray-900">Total</span>

                    <span className="text-2xl font-bold text-secondary">
                      ₱{total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  className="
                    mt-6 w-full rounded-lg bg-secondary
                    px-4 py-3 text-sm font-semibold
                    text-white shadow-sm transition
                    hover:opacity-90
                  "
                >
                  Checkout Selected
                </button>
              </>
            ) : (
              <p className="mt-4 text-sm text-gray-500">
                Please select an item.
              </p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Cart;
