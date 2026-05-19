import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { BsCartPlus } from "react-icons/bs";
import { FiMinus, FiPlus } from "react-icons/fi";

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

  if (loading) return <SingleSkeletonLoader />;
  if (!data) return <NoData text="Product Not Found" />;

  const product = data;

  const stock = Number(product.stock || 0);
  const originalPrice = Number(product.original_price ?? product.price ?? 0);
  const finalPrice = Number(product.final_price ?? product.price ?? 0);
  const isOnSale =
    Number(product.is_on_sale) === 1 && finalPrice < originalPrice;

  const isKg = product.unit_type === "kg";
  const selectedAmount = isKg ? weight : quantity;
  const total = selectedAmount * finalPrice;
  const isOutOfStock = stock <= 0;

  const decrease = () => {
    if (isKg) {
      setWeight((w) => Math.max(0.5, Number((w - 0.5).toFixed(1))));
    } else {
      setQuantity((q) => Math.max(1, q - 1));
    }
  };

  const increase = () => {
    if (isKg) {
      setWeight((w) => Math.min(stock, Number((w + 0.5).toFixed(1))));
    } else {
      setQuantity((q) => Math.min(stock, q + 1));
    }
  };

  const handleAddToCart = async () => {
    if (!product?.id || isOutOfStock) return;

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
    if (isOutOfStock) return;

    navigate("/checkout", {
      state: {
        product: {
          ...product,
          price: finalPrice,
          original_price: originalPrice,
          final_price: finalPrice,
          is_on_sale: isOnSale ? 1 : 0,
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
              className="h-full w-full object-cover"
            />

            <span
              className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm ${
                isOutOfStock ? "bg-red-500" : "bg-emerald-500"
              }`}
            >
              {isOutOfStock ? "Sold Out" : `${stock} in stock`}
            </span>

            {isOnSale && (
              <span className="absolute right-3 top-3 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                {product.sale_label || "SALE"}
              </span>
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
          </div>

          <div className="grid flex-1 gap-5 py-5 lg:grid-cols-[1fr_260px]">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {isKg ? "Select Weight" : "Select Quantity"}
              </p>

              <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <button
                  onClick={decrease}
                  disabled={isOutOfStock}
                  className="flex h-11 w-11 items-center justify-center text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
                >
                  <FiMinus />
                </button>

                <span className="min-w-28 px-4 text-center text-sm font-semibold text-slate-900">
                  {isKg ? `${weight} kg` : `${quantity} pcs`}
                </span>

                <button
                  onClick={increase}
                  disabled={isOutOfStock || selectedAmount >= stock}
                  className="flex h-11 w-11 items-center justify-center text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
                >
                  <FiPlus />
                </button>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Available stock: {stock} {isKg ? "kg" : "pcs"}
              </p>
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
              onClick={handleAddToCart}
              disabled={cartLoading || isOutOfStock}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <BsCartPlus />
              {cartLoading ? "Adding..." : "Add to Cart"}
            </button>

            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className="rounded-xl bg-secondary px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>

      <ShopInfo product={product} />
    </div>
  );
}

export default ReserveDetails;
