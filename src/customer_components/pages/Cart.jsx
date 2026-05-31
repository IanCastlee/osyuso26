import React, { useEffect, useMemo, useState } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { BsCart4 } from "react-icons/bs";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheck,
  FiClock,
  FiCreditCard,
  FiMinus,
  FiPlus,
  FiShoppingBag,
  FiTag,
  FiTrash2,
} from "react-icons/fi";
import { FaStore } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

import Loader from "../../reusable_components/Loader";
import NoData from "../../reusable_components/NoData";
import useGetData from "../../hooks/useGetData";
import useFormSubmit from "../../hooks/useFormSubmit";
import { useToast } from "../../context/ToastContext";

function Cart() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data, loading } = useGetData("cart/get-cart.php");

  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  const { submit: updateSubmit } = useFormSubmit("cart/update-cart.php");
  const { submit: removeSubmit } = useFormSubmit("cart/remove-cart-item.php");

  const isPurchasable = (item) => {
    return toBoolean(item?.is_purchasable ?? 1);
  };

  const isShopOpen = (item) => {
    return toBoolean(item?.is_shop_open ?? 1);
  };

  useEffect(() => {
    if (!Array.isArray(data)) return;

    setItems(data);

    setSelectedItem((prev) => {
      const stillExistsAndPurchasable = data.some(
        (item) => item.cart_item_id === prev && isPurchasable(item),
      );

      if (stillExistsAndPurchasable) return prev;

      return data.find((item) => isPurchasable(item))?.cart_item_id || null;
    });
  }, [data]);

  const selectedCartItem = useMemo(
    () => items.find((item) => item.cart_item_id === selectedItem),
    [items, selectedItem],
  );

  const unavailableCount = useMemo(
    () => items.filter((item) => !isPurchasable(item)).length,
    [items],
  );

  const formatPeso = (value) => {
    return `₱${Number(value || 0).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  function toBoolean(value) {
    return value === true || value === 1 || value === "1" || value === "true";
  }

  const formatTime = (value) => {
    if (!value) return null;
    return String(value).slice(0, 5);
  };

  const getOriginalPrice = (item) => {
    return Number(item.originalPrice ?? item.original_price ?? item.price ?? 0);
  };

  const getFinalPrice = (item) => {
    return Number(
      item.finalPrice ??
        item.final_price ??
        item.sale_price ??
        item.discounted_price ??
        item.price ??
        0,
    );
  };

  const getUnitPrice = (item) => {
    const finalPrice = getFinalPrice(item);
    const originalPrice = getOriginalPrice(item);

    return finalPrice > 0 ? finalPrice : originalPrice;
  };

  const isItemOnSale = (item) => {
    const originalPrice = getOriginalPrice(item);
    const unitPrice = getUnitPrice(item);
    const explicitSale = toBoolean(item.isOnSale ?? item.is_on_sale);

    return unitPrice > 0 && originalPrice > unitPrice && explicitSale;
  };

  const getSaleLabel = (item) => {
    const label = item.saleLabel ?? item.sale_label;

    if (label) return label;

    const originalPrice = getOriginalPrice(item);
    const unitPrice = getUnitPrice(item);

    if (originalPrice > unitPrice && originalPrice > 0) {
      const percent = Math.round(
        ((originalPrice - unitPrice) / originalPrice) * 100,
      );
      return `${percent}% OFF`;
    }

    return "On Sale";
  };

  const getItemAmount = (item) => {
    const amount = item.unit_type === "kg" ? item.weight : item.quantity;
    return getUnitPrice(item) * Number(amount || 0);
  };

  const getItemOriginalAmount = (item) => {
    const amount = item.unit_type === "kg" ? item.weight : item.quantity;
    return getOriginalPrice(item) * Number(amount || 0);
  };

  const getQtyLabel = (item) => {
    if (item.unit_type === "kg") return `${Number(item.weight || 0)} kg`;
    return `${Number(item.quantity || 0)} pcs`;
  };

  const getUnavailableText = (item) => {
    if (item?.unavailable_reason) return item.unavailable_reason;

    if (!isShopOpen(item)) {
      return item?.shop_closed_message || "Shop is closed now.";
    }

    return "This item is not available right now.";
  };

  const total =
    selectedCartItem && isPurchasable(selectedCartItem)
      ? getItemAmount(selectedCartItem)
      : 0;

  const originalTotal =
    selectedCartItem && isPurchasable(selectedCartItem)
      ? getItemOriginalAmount(selectedCartItem)
      : 0;

  const savings =
    selectedCartItem &&
    isPurchasable(selectedCartItem) &&
    isItemOnSale(selectedCartItem)
      ? Math.max(0, originalTotal - total)
      : 0;

  const updateCart = async (item, newValue) => {
    if (!isPurchasable(item)) {
      showToast({
        type: "error",
        message: getUnavailableText(item),
        duration: 3500,
      });
      return;
    }

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
        message: "Cart updated",
        duration: 2500,
      });
    } catch (err) {
      showToast({
        type: "error",
        message: err?.message || "Update failed",
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
        setSelectedItem(
          updatedItems.find((item) => isPurchasable(item))?.cart_item_id ||
            null,
        );
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
        message: "Please select an available item first.",
        duration: 3000,
      });
      return;
    }

    if (!isPurchasable(selectedCartItem)) {
      showToast({
        type: "error",
        message: getUnavailableText(selectedCartItem),
        duration: 4000,
      });
      return;
    }

    const product = {
      ...selectedCartItem,
      id: selectedCartItem.product_id,
      price: getUnitPrice(selectedCartItem),
      originalPrice: getOriginalPrice(selectedCartItem),
      finalPrice: getUnitPrice(selectedCartItem),
      isOnSale: isItemOnSale(selectedCartItem),
      saleLabel: getSaleLabel(selectedCartItem),
      original_price: getOriginalPrice(selectedCartItem),
      final_price: getUnitPrice(selectedCartItem),
      is_on_sale: isItemOnSale(selectedCartItem) ? 1 : 0,
      sale_label: getSaleLabel(selectedCartItem),
    };

    const unit = product.unit_type;
    const quantity = unit === "kg" ? 0 : Number(product.quantity || 1);
    const weight = unit === "kg" ? Number(product.weight || 0.5) : 0;
    const total = getItemAmount(product);

    navigate("/checkout", {
      state: {
        product,
        unit,
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
    <div className="min-h-screen bg-slate-50 px-1 pb-28 pt-5 sm:px-6 lg:px-[120px] lg:pb-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-secondary">
                <BsCart4 className="text-2xl" />
              </span>

              <div>
                <h1 className="text-xl font-black text-slate-950 sm:text-2xl">
                  Your Cart
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Select one available item to checkout. Sale prices are applied
                  automatically when available.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <FiArrowLeft />
                Continue Shopping
              </button>

              <span className="inline-flex h-10 items-center rounded-lg bg-orange-50 px-4 text-sm font-black text-secondary">
                {items.length} {items.length === 1 ? "item" : "items"}
              </span>
            </div>
          </div>

          {unavailableCount > 0 && (
            <div className="mt-4 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <FiAlertCircle className="mt-0.5 shrink-0" />
              <p>
                {unavailableCount} item{unavailableCount > 1 ? "s are" : " is"}{" "}
                currently unavailable. You can keep them in your cart, but they
                cannot be checked out right now.
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-3">
            {items.map((item) => {
              const itemAvailable = isPurchasable(item);
              const shopOpen = isShopOpen(item);
              const isSelected = selectedItem === item.cart_item_id;
              const isOnSale = isItemOnSale(item);
              const originalPrice = getOriginalPrice(item);
              const unitPrice = getUnitPrice(item);
              const saleLabel = getSaleLabel(item);

              const qtyValue =
                item.unit_type === "kg"
                  ? Number(item.weight || 0)
                  : Number(item.quantity || 0);

              const subtotal = getItemAmount(item);
              const originalSubtotal = getItemOriginalAmount(item);

              return (
                <article
                  key={item.cart_item_id}
                  onClick={() => {
                    if (!itemAvailable) {
                      showToast({
                        type: "error",
                        message: getUnavailableText(item),
                        duration: 3500,
                      });
                      return;
                    }

                    setSelectedItem(item.cart_item_id);
                  }}
                  className={`relative rounded-lg border bg-white p-4 shadow-sm transition ${
                    itemAvailable
                      ? "cursor-pointer hover:shadow-md"
                      : "cursor-not-allowed opacity-90"
                  } ${
                    isSelected
                      ? "border-secondary/50 ring-2 ring-orange-100"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="grid gap-4 sm:grid-cols-[128px_minmax(0,1fr)]">
                    <div className="relative">
                      <div className="aspect-square overflow-hidden rounded-lg bg-slate-100">
                        <LazyLoadImage
                          src={item.image_path || "/placeholder.png"}
                          alt={item.name}
                          className={`h-full w-full object-cover ${
                            itemAvailable ? "" : "grayscale-[0.25]"
                          }`}
                        />
                      </div>

                      {isSelected && (
                        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                          <FiCheck />
                          Selected
                        </span>
                      )}

                      {!itemAvailable && (
                        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                          <FiClock />
                          Unavailable
                        </span>
                      )}

                      {isOnSale && !isSelected && itemAvailable && (
                        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                          <FiTag />
                          {saleLabel}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {itemAvailable ? (
                            <Link
                              to={`/reserve/${item.product_id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="group"
                            >
                              <h3 className="line-clamp-2 text-base font-black leading-snug text-slate-950 group-hover:text-secondary">
                                {item.name}
                              </h3>
                            </Link>
                          ) : (
                            <h3 className="line-clamp-2 text-base font-black leading-snug text-slate-500">
                              {item.name}
                            </h3>
                          )}

                          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                            <FaStore className="shrink-0" />
                            <span className="truncate">
                              {item.shop_name || "Store"}
                            </span>
                          </div>

                          {!itemAvailable && (
                            <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                              {getUnavailableText(item)}

                              {!shopOpen &&
                                item.shop_opens_at &&
                                item.shop_closes_at && (
                                  <span className="mt-1 block font-bold text-red-600">
                                    Hours: {formatTime(item.shop_opens_at)} -{" "}
                                    {formatTime(item.shop_closes_at)}
                                  </span>
                                )}
                            </div>
                          )}

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <p className="text-sm font-black text-secondary">
                              {formatPeso(unitPrice)} / {item.unit_type}
                            </p>

                            {isOnSale && (
                              <>
                                <p className="text-xs font-semibold text-slate-400 line-through">
                                  {formatPeso(originalPrice)}
                                </p>

                                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600">
                                  <FiTag />
                                  {saleLabel}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItem(item.cart_item_id);
                          }}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100"
                          title="Remove item"
                        >
                          <FiTrash2 />
                        </button>
                      </div>

                      <div className="mt-5 grid gap-4 border-t border-slate-100 pt-4 md:grid-cols-[1fr_auto] md:items-end">
                        <div>
                          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                            {item.unit_type === "kg" ? "Weight" : "Quantity"}
                          </p>

                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex h-10 items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                          >
                            <button
                              type="button"
                              disabled={!itemAvailable}
                              onClick={() =>
                                updateCart(
                                  item,
                                  item.unit_type === "kg"
                                    ? qtyValue - 0.5
                                    : qtyValue - 1,
                                )
                              }
                              className="flex h-10 w-10 items-center justify-center text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
                              aria-label="Decrease"
                            >
                              <FiMinus />
                            </button>

                            <span className="min-w-24 px-3 text-center text-sm font-black text-slate-800">
                              {getQtyLabel(item)}
                            </span>

                            <button
                              type="button"
                              disabled={!itemAvailable}
                              onClick={() =>
                                updateCart(
                                  item,
                                  item.unit_type === "kg"
                                    ? qtyValue + 0.5
                                    : qtyValue + 1,
                                )
                              }
                              className="flex h-10 w-10 items-center justify-center text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
                              aria-label="Increase"
                            >
                              <FiPlus />
                            </button>
                          </div>
                        </div>

                        <div className="rounded-lg bg-slate-50 px-4 py-3 md:min-w-44 md:text-right">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                            Subtotal
                          </p>

                          {isOnSale && (
                            <p className="mt-1 text-xs font-semibold text-slate-400 line-through">
                              {formatPeso(originalSubtotal)}
                            </p>
                          )}

                          <p className="mt-1 text-lg font-black text-slate-950">
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

          <aside className="hidden h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24 lg:block">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-secondary">
                <FiCreditCard />
              </span>

              <div>
                <h2 className="text-base font-black text-slate-950">
                  Order Summary
                </h2>
                <p className="text-xs text-slate-500">
                  Checkout selected available item only
                </p>
              </div>
            </div>

            {selectedCartItem ? (
              <>
                <div className="mt-5 rounded-lg border border-slate-200 p-3">
                  <div className="flex gap-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      <img
                        src={selectedCartItem.image_path || "/placeholder.png"}
                        alt={selectedCartItem.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-sm font-black text-slate-950">
                        {selectedCartItem.name}
                      </h3>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {selectedCartItem.shop_name}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <p className="text-sm font-black text-secondary">
                          {formatPeso(getUnitPrice(selectedCartItem))} /{" "}
                          {selectedCartItem.unit_type}
                        </p>

                        {isItemOnSale(selectedCartItem) && (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600">
                            {getSaleLabel(selectedCartItem)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Selected item</span>
                    <span className="font-bold text-slate-900">1</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount</span>
                    <span className="font-bold text-slate-900">
                      {getQtyLabel(selectedCartItem)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Unit price</span>
                    <span className="font-bold text-slate-900">
                      {formatPeso(getUnitPrice(selectedCartItem))}
                    </span>
                  </div>

                  {isItemOnSale(selectedCartItem) && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Original price</span>
                        <span className="font-bold text-slate-400 line-through">
                          {formatPeso(getOriginalPrice(selectedCartItem))}
                        </span>
                      </div>

                      <div className="flex justify-between rounded-lg bg-red-50 px-3 py-2">
                        <span className="font-bold text-red-600">Savings</span>
                        <span className="font-black text-red-600">
                          {formatPeso(savings)}
                        </span>
                      </div>
                    </>
                  )}

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
                  disabled={!isPurchasable(selectedCartItem)}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-3 text-sm font-black text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <FiShoppingBag />
                  Checkout Selected
                </button>
              </>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                Please select an available item.
              </p>
            )}
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white p-3 shadow-[0_-10px_30px_rgba(15,23,42,0.12)] lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-500">
              {selectedCartItem ? selectedCartItem.name : "No available item"}
            </p>

            <div className="flex items-center gap-2">
              <p className="text-lg font-black text-secondary">
                {formatPeso(total)}
              </p>

              {selectedCartItem && isItemOnSale(selectedCartItem) && (
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                  {getSaleLabel(selectedCartItem)}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCheckoutSelected}
            disabled={!selectedCartItem || !isPurchasable(selectedCartItem)}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-secondary px-5 py-3 text-sm font-black text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <FiShoppingBag />
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Cart;
