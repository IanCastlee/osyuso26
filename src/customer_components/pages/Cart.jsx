import React, { useState } from "react";
import meatImage from "../../../../assets_osyuso/meatProduct.jpeg";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { BsCart4 } from "react-icons/bs";

function Cart() {
  const [items, setItems] = useState([
    {
      id: 1,
      name: "Premium Pork Belly",
      price: 280,
      weight: 1,
      seller: "Juan Meat Shop",
      image: meatImage,
    },
    {
      id: 2,
      name: "Fresh Chicken Breast",
      price: 220,
      weight: 0.5,
      seller: "Bulusan Poultry",
      image: meatImage,
    },
  ]);

  const updateWeight = (id, change) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, weight: Math.max(0.5, item.weight + change) }
          : item,
      ),
    );
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="w-full bg-gray-100 px-4 md:px-10 lg:px-28 py-4">
      {/* TITLE */}
      <h1 className="flex items-center gap-2 text-xl md:text-2xl font-bold text-primary mb-4 md:mb-6">
        <BsCart4 /> Your Cart
      </h1>

      {/* CART ITEMS */}
      <div className="flex flex-col gap-4">
        {items.map((item) => {
          const subtotal = item.price * item.weight;

          return (
            <div
              key={item.id}
              className="bg-white rounded-md shadow-sm hover:shadow-md transition p-3 md:p-4 flex flex-col md:flex-row gap-4"
            >
              {/* IMAGE */}
              <div className="w-full md:w-[120px] h-[180px] md:h-[120px] overflow-hidden rounded-lg">
                <LazyLoadImage
                  src={item.image}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* DETAILS */}
              <div className="flex-1 flex flex-col justify-between gap-3">
                {/* NAME + PRICE */}
                <div>
                  <h3 className="font-semibold text-sm md:text-base text-primary">
                    {item.name}
                  </h3>

                  <p className="text-xs text-gray-500">Seller: {item.seller}</p>

                  <p className="text-secondary font-bold mt-1 text-sm md:text-base">
                    ₱{item.price} / kg
                  </p>
                </div>

                {/* WEIGHT + SUBTOTAL */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  {/* WEIGHT CONTROL */}
                  <div className="flex items-center border border-gray-200 rounded-md overflow-hidden w-fit">
                    <button
                      onClick={() => updateWeight(item.id, -0.5)}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200"
                    >
                      -
                    </button>

                    <span className="px-4 text-xs md:text-sm">
                      {item.weight} kg
                    </span>

                    <button
                      onClick={() => updateWeight(item.id, 0.5)}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200"
                    >
                      +
                    </button>
                  </div>

                  {/* SUBTOTAL */}
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-gray-500">Subtotal</p>
                    <p className="font-bold text-primary text-sm md:text-base">
                      ₱{subtotal}
                    </p>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex flex-col sm:flex-row justify-end gap-2 mt-2">
                  {/* REMOVE */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="w-full sm:w-auto text-xs px-4 py-2 border border-secondary text-secondary hover:bg-secondary hover:text-white transition rounded-md"
                  >
                    Remove
                  </button>

                  {/* BUY NOW */}
                  <button className="w-full sm:w-auto text-xs px-4 py-2 bg-secondary text-white hover:opacity-90 transition rounded-md">
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Cart;
