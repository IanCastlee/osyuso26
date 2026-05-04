import React, { useState } from "react";
import { icons } from "../../constant/icons";
import { useNavigate } from "react-router-dom";
import CustomerSidebar from "./CustomerSidebar";
import { useAuth } from "../../context/AuthContext";

function CustomerHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [openUserMenu, setOpenUserMenu] = useState(false);

  const {
    BsCart4,
    IoMdNotificationsOutline,
    CiShop,
    RxQuestionMarkCircled,
    PiShoppingCartSimpleFill,
    IoIosInformationCircleOutline,
    TbMenu2,
  } = icons;

  const navigate = useNavigate();

  //  AUTH
  const { user, logout } = useAuth();
  return (
    <>
      <header className="w-full bg-secondary text-white shadow-md">
        {/* TOP BAR → HIDDEN ON MOBILE */}
        <div className="hidden md:flex w-full px-16 h-10 justify-between items-center border-b border-white/10">
          <button
            onClick={() => navigate("/signup-seller")}
            className="flex items-center gap-1 hover:underline text-xs"
          >
            <CiShop className="text-[18px]" />
            Start Selling
          </button>

          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={() => navigate("/about")}
              className="flex items-center gap-1 hover:opacity-80"
            >
              <IoIosInformationCircleOutline />
              About
            </button>

            <span className="text-white/50">|</span>

            <button
              onClick={() => navigate("/faq")}
              className="flex items-center gap-1 hover:opacity-80"
            >
              <RxQuestionMarkCircled />
              FAQ
            </button>

            <span className="text-white/50">|</span>

            {/* AUTH SECTION */}
            {user ? (
              <div className="relative">
                <div className="flex items-center gap-1">
                  <icons.HiMiniUserCircle className="text-2xl" />
                  <button
                    onClick={() => setOpenUserMenu(!openUserMenu)}
                    className="flex items-center font-semibold hover:opacity-80"
                  >
                    {user?.fullname?.split(" ")[0] || "User"}{" "}
                    <icons.MdKeyboardArrowDown />
                  </button>
                </div>

                {openUserMenu && (
                  <div className="absolute right-0 mt-2 w-44 bg-white text-black rounded-md shadow-lg overflow-hidden z-50">
                    <button
                      onClick={() => {
                        navigate("/account");
                        setOpenUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      My Account
                    </button>

                    <button
                      onClick={() => {
                        logout();
                        navigate("/signin");
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button onClick={() => navigate("/signin")}>Sign In</button>
                <span className="text-white/50">|</span>
                <button
                  onClick={() => navigate("/signup")}
                  className="font-semibold"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>

        {/* MAIN HEADER */}
        <div className="w-full px-6 md:px-16 h-16 flex items-center justify-between">
          {/* LEFT → LOGO */}
          <h2
            onClick={() => navigate("/")}
            className="flex items-center font-bold text-xl md:text-[24px] tracking-wide cursor-pointer"
          >
            OSY <PiShoppingCartSimpleFill /> SO
          </h2>

          {/* RIGHT → MOBILE MENU */}
          <button
            onClick={() => setIsOpen(true)}
            className="md:hidden p-2 hover:bg-white/20 rounded-md"
          >
            <TbMenu2 className="text-2xl" />
          </button>

          {/* RIGHT → DESKTOP ACTIONS */}
          <div className="hidden md:flex items-center gap-4 text-xl">
            <button className="flex items-center text-xs gap-1 hover:bg-white/20 px-2 py-1 rounded-md">
              <CiShop className="text-[22px]" />
              View Markets
            </button>

            <button
              onClick={() => navigate("/notification")}
              className="p-2 rounded-full hover:bg-white/20 relative"
            >
              <IoMdNotificationsOutline />
              <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                3
              </span>
            </button>

            <button
              onClick={() => navigate("/cart")}
              className="p-2 rounded-full hover:bg-white/20 relative"
            >
              <BsCart4 />
              <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                2
              </span>
            </button>
          </div>
        </div>
      </header>

      <CustomerSidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

export default CustomerHeader;
