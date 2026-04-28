import React from "react";
import { icons } from "../../constant/icons";
import { useNavigate } from "react-router-dom";

function CustomerHeader() {
  const {
    BsCart4,
    IoMdNotificationsOutline,
    CiShop,
    RxQuestionMarkCircled,
    PiShoppingCartSimpleFill,
    IoIosInformationCircleOutline,
  } = icons;

  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/cart");
  };
  const handleNotificationClick = () => {
    navigate("/notification");
  };
  const handleFaqClick = () => {
    navigate("/faq");
  };
  const handleHomeClick = () => {
    navigate("/");
  };

  const handleSignUpClick = () => {
    navigate("/signup");
  };
  const handleSignInClick = () => {
    navigate("/signin");
  };

  const handleSignUpSellerClick = () => {
    navigate("/signup-seller");
  };

  const handleAboutClick = () => {
    navigate("/about");
  };
  return (
    <header className="w-full bg-secondary text-white shadow-md">
      {/* TOP BAR (help + auth) */}
      <div className="w-full px-6 md:px-16 h-10 flex justify-between items-center border-b border-white/10">
        <button
          onClick={handleSignUpSellerClick}
          className="flex items-center gap-1 hover:underline text-xs"
        >
          <CiShop className="text-[18px]" />
          Start Selling
        </button>

        {/* AUTH (xs only) */}
        <div className="flex items-center gap-3 text-xs">
          {/* about us */}
          <button
            onClick={handleAboutClick}
            className="flex items-center gap-1 text-xs hover:opacity-80 transition"
            title="FAQ"
          >
            <IoIosInformationCircleOutline className="text-sm" />
            About Us
          </button>
          <span className="text-white/50">|</span>

          {/* FAQ */}
          <button
            onClick={handleFaqClick}
            className="flex items-center gap-1 text-xs hover:opacity-80 transition"
            title="FAQ"
          >
            <RxQuestionMarkCircled className="text-sm" />
            FAQ
          </button>
          <span className="text-white/50">|</span>

          <button onClick={handleSignInClick} className="hover:underline">
            Sign In
          </button>
          <span className="text-white/50">|</span>
          <button
            onClick={handleSignUpClick}
            className="font-semibold hover:underline"
          >
            Sign Up
          </button>
        </div>
      </div>

      {/* MAIN HEADER */}
      <div className="w-full px-6 md:px-16 h-16 flex items-center justify-between">
        {/* LOGO */}
        <h2
          onClick={handleHomeClick}
          className="flex items-center font-bold text-2xl md:text-[24px] tracking-wide"
        >
          OSY
          <PiShoppingCartSimpleFill />
          SO
        </h2>

        {/* ACTIONS */}
        <div className="flex items-center gap-3 md:gap-4 text-xl">
          {/* Shop */}
          <button className="flex items-center text-xs gap-1 rounded-full hover:bg-white/20 transition">
            <CiShop className="text-[24px]" />
            View Markets
          </button>

          {/* Notifications */}
          <button
            onClick={handleNotificationClick}
            className="p-2 rounded-full hover:bg-white/20 transition relative"
          >
            <IoMdNotificationsOutline />
            <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
              3
            </span>
          </button>

          {/* Cart */}
          <button
            onClick={handleClick}
            className="p-2 rounded-full hover:bg-white/20 transition relative"
          >
            <BsCart4 />
            <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
              2
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default CustomerHeader;
