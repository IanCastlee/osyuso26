import React, { useEffect, useRef, useState } from "react";
import { icons } from "../../constant/icons";
import { useNavigate } from "react-router-dom";
import CustomerSidebar from "./CustomerSidebar";
import { useAuth } from "../../context/AuthContext";

function CustomerHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [navSearch, setNavSearch] = useState("");

  const navigate = useNavigate();
  const userMenuRef = useRef(null);

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
  const { user, logout } = useAuth();

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

  const handleNavbarSearch = (e) => {
    e.preventDefault();

    const keyword = navSearch.trim();
    if (!keyword) return;

    navigate(`/search?q=${encodeURIComponent(keyword)}`);
  };

  const handleLogout = () => {
    logout();
    setOpenUserMenu(false);
    navigate("/signin");
  };

  const BadgeIconButton = ({ icon: Icon, label, count, onClick }) => (
    <button
      onClick={onClick}
      className="group inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-white/90 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40"
      aria-label={label}
    >
      <span className="relative inline-flex">
        <Icon className="text-[22px]" />

        {count > 0 && (
          <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-orange-500">
            {count}
          </span>
        )}
      </span>

      <span className="hidden xl:inline">{label}</span>
    </button>
  );

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-orange-500 text-white shadow-[0_8px_24px_rgba(15,23,42,0.18)]">
        <div className="hidden h-10 items-center justify-between border-b border-white/15 px-8 lg:flex lg:px-16">
          <button
            onClick={() => navigate("/signup-seller")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-white/85 transition hover:text-white"
          >
            <CiShop className="text-lg" />
            Start Selling
          </button>

          <div className="flex items-center gap-4 text-xs font-semibold text-white/85">
            <button
              onClick={() => navigate("/about")}
              className="inline-flex items-center gap-1.5 transition hover:text-white"
            >
              <IoIosInformationCircleOutline className="text-base" />
              About
            </button>

            <button
              onClick={() => navigate("/faq")}
              className="inline-flex items-center gap-1.5 transition hover:text-white"
            >
              <RxQuestionMarkCircled className="text-base" />
              FAQ
            </button>

            <span className="h-4 w-px bg-white/25" />

            {user ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setOpenUserMenu((value) => !value)}
                  className="inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
                >
                  <HiMiniUserCircle className="text-2xl" />

                  <span className="max-w-32 truncate font-semibold">
                    {user?.fullname?.split(" ")[0] || "User"}
                  </span>

                  <MdKeyboardArrowDown
                    className={`text-base transition ${
                      openUserMenu ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {openUserMenu && (
                  <div className="absolute right-0 z-50 mt-3 w-52 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 text-sm text-slate-700 shadow-xl">
                    <button
                      onClick={() => {
                        navigate("/account");
                        setOpenUserMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left font-medium transition hover:bg-slate-50"
                    >
                      My Account
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/signin")}
                  className="transition hover:text-white"
                >
                  Sign In
                </button>

                <button
                  onClick={() => navigate("/signup")}
                  className="rounded-full bg-white px-4 py-1.5 font-bold text-orange-500 transition hover:bg-orange-50"
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
            className="flex shrink-0 items-center gap-1 text-xl font-black tracking-wide transition hover:opacity-90 md:text-2xl"
          >
            OSY
            <PiShoppingCartSimpleFill className="text-white" />
            SO
          </button>

          <form
            onSubmit={handleNavbarSearch}
            className="hidden flex-1 md:block"
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
                className="flex h-7 w-14 items-center justify-center rounded-full bg-orange-500 text-white transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300"
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
              onClick={() => navigate("/markets")}
            />

            <BadgeIconButton
              icon={IoMdNotificationsOutline}
              label="Notifications"
              count={3}
              onClick={() => navigate("/notification")}
            />

            {user && (
              <>
                <BadgeIconButton
                  icon={PiShoppingCartSimpleLight}
                  label="Cart"
                  count={2}
                  onClick={() => navigate("/cart")}
                />

                <BadgeIconButton
                  icon={GoChecklist}
                  label="Orders"
                  count={2}
                  onClick={() => navigate("/orders")}
                />
              </>
            )}
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="ml-auto rounded-full p-2 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 md:hidden"
            aria-label="Open menu"
          >
            <TbMenu2 className="text-2xl" />
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
