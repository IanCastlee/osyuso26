import React, { useEffect, useRef, useState } from "react";
import { icons } from "../../constant/icons";
import { useNavigate } from "react-router-dom";
import CustomerSidebar from "./CustomerSidebar";
import { useAuth } from "../../context/AuthContext";
import useNotificationStore from "../../store/useNotificationStore";
import useCartStore from "../../store/useCartStore";
import useOrderStore from "../../store/useOrderStore";

function CustomerHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [navSearch, setNavSearch] = useState("");

  const navigate = useNavigate();
  const userMenuRef = useRef(null);

  const {
    IoMdNotificationsOutline,
    CiShop,
    LuCircleUserRound,
    FiLogOut,
    RxQuestionMarkCircled,
    PiShoppingCartSimpleFill,
    PiShoppingCartSimpleLight,
    IoIosInformationCircleOutline,
    TbMenu2,
    HiMiniUserCircle,
    MdKeyboardArrowDown,
    GoChecklist,
    PiPhoneThin,
  } = icons;

  const SearchIcon = icons.IoSearchOutline || icons.CiSearch || icons.FiSearch;
  const { user, logout } = useAuth();

  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const fetchUnreadCount = useNotificationStore(
    (state) => state.fetchUnreadCount,
  );
  const clearUnread = useNotificationStore((state) => state.clearUnread);

  const cartCount = useCartStore((state) => state.cartCount);
  const fetchCartCount = useCartStore((state) => state.fetchCartCount);
  const clearCartCount = useCartStore((state) => state.clearCartCount);

  const orderCount = useOrderStore((state) => state.orderCount);
  const fetchOrderCount = useOrderStore((state) => state.fetchOrderCount);
  const clearOrderCount = useOrderStore((state) => state.clearOrderCount);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setOpenUserMenu(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpenUserMenu(false);
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      clearUnread();
      clearCartCount();
      clearOrderCount();
      return;
    }

    fetchUnreadCount({ force: true });
    fetchCartCount({ force: true });
    fetchOrderCount({ force: true });

    const handleFocus = () => {
      fetchUnreadCount();
      fetchCartCount();
      fetchOrderCount();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchUnreadCount();
        fetchCartCount();
        fetchOrderCount();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    user,
    fetchUnreadCount,
    fetchCartCount,
    fetchOrderCount,
    clearUnread,
    clearCartCount,
    clearOrderCount,
  ]);

  const handleNavbarSearch = (e) => {
    e.preventDefault();

    const keyword = navSearch.trim();
    if (!keyword) return;

    navigate(`/search?q=${encodeURIComponent(keyword)}`);
  };

  const handleLogout = () => {
    clearUnread();
    clearCartCount();
    clearOrderCount();
    logout();
    setOpenUserMenu(false);
    navigate("/signin");
  };

  const BadgeIconButton = ({ icon: Icon, label, count = 0, onClick }) => {
    const safeCount = Number(count || 0);
    const displayCount = safeCount > 99 ? "99+" : safeCount;

    return (
      <button
        onClick={onClick}
        className="group inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-white/90 transition hover:bg-white/10 cursor-pointer hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40"
        aria-label={label}
      >
        <span className="relative inline-flex">
          <Icon className="text-[22px]" />

          {safeCount > 0 && (
            <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-orange-500">
              {displayCount}
            </span>
          )}
        </span>

        <span className="hidden xl:inline">{label}</span>
      </button>
    );
  };

  const mobileMenuCount =
    Number(unreadCount || 0) + Number(cartCount || 0) + Number(orderCount || 0);

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-orange-500 text-white shadow-[0_8px_24px_rgba(15,23,42,0.18)]">
        <div className="hidden h-10 items-center justify-between border-b border-white/15 px-8 lg:flex lg:px-16">
          <button
            onClick={() => navigate("/signup-seller")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-white/85 transition cursor-pointer hover:text-white"
          >
            <CiShop className="text-lg" />
            Start Selling
          </button>

          <div className="flex items-center gap-4 text-xs font-semibold text-white/85">
            <button
              onClick={() =>
                window.open("/contact", "_blank", "noopener,noreferrer")
              }
              className="inline-flex items-center gap-1.5 transition cursor-pointer hover:text-white"
            >
              <PiPhoneThin className="text-base" />
              Contact
            </button>
            <button
              onClick={() =>
                window.open("/about", "_blank", "noopener,noreferrer")
              }
              className="inline-flex items-center gap-1.5 transition cursor-pointer hover:text-white"
            >
              <IoIosInformationCircleOutline className="text-base" />
              About
            </button>

            <button
              onClick={() =>
                window.open("/faq", "_blank", "noopener,noreferrer")
              }
              className="inline-flex items-center gap-1.5 transition cursor-pointer hover:text-white"
            >
              <RxQuestionMarkCircled className="text-base" />
              FAQ
            </button>

            <span className="h-4 w-px bg-white/25" />

            {user ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setOpenUserMenu((value) => !value)}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-full py-1 pl-1 pr-2 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
                >
                  <HiMiniUserCircle className="text-2xl" />

                  <span className="max-w-32 truncate font-semibold">
                    {user?.fullname?.split(" ")[0] || "User"}
                  </span>

                  <MdKeyboardArrowDown
                    className={`text-base transition ${openUserMenu ? "rotate-180" : ""}`}
                  />
                </button>

                {openUserMenu && (
                  <div className="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white text-sm shadow-xl shadow-slate-900/10">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Signed in as
                      </p>

                      <p className="mt-1 truncate text-sm font-bold text-slate-900">
                        {user?.fullname || "User"}
                      </p>

                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {user?.email || "No email"}
                      </p>
                    </div>

                    <div className="p-1.5">
                      <button
                        onClick={() => {
                          navigate("/account");
                          setOpenUserMenu(false);
                        }}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                          <LuCircleUserRound className="text-lg" />
                        </span>

                        <span>
                          <span className="block text-sm font-semibold">
                            My Account
                          </span>
                          <span className="block text-xs text-slate-500">
                            View profile settings
                          </span>
                        </span>
                      </button>

                      <button
                        onClick={handleLogout}
                        className="mt-1 flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left font-medium text-red-600 transition hover:bg-red-50"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
                          <FiLogOut className="text-lg" />
                        </span>

                        <span>
                          <span className="block cursor-pointer text-sm font-semibold">
                            Logout
                          </span>
                          <span className="block text-xs cursor-pointer text-red-400">
                            End current session
                          </span>
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/signin")}
                  className="transition hover:text-white cursor-pointer"
                >
                  Sign In
                </button>

                <button
                  onClick={() => navigate("/signup")}
                  className="rounded-full cursor-pointer bg-white px-4 py-1.5 font-bold text-orange-500 transition hover:bg-orange-50"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex min-h-16 w-full items-center gap-3 px-4 py-3 md:px-8 lg:px-16">
          <button
            onClick={() => navigate("/")}
            className="flex shrink-0 items-center cursor-pointer gap-1 text-xl font-black tracking-wide transition hover:opacity-90 md:text-2xl"
          >
            OSY
            <PiShoppingCartSimpleFill className="text-white" />
            SO
          </button>

          <form
            onSubmit={handleNavbarSearch}
            className="hidden flex-1 md:block px-6"
          >
            <div className="flex h-9 overflow-hidden rounded-full bg-white p-1 shadow-sm ring-1 ring-white/20 focus-within:ring-2 focus-within:ring-white/70">
              <input
                type="text"
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                placeholder="Search products or markets"
                className="min-w-0 flex-1 bg-transparent px-5 text-sm text-slate-800 placeholder:text-slate-400 outline-none"
              />

              <button
                type="submit"
                className="flex cursor-pointer h-7 w-14 items-center justify-center rounded-full bg-orange-500 text-white transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300"
                aria-label="Search"
              >
                {SearchIcon && <SearchIcon className="text-lg" />}
              </button>
            </div>
          </form>

          <div className="ml-auto hidden shrink-0 items-center gap-1 md:flex">
            <BadgeIconButton
              icon={CiShop}
              label="Markets"
              count={0}
              onClick={() => navigate("/all-markets")}
            />

            {user && (
              <BadgeIconButton
                icon={IoMdNotificationsOutline}
                label="Notifications"
                count={unreadCount}
                onClick={() => navigate("/notification")}
              />
            )}

            {user && (
              <>
                <BadgeIconButton
                  icon={PiShoppingCartSimpleLight}
                  label="Cart"
                  count={cartCount}
                  onClick={() => navigate("/cart")}
                />

                <BadgeIconButton
                  icon={GoChecklist}
                  label="Orders"
                  count={orderCount}
                  onClick={() => navigate("/orders")}
                />
              </>
            )}
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="relative ml-auto rounded-full p-2 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 md:hidden"
            aria-label="Open menu"
          >
            <TbMenu2 className="text-2xl" />

            {user && mobileMenuCount > 0 && (
              <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-orange-500">
                {mobileMenuCount > 99 ? "99+" : mobileMenuCount}
              </span>
            )}
          </button>
        </div>

        <form onSubmit={handleNavbarSearch} className="px-4 pb-3 md:hidden">
          <div className="flex h-9 overflow-hidden rounded-full bg-white p-1 shadow-sm">
            <input
              type="text"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder="Search products or markets"
              className="min-w-0 flex-1 bg-transparent px-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none"
            />

            <button
              type="submit"
              className="flex h-7 w-12 items-center justify-center rounded-full bg-orange-500 text-white"
              aria-label="Search"
            >
              {SearchIcon && <SearchIcon className="text-lg" />}
            </button>
          </div>
        </form>
      </header>

      <CustomerSidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

export default CustomerHeader;
