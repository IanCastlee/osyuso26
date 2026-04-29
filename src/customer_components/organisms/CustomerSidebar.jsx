import React from "react";
import { icons } from "../../constant/icons";
import { useNavigate } from "react-router-dom";

function CustomerSidebar({ isOpen, onClose }) {
  const {
    BsCart4,
    IoMdNotificationsOutline,
    CiShop,
    RxQuestionMarkCircled,
    IoIosInformationCircleOutline,
    PiShoppingCartSimpleFill,
    RiHomeLine,
  } = icons;

  const navigate = useNavigate();

  const go = (path) => {
    navigate(path);
    onClose(); // ✅ closes when clicking menu item
  };

  return (
    <>
      {/* OVERLAY */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300
        ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
      />

      {/* SIDEBAR */}
      <div
        className={`fixed top-0 left-0 h-full w-[260px] bg-secondary text-white z-50 shadow-xl transform transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* HEADER */}
        <div className="h-[70px] flex items-center px-6 font-bold text-xl border-b border-white/10">
          OSY <PiShoppingCartSimpleFill /> SO
        </div>

        {/* CONTENT */}
        <div className="flex flex-col p-4 gap-2 text-sm">
          <button
            onClick={() => go("/")}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-white/10 transition"
          >
            <RiHomeLine /> Home
          </button>

          <button
            onClick={() => go("/market")}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-white/10 transition"
          >
            <CiShop /> Markets
          </button>

          <button
            onClick={() => go("/cart")}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-white/10 transition"
          >
            <BsCart4 /> Cart
          </button>

          <button
            onClick={() => go("/notification")}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-white/10 transition"
          >
            <IoMdNotificationsOutline /> Notifications
          </button>

          <div className="border-t border-white/10 my-2"></div>

          <button
            onClick={() => go("/about")}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-white/10 transition"
          >
            <IoIosInformationCircleOutline /> About
          </button>

          <button
            onClick={() => go("/faq")}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-white/10 transition"
          >
            <RxQuestionMarkCircled /> FAQ
          </button>

          <div className="border-t border-white/10 my-2"></div>

          <button
            onClick={() => go("/signup-seller")}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-white/10 transition"
          >
            <CiShop /> Start Selling
          </button>

          <div className="border-t border-white/10 my-2"></div>

          <button
            onClick={() => go("/signin")}
            className="p-2 text-left rounded-md hover:bg-white/10 transition"
          >
            Sign In
          </button>

          <button
            onClick={() => go("/signup")}
            className="p-2 text-left bg-white text-secondary font-semibold rounded-md hover:bg-gray-100 transition"
          >
            Sign Up
          </button>
        </div>
      </div>
    </>
  );
}

export default CustomerSidebar;
