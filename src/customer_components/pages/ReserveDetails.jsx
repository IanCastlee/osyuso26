import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { BsCartPlus } from "react-icons/bs";
import { FiAlertCircle, FiClock, FiMinus, FiPlus } from "react-icons/fi";

import useGetData from "../../hooks/useGetData";
import SingleSkeletonLoader from "../../reusable_components/SingleSkeletonLoader";
import NoData from "../../reusable_components/NoData";
import useFormSubmit from "../../hooks/useFormSubmit";
import { useToast } from "../../context/ToastContext";
import ShopInfo from "../organisms/ShopInfo";

function ReserveDetails() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { showToast } = useToast();

  const [weight, setWeight] = useState(0.5);
  const [quantity, setQuantity] = useState(1);

  const { data, loading } = useGetData(
    `reservation/reserve.php?product_id=${productId}`,
  );

  const { submit, loading: cartLoading } = useFormSubmit(
    "cart/add-to-cart.php",
    () => {
      showToast({
        type: "success",
        message: "Added to cart",
        duration: 5000,
      });
    },
  );

  const product = data || {};

  const toBoolean = (value) => {
    return value === true || value === 1 || value === "1" || value === "true";
  };

  const formatTime = (value) => {
    if (!value) return null;
    return String(value).slice(0, 5);
  };

  const formatKg = (value) => {
    const number = Number(value || 0);

    return number.toLocaleString("en-PH", {
      minimumFractionDigits: Number.isInteger(number) ? 0 : 2,
      maximumFractionDigits: 2,
    });
  };

  const normalizeAmount = (value) => {
    return Number(Number(value || 0).toFixed(2));
  };

  const stock = Number(product.stock || 0);
  const originalPrice = Number(product.original_price ?? product.price ?? 0);
  const finalPrice = Number(product.final_price ?? product.price ?? 0);
  const isOnSale =
    Number(product.is_on_sale) === 1 && finalPrice < originalPrice;

  const isKg = product.unit_type === "kg";

  const minOrder = isKg
    ? Number(product.min_order ?? product.kg_min_order ?? 0.5)
    : 1;

  const orderStep = isKg
    ? Number(product.order_step ?? product.kg_order_step ?? minOrder)
    : 1;

  const isHighPriceKg = toBoolean(product.is_high_price_kg);
  const selectedAmount = isKg ? weight : quantity;
  const total = selectedAmount * finalPrice;
  const isOutOfStock = stock <= 0;
  const hasEnoughMinimum = !isKg || stock >= minOrder;
  const isShopOpen = toBoolean(product.is_shop_open ?? 1);
  const isPurchasable = toBoolean(product.is_purchasable ?? 1);

  const canOrder =
    !isOutOfStock && hasEnoughMinimum && isShopOpen && isPurchasable;

  const unavailableMessage =
    product.unavailable_reason ||
    product.shop_closed_message ||
    (!hasEnoughMinimum
      ? `Minimum order is ${formatKg(minOrder)} kg, but available stock is only ${formatKg(stock)} kg.`
      : "This product is not available right now.");

  const canIncrease = canOrder
    ? isKg
      ? normalizeAmount(weight + orderStep) <= stock
      : quantity < stock
    : false;

  useEffect(() => {
    if (!data?.id) return;

    if (data.unit_type === "kg") {
      const nextMin = Number(data.min_order ?? data.kg_min_order ?? 0.5);
      setWeight(normalizeAmount(nextMin));
      setQuantity(1);
      return;
    }

    setQuantity(1);
    setWeight(0.5);
  }, [data?.id, data?.unit_type, data?.min_order, data?.kg_min_order]);

  if (loading) return <SingleSkeletonLoader />;
  if (!data) return <NoData text="Product Not Found" />;

  const decrease = () => {
    if (!canOrder) return;

    if (isKg) {
      setWeight((current) =>
        Math.max(minOrder, normalizeAmount(current - orderStep)),
      );
    } else {
      setQuantity((current) => Math.max(1, current - 1));
    }
  };

  const increase = () => {
    if (!canIncrease) return;

    if (isKg) {
      setWeight((current) =>
        Math.min(stock, normalizeAmount(current + orderStep)),
      );
    } else {
      setQuantity((current) => Math.min(stock, current + 1));
    }
  };

  const handleAddToCart = async () => {
    if (!product?.id || !canOrder) {
      showToast({
        type: "error",
        message: unavailableMessage,
        duration: 4000,
      });
      return;
    }

    const formData = new FormData();
    formData.append("product_id", product.id);

    if (isKg) {
      formData.append("weight", weight);
      formData.append("quantity", 0);
    } else {
      formData.append("quantity", quantity);
      formData.append("weight", 0);
    }

    await submit(formData);
  };

  const handleBuyNow = () => {
    if (!canOrder) {
      showToast({
        type: "error",
        message: unavailableMessage,
        duration: 4000,
      });
      return;
    }

    navigate("/checkout", {
      state: {
        product: {
          ...product,
          price: finalPrice,
          original_price: originalPrice,
          final_price: finalPrice,
          is_on_sale: isOnSale ? 1 : 0,
          min_order: minOrder,
          order_step: orderStep,
        },
        unit: product.unit_type,
        quantity,
        weight,
        unitPrice: finalPrice,
        total,
      },
    });
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 px-3 py-4 md:px-8 lg:px-28">
      <div className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5 lg:grid-cols-[420px_1fr]">
        <div className="overflow-hidden rounded-2xl bg-slate-100">
          <div className="relative aspect-square w-full">
            <LazyLoadImage
              src={product.image_path || "/placeholder.png"}
              alt={product.name}
              effect="opacity"
              wrapperClassName="h-full w-full block"
              className={`h-full w-full object-cover ${
                !canOrder ? "grayscale-[0.25]" : ""
              }`}
            />

            <span
              className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm ${
                isOutOfStock || !hasEnoughMinimum
                  ? "bg-red-500"
                  : !isShopOpen
                    ? "bg-slate-900"
                    : "bg-emerald-500"
              }`}
            >
              {isOutOfStock || !hasEnoughMinimum
                ? "Sold Out"
                : !isShopOpen
                  ? "Shop Closed"
                  : `${formatKg(stock)} ${isKg ? "kg" : "pcs"} in stock`}
            </span>

            {isOnSale && canOrder && (
              <span className="absolute right-3 top-3 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                {product.sale_label || "SALE"}
              </span>
            )}

            {!canOrder && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/55 px-5 text-center backdrop-blur-[1px]">
                <div>
                  <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white">
                    <FiClock />
                  </div>

                  <p className="mt-2 text-sm font-black text-white">
                    {!isShopOpen ? "Shop is closed" : "Product unavailable"}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/80">
                    {unavailableMessage}
                  </p>

                  {!isShopOpen &&
                    product.shop_opens_at &&
                    product.shop_closes_at && (
                      <p className="mt-2 text-[11px] font-bold text-white/75">
                        Hours: {formatTime(product.shop_opens_at)} -{" "}
                        {formatTime(product.shop_closes_at)}
                      </p>
                    )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="border-b border-slate-100 pb-5">
            <h1 className="text-xl font-bold leading-tight text-slate-950 md:text-2xl">
              {product.name}
            </h1>

            <div className="mt-3">
              {isOnSale ? (
                <>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-slate-400 line-through">
                      ₱{originalPrice.toFixed(2)}
                    </p>

                    <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-600">
                      {product.sale_label || "SALE"}
                    </span>
                  </div>

                  <p className="mt-1 text-3xl font-bold text-orange-500 md:text-4xl">
                    ₱{finalPrice.toFixed(2)}
                    <span className="ml-1 text-sm font-medium text-slate-500">
                      / {product.unit_type}
                    </span>
                  </p>
                </>
              ) : (
                <p className="text-3xl font-bold text-secondary md:text-4xl">
                  ₱{originalPrice.toFixed(2)}
                  <span className="ml-1 text-sm font-medium text-slate-500">
                    / {product.unit_type}
                  </span>
                </p>
              )}
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-600">
              {product.description || "No description available."}
            </p>

            {isKg && (
              <div className="mt-4 rounded-xl border border-orange-100 bg-orange-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-orange-500">
                  Weight Rule
                </p>

                <p className="mt-1 text-sm font-semibold text-orange-800">
                  Minimum: {formatKg(minOrder)} kg • Increment:{" "}
                  {formatKg(orderStep)} kg
                </p>

                {isHighPriceKg && (
                  <p className="mt-1 text-xs text-orange-700/80">
                    Quarter-kilo ordering is enabled because this item is a high
                    price per kilo product.
                  </p>
                )}
              </div>
            )}

            {!canOrder && (
              <div className="mt-4 flex gap-3 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                <FiAlertCircle className="mt-0.5 shrink-0" />

                <div>
                  <p className="font-semibold">{unavailableMessage}</p>

                  {!isShopOpen &&
                    product.shop_opens_at &&
                    product.shop_closes_at && (
                      <p className="mt-1 text-xs font-bold">
                        Hours: {formatTime(product.shop_opens_at)} -{" "}
                        {formatTime(product.shop_closes_at)}
                      </p>
                    )}
                </div>
              </div>
            )}
          </div>

          <div className="grid flex-1 gap-5 py-5 lg:grid-cols-[1fr_260px]">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {isKg ? "Select Weight" : "Select Quantity"}
              </p>

              <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <button
                  type="button"
                  onClick={decrease}
                  disabled={!canOrder || selectedAmount <= minOrder}
                  className="flex h-11 w-11 items-center justify-center text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiMinus />
                </button>

                <span className="min-w-28 px-4 text-center text-sm font-semibold text-slate-900">
                  {isKg ? `${formatKg(weight)} kg` : `${quantity} pcs`}
                </span>

                <button
                  type="button"
                  onClick={increase}
                  disabled={!canIncrease}
                  className="flex h-11 w-11 items-center justify-center text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiPlus />
                </button>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Available stock: {formatKg(stock)} {isKg ? "kg" : "pcs"}
              </p>

              {isKg && (
                <p className="mt-1 text-xs text-slate-500">
                  Starts at {formatKg(minOrder)} kg, then adds{" "}
                  {formatKg(orderStep)} kg each tap.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Order Total
              </p>

              <p className="mt-2 text-2xl font-bold text-secondary">
                ₱{total.toFixed(2)}
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Final payment will be processed securely during checkout.
              </p>
            </div>
          </div>

          <div className="mt-auto flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={cartLoading || !canOrder}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <BsCartPlus />
              {cartLoading
                ? "Adding..."
                : !isShopOpen
                  ? "Shop Closed"
                  : "Add to Cart"}
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={!canOrder}
              className="cursor-pointer rounded-xl bg-secondary px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {!isShopOpen ? "Shop Closed" : "Buy Now"}
            </button>
          </div>
        </div>
      </div>

      <ShopInfo product={product} />
    </div>
  );
}

export default ReserveDetails;
