import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";

import { CiLocationOn, CiShop } from "react-icons/ci";
import { BsCartPlus } from "react-icons/bs";

import noShopLogo from "../../assets/icons/noShopLogo.png";

import useGetData from "../../hooks/useGetData";
import SingleSkeletonLoader from "../../reusable_components/SingleSkeletonLoader";
import NoData from "../../reusable_components/NoData";
import useFormSubmit from "../../hooks/useFormSubmit";
import { useToast } from "../../context/ToastContext";

function ReserveDetails() {
  const { productId } = useParams();
  const { showToast } = useToast();

  const [showDevModal, setShowDevModal] = useState(false);
  const [weight, setWeight] = useState(0.5);

  const { submit, loading: cartLoading } = useFormSubmit(
    "cart/add-to-cart.php",
    () => {
      showToast({
        type: "success",
        message: "Added to cart",
        duration: 5000,
      });

      setShowDevModal(false);
    },
  );

  const { data, loading } = useGetData(
    `reservation/reserve.php?product_id=${productId}`,
  );

  if (loading) return <SingleSkeletonLoader />;
  const product = data;
  if (!product) return <NoData text="Product Not Found" />;

  const total = weight * Number(product.price);

  const handleAddToCart = async () => {
    if (!product?.id) return;

    const formData = new FormData();
    formData.append("product_id", product.id);

    if (product.unit_type === "kg") {
      formData.append("weight", weight);
      formData.append("quantity", 0);
    } else {
      formData.append("quantity", 1);
      formData.append("weight", 0);
    }

    await submit(formData);
  };

  return (
    <div className="w-full bg-gray-100 px-0 lg:px-4 sm:px-10 lg:px-28 py-0 lg:py-5">
      {/* PRODUCT SECTION */}
      <div className="w-full bg-white shadow-sm flex flex-col lg:flex-row gap-5 lg:gap-8 p-2 lg:p-4 rounded-lg">
        {/* IMAGE */}
        <div className="w-full lg:w-[40%] h-[240px] sm:h-[320px] overflow-hidden bg-gray-100 rounded-md">
          <LazyLoadImage
            src={product.image_path || "/placeholder.png"}
            alt={product.name}
            effect="opacity"
            wrapperClassName="w-full h-full"
            className="w-full h-full object-cover"
          />
        </div>

        {/* DETAILS */}
        <div className="flex-1 flex flex-col px-1 lg:px-0 gap-3 lg:gap-4">
          {/* NAME */}
          <h1 className="text-base sm:text-xl md:text-2xl font-semibold text-primary leading-snug">
            {product.name}
          </h1>

          {/* PRICE BADGE */}
          <p className="text-lg sm:text-2xl md:text-3xl font-bold text-orange-700 bg-yellow-50 px-4 py-2 w-fit rounded-md border border-yellow-100">
            ₱{product.price} / {product.unit_type}
          </p>

          {/* DESCRIPTION */}
          <p className="text-[12px] sm:text-sm text-gray-600 leading-relaxed">
            {product.description}
          </p>

          {/* STOCK */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] sm:text-sm text-gray-500">Stock:</span>

            <span className="text-[12px] sm:text-sm font-semibold text-green-600">
              {product.stock}
            </span>
          </div>

          {/* WEIGHT */}
          <div className="flex items-center gap-3 mt-3">
            <span className="text-[12px] sm:text-sm font-medium">Weight:</span>

            <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
              <button
                onClick={() => setWeight(weight > 0.5 ? weight - 0.5 : 0.5)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 active:scale-95 transition text-sm"
              >
                -
              </button>

              <span className="px-4 text-[12px] sm:text-sm font-medium">
                {weight} kg
              </span>

              <button
                onClick={() => setWeight(weight + 0.5)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 active:scale-95 transition text-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* TOTAL */}
          <p className="text-sm sm:text-base md:text-lg font-semibold text-primary">
            Total:
            <span className="text-secondary ml-1 font-bold">
              ₱{total.toFixed(2)}
            </span>
          </p>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 mt-5 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => setShowDevModal(true)}
              className="px-5 py-2 text-[12px] lg:text-sm bg-secondary text-white rounded-md hover:opacity-90 active:scale-95 transition shadow-sm"
            >
              Buy Now
            </button>

            <button
              onClick={handleAddToCart}
              disabled={cartLoading || !product?.id}
              className="
                flex items-center gap-2
                px-5 py-2
                text-[12px] lg:text-sm
                border border-gray-300
                text-secondary
                rounded-md
                hover:bg-secondary hover:text-white
                active:scale-95
                transition
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <BsCartPlus />
              {cartLoading ? "Adding..." : "Add to Cart"}
            </button>
          </div>
        </div>
      </div>

      {/* SHOP SECTION */}
      <div className="w-full flex flex-col bg-white shadow-sm h-auto mt-3 p-3 lg:p-4 rounded-lg">
        <div className="w-full flex flex-col md:flex-row gap-4">
          {/* PROFILE */}
          <LazyLoadImage
            src={product.profile_picture || noShopLogo}
            alt={product.shop_name}
            effect="opacity"
            className="w-[70px] h-[70px] sm:w-[90px] sm:h-[90px] object-cover rounded-md"
          />

          <div className="flex w-full justify-between flex-col md:flex-row gap-4">
            {/* SHOP INFO */}
            <div className="flex flex-col">
              <h2 className="text-sm sm:text-base font-semibold text-primary">
                {product.shop_name}
              </h2>

              <span className="flex items-center gap-1 text-[11px] sm:text-xs text-secondary">
                <CiLocationOn />
                {product.address}
              </span>

              <button className="flex w-fit text-[11px] sm:text-xs mt-2 items-center gap-1 px-4 py-2 border border-gray-200 rounded-md text-secondary hover:bg-secondary hover:text-white transition">
                <CiShop className="text-sm" />
                View Shop
              </button>
            </div>

            {/* EXTRA INFO */}
            <div className="flex flex-col gap-2 text-[11px] sm:text-xs md:text-sm">
              <div className="flex gap-2 md:gap-5">
                <span className="text-secondary">Nearby:</span>
                <span className="text-orange-800">
                  {product.nearby_landmark || "N/A"}
                </span>
              </div>

              <div className="flex gap-2 md:gap-5">
                <span className="text-secondary">Phone:</span>
                <span className="text-orange-800">
                  {product.phone || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SHOP DESCRIPTION */}
        <div className="flex flex-col w-full mt-5">
          <h2 className="text-xs sm:text-sm text-primary font-semibold">
            Shop Description:
          </h2>

          <p className="text-[12px] sm:text-sm text-gray-600 leading-relaxed">
            {product.shop_description || "No description available"}
          </p>
        </div>
      </div>

      {/* MODAL */}
      {showDevModal && (
        <div
          onClick={() => setShowDevModal(false)}
          className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center px-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white rounded-lg p-6 shadow-xl"
          >
            <h2 className="text-lg font-semibold text-primary">Ih?</h2>

            <p className="text-sm text-gray-600 mt-2">
              Feature under development.
            </p>

            <div className="flex justify-end mt-5">
              <button
                onClick={() => setShowDevModal(false)}
                className="px-4 py-2 text-sm bg-secondary text-white rounded-md hover:opacity-90 transition"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReserveDetails;
