import React, { useState } from "react";
import { icons } from "../../constant/icons";
import { useNavigate } from "react-router-dom";
import CustomerSidebar from "./CustomerSidebar";
import { useAuth } from "../../context/AuthContext";

function CustomerHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [openUserMenu, setOpenUserMenu] = useState(false);

  const {
    IoMdNotificationsOutline,
    CiShop,
    RxQuestionMarkCircled,
    PiShoppingCartSimpleFill,
    PiShoppingCartSimpleLight,
    IoIosInformationCircleOutline,
    TbMenu2,
    HiMiniUserCircle,
    MdKeyboardArrowDown,
    GoChecklist,
  } = icons;

  const SearchIcon = icons.IoSearchOutline || icons.CiSearch || icons.FiSearch;

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <>
      <header className="w-full sticky top-0 z-20 bg-secondary text-white shadow-md">
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

            {user ? (
              <div className="relative">
                <div className="flex items-center gap-1">
                  <HiMiniUserCircle className="text-2xl" />
                  <button
                    onClick={() => setOpenUserMenu(!openUserMenu)}
                    className="flex items-center font-semibold hover:opacity-80"
                  >
                    {user?.fullname?.split(" ")[0] || "User"}
                    <MdKeyboardArrowDown />
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

        <div className="w-full px-6 md:px-16 h-16 flex items-center gap-5">
          <h2
            onClick={() => navigate("/")}
            className="shrink-0 flex items-center font-bold lg:text-2xl md:text-[24px] tracking-wide cursor-pointer"
          >
            OSY <PiShoppingCartSimpleFill /> SO
          </h2>

          <div className="hidden md:flex flex-1 px-5">
            <div className="flex w-full overflow-hidden rounded-sm bg-white p-1 shadow-sm">
              <input
                type="text"
                placeholder="Search products, shops, or markets"
                className="min-w-0 flex-1 bg-white px-4 py-1 text-sm text-gray-800 placeholder:text-gray-400 outline-none"
              />

              <button
                type="button"
                className="flex w-16 items-center justify-center rounded-sm bg-orange-500 text-white transition hover:opacity-90"
              >
                <icons.IoSearchOutline className="text-xl" />
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="ml-auto md:hidden p-2 hover:bg-white/20 rounded-md"
          >
            <TbMenu2 className="text-2xl" />
          </button>

          <div className="hidden md:flex shrink-0 items-center gap-3">
            <button className="flex items-center gap-1 rounded-full px-3 py-2 text-xs hover:bg-white/20">
              <CiShop className="text-[22px]" />
              <span>View Markets</span>
            </button>

            <button
              onClick={() => navigate("/notification")}
              className="flex items-center gap-2 rounded-full px-3 py-2 hover:bg-white/20"
            >
              <span className="relative inline-flex">
                <IoMdNotificationsOutline className="text-xl" />
                <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
                  3
                </span>
              </span>

              <span className="text-xs">Notification</span>
            </button>

            {user && (
              <>
                <button
                  onClick={() => navigate("/cart")}
                  className="flex items-center gap-2 rounded-full px-3 py-2 hover:bg-white/20"
                >
                  <span className="relative inline-flex">
                    <PiShoppingCartSimpleLight className="text-xl" />
                    <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
                      2
                    </span>
                  </span>

                  <span className="text-xs">Cart</span>
                </button>

                <button
                  onClick={() => navigate("/orders")}
                  className="flex items-center gap-2 rounded-full px-3 py-2 hover:bg-white/20"
                >
                  <span className="relative inline-flex">
                    <GoChecklist className="text-xl" />
                    <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
                      2
                    </span>
                  </span>

                  <span className="text-xs">Orders</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <CustomerSidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

export default CustomerHeader;
