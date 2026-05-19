import React, { useEffect, useMemo, useState } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { BsCart4 } from "react-icons/bs";
import { FiMinus, FiPlus, FiTrash2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import Loader from "../../reusable_components/Loader";
import NoData from "../../reusable_components/NoData";
import useGetData from "../../hooks/useGetData";
import useFormSubmit from "../../hooks/useFormSubmit";
import { useToast } from "../../context/ToastContext";

function Cart() {
  const navigate = useNavigate();
  const { data, loading } = useGetData("cart/get-cart.php");

  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  const { submit: updateSubmit } = useFormSubmit("cart/update-cart.php");
  const { submit: removeSubmit } = useFormSubmit("cart/remove-cart-item.php");
  const { showToast } = useToast();

  useEffect(() => {
    if (!Array.isArray(data)) return;

    setItems(data);

    setSelectedItem((prev) => {
      const stillExists = data.some((item) => item.cart_item_id === prev);
      return stillExists ? prev : data[0]?.cart_item_id || null;
    });
  }, [data]);

  const formatPeso = (value) => `₱${Number(value || 0).toFixed(2)}`;

  const getItemAmount = (item) => {
    const amount = item.unit_type === "kg" ? item.weight : item.quantity;
    return Number(item.price || 0) * Number(amount || 0);
  };

  const getQtyLabel = (item) => {
    if (item.unit_type === "kg") return `${Number(item.weight || 0)} kg`;
    return `${Number(item.quantity || 0)} pcs`;
  };

  const selectedCartItem = useMemo(
    () => items.find((item) => item.cart_item_id === selectedItem),
    [items, selectedItem],
  );

  const total = selectedCartItem ? getItemAmount(selectedCartItem) : 0;

  const updateCart = async (item, newValue) => {
    try {
      const value = Number(newValue);
      if (Number.isNaN(value)) return;

      const updated = { ...item };

      if (item.unit_type === "kg") {
        updated.weight = Math.max(0.5, value);
        updated.quantity = 0;
      } else {
        updated.quantity = Math.max(1, value);
        updated.weight = 0;
      }

      await updateSubmit({
        cart_item_id: item.cart_item_id,
        quantity: updated.quantity,
        weight: updated.weight,
      });

      setItems((prev) =>
        prev.map((cartItem) =>
          cartItem.cart_item_id === item.cart_item_id
            ? {
                ...cartItem,
                quantity: updated.quantity,
                weight: updated.weight,
              }
            : cartItem,
        ),
      );

      showToast({
        type: "success",
        message: "Cart updated!",
        duration: 2500,
      });
    } catch (err) {
      showToast({
        type: "error",
        message: "Update failed",
        duration: 3000,
      });
    }
  };

  const removeItem = async (id) => {
    try {
      await removeSubmit({ cart_item_id: id });

      const updatedItems = items.filter((item) => item.cart_item_id !== id);
      setItems(updatedItems);

      if (selectedItem === id) {
        setSelectedItem(updatedItems[0]?.cart_item_id || null);
      }

      showToast({
        type: "success",
        message: "Item removed",
        duration: 2500,
      });
    } catch (err) {
      showToast({
        type: "error",
        message: "Remove failed",
        duration: 3000,
      });
    }
  };

  const handleCheckoutSelected = () => {
    if (!selectedCartItem) {
      showToast({
        type: "error",
        message: "Please select an item first.",
        duration: 3000,
      });
      return;
    }

    const product = {
      ...selectedCartItem,
      id: selectedCartItem.product_id,
    };

    const unit = product.unit_type;
    const quantity = unit === "kg" ? 0 : Number(product.quantity || 1);
    const weight = unit === "kg" ? Number(product.weight || 0.5) : 0;
    const total = getItemAmount(product);

    navigate("/checkout", {
      state: {
        product,
        unit: product.unit_type,
        quantity,
        weight,
        total,
      },
    });
  };
  if (loading) return <Loader />;

  if (!items.length) {
    return <NoData text="Your cart is empty" />;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-3 pb-28 pt-5 sm:px-5 lg:px-10 lg:pb-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-xl font-black text-slate-950 sm:text-2xl">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary/10 text-secondary">
                <BsCart4 />
              </span>
              Your Cart
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Select one item to checkout.
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-slate-200">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-3">
            {items.map((item) => {
              const isSelected = selectedItem === item.cart_item_id;
              const qtyValue =
                item.unit_type === "kg"
                  ? Number(item.weight || 0)
                  : Number(item.quantity || 0);
              const subtotal = getItemAmount(item);

              return (
                <article
                  key={item.cart_item_id}
                  onClick={() => setSelectedItem(item.cart_item_id)}
                  className={`cursor-pointer rounded-xl border bg-white p-3 shadow-sm transition sm:p-4 ${
                    isSelected
                      ? "border-orange-500 bg-secondary/5"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="grid grid-cols-[20px_80px_minmax(0,1fr)] gap-3 sm:grid-cols-[20px_112px_minmax(0,1fr)] sm:gap-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItem(item.cart_item_id);
                      }}
                      className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition focus:outline-none focus:ring-0 ${
                        isSelected
                          ? "border-secondary bg-secondary"
                          : "border-slate-300 bg-white"
                      }`}
                      aria-label="Select item"
                    >
                      {isSelected && (
                        <span className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </button>

                    <div className="h-20 w-20 overflow-hidden rounded-lg bg-slate-100 sm:h-28 sm:w-28">
                      <LazyLoadImage
                        src={item.image_path || "/placeholder.png"}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="line-clamp-2 break-words text-sm font-bold leading-snug text-slate-950 sm:text-base">
                            {item.name}
                          </h3>

                          <p className="mt-1 truncate text-xs font-medium text-slate-500">
                            {item.shop_name}
                          </p>

                          <p className="mt-2 text-sm font-black text-secondary">
                            {formatPeso(item.price)} / {item.unit_type}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItem(item.cart_item_id);
                          }}
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-red-500 transition hover:bg-red-50 focus:outline-none focus:ring-0 sm:h-9 sm:w-9"
                          title="Remove item"
                        >
                          <FiTrash2 />
                        </button>
                      </div>

                      <div className="mt-4 grid gap-3 sm:flex sm:items-end sm:justify-between">
                        <div>
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400 sm:text-[11px]">
                            {item.unit_type === "kg" ? "Weight" : "Quantity"}
                          </p>

                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex h-9 max-w-full items-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 sm:h-10"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                updateCart(
                                  item,
                                  item.unit_type === "kg"
                                    ? qtyValue - 0.5
                                    : qtyValue - 1,
                                )
                              }
                              className="grid h-9 w-9 shrink-0 place-items-center text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-0 sm:h-10 sm:w-10"
                              aria-label="Decrease"
                            >
                              <FiMinus />
                            </button>

                            <span className="min-w-16 px-2 text-center text-xs font-bold text-slate-800 sm:min-w-20 sm:px-3 sm:text-sm">
                              {getQtyLabel(item)}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                updateCart(
                                  item,
                                  item.unit_type === "kg"
                                    ? qtyValue + 0.5
                                    : qtyValue + 1,
                                )
                              }
                              className="grid h-9 w-9 shrink-0 place-items-center text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-0 sm:h-10 sm:w-10"
                              aria-label="Increase"
                            >
                              <FiPlus />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 sm:block sm:bg-transparent sm:px-0 sm:py-0 sm:text-right">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 sm:text-[11px]">
                            Subtotal
                          </p>

                          <p className="text-base font-black text-slate-950 sm:text-lg">
                            {formatPeso(subtotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="hidden h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24 lg:block">
            <h2 className="text-base font-black text-slate-950">
              Order Summary
            </h2>

            {selectedCartItem ? (
              <>
                <div className="mt-4 rounded-xl border border-slate-200 p-3">
                  <div className="flex gap-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      <img
                        src={selectedCartItem.image_path || "/placeholder.png"}
                        alt={selectedCartItem.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-sm font-bold text-slate-950">
                        {selectedCartItem.name}
                      </h3>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {selectedCartItem.shop_name}
                      </p>

                      <p className="mt-2 text-sm font-black text-secondary">
                        {formatPeso(selectedCartItem.price)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Selected item</span>
                    <span className="font-bold text-slate-800">1</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount</span>
                    <span className="font-bold text-slate-800">
                      {getQtyLabel(selectedCartItem)}
                    </span>
                  </div>

                  <div className="flex items-end justify-between border-t border-slate-200 pt-4">
                    <span className="font-black text-slate-950">Total</span>
                    <span className="text-2xl font-black text-secondary">
                      {formatPeso(total)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCheckoutSelected}
                  className="mt-6 w-full rounded-lg bg-secondary px-4 py-3 text-sm font-black text-white shadow-sm transition hover:opacity-90 focus:outline-none focus:ring-0"
                >
                  Checkout Selected
                </button>
              </>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                Please select an item.
              </p>
            )}
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white p-3 shadow-[0_-10px_30px_rgba(15,23,42,0.12)] lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-500">
              {selectedCartItem ? selectedCartItem.name : "No selected item"}
            </p>

            <p className="text-lg font-black text-secondary">
              {formatPeso(total)}
            </p>
          </div>

          <button
            type="button"
            onClick={handleCheckoutSelected}
            disabled={!selectedCartItem}
            className="shrink-0 rounded-lg bg-secondary px-5 py-3 text-sm font-black text-white shadow-sm transition hover:opacity-90 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Cart;
