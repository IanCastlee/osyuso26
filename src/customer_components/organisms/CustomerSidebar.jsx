import React, { useState } from "react";
import { icons } from "../../constant/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useNotificationStore from "../../store/useNotificationStore";
import useCartStore from "../../store/useCartStore";
import useOrderStore from "../../store/useOrderStore";

function CustomerSidebar({ isOpen, onClose }) {
  const [openUserMenu, setOpenUserMenu] = useState(false);

  const {
    IoMdNotificationsOutline,
    CiShop,
    RxQuestionMarkCircled,
    IoIosInformationCircleOutline,
    PiShoppingCartSimpleFill,
    PiShoppingCartSimpleLight,
    RiHomeLine,
    GoChecklist,
    HiMiniUserCircle,
    MdKeyboardArrowDown,
    PiPhoneThin,
  } = icons;

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const clearUnread = useNotificationStore((state) => state.clearUnread);

  const cartCount = useCartStore((state) => state.cartCount);
  const clearCartCount = useCartStore((state) => state.clearCartCount);

  const orderCount = useOrderStore((state) => state.orderCount);
  const clearOrderCount = useOrderStore((state) => state.clearOrderCount);

  const go = (path) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    clearUnread();
    clearCartCount();
    clearOrderCount();
    logout();
    setOpenUserMenu(false);
    go("/signin");
  };

  const navItems = [
    { label: "Home", icon: RiHomeLine, path: "/" },
    { label: "Markets", icon: CiShop, path: "/all-markets" },
    {
      label: "Cart",
      icon: PiShoppingCartSimpleLight,
      path: "/cart",
      count: cartCount,
      authOnly: true,
    },
    {
      label: "Orders",
      icon: GoChecklist,
      path: "/orders",
      count: orderCount,
      authOnly: true,
    },
    {
      label: "Notifications",
      icon: IoMdNotificationsOutline,
      path: "/notification",
      count: unreadCount,
      authOnly: true,
    },
  ];

  const infoItems = [
    { label: "About", icon: IoIosInformationCircleOutline, path: "/about" },
    { label: "FAQ", icon: RxQuestionMarkCircled, path: "/faq" },
    { label: "Contact", icon: PiPhoneThin, path: "/contact" },
  ];

  const renderCount = (count) => {
    const value = Number(count || 0);
    if (value <= 0) return null;

    return value > 99 ? "99+" : value;
  };

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] transition-opacity duration-300 ${
          isOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      />

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-[280px] max-w-[85vw] flex-col bg-secondary text-white shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[70px] items-center justify-between border-b border-white/10 px-5">
          <button
            onClick={() => go("/")}
            className="flex items-center text-xl font-bold tracking-wide"
          >
            OSY <PiShoppingCartSimpleFill className="mx-1" /> SO
          </button>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10"
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          {user && (
            <div className="mb-4 rounded-xl bg-white/10 p-3">
              <div className="flex items-center gap-3">
                <HiMiniUserCircle className="text-4xl text-white/90" />

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {user?.fullname || "User"}
                  </p>
                  <p className="text-xs text-white/60">Customer account</p>
                </div>
              </div>
            </div>
          )}

          <nav className="space-y-1">
            {navItems
              .filter((item) => !item.authOnly || user)
              .map((item) => {
                const Icon = item.icon;
                const countLabel = renderCount(item.count);

                return (
                  <button
                    key={item.path}
                    onClick={() => go(item.path)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Icon className="shrink-0 text-xl" />
                      <span className="truncate">{item.label}</span>
                    </span>

                    {countLabel && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold leading-none text-white">
                        {countLabel}
                      </span>
                    )}
                  </button>
                );
              })}
          </nav>

          <div className="my-4 border-t border-white/10" />

          <nav className="space-y-1">
            {infoItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.path}
                  onClick={() =>
                    window.open(item.path, "_blank", "noopener,noreferrer")
                  }
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
                >
                  <Icon className="text-xl" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="my-4 border-t border-white/10" />

          <button
            onClick={() => go("/signup-seller")}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
          >
            <CiShop className="text-xl" />
            Start Selling
          </button>
        </div>

        <div className="border-t border-white/10 p-3">
          {user ? (
            <div>
              <button
                onClick={() => setOpenUserMenu(!openUserMenu)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-white/10"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <HiMiniUserCircle className="shrink-0 text-2xl" />
                  <span className="truncate">
                    {user?.fullname?.split(" ")[0] || "User"}
                  </span>
                </span>

                <MdKeyboardArrowDown
                  className={`shrink-0 transition ${
                    openUserMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openUserMenu && (
                <div className="mt-2 space-y-1">
                  <button
                    onClick={() => {
                      go("/account");
                      setOpenUserMenu(false);
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-white/85 hover:bg-white/10"
                  >
                    My Account
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-white/85 hover:bg-white/10"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-2">
              <button
                onClick={() => go("/signin")}
                className="rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Sign In
              </button>

              <button
                onClick={() => go("/signup")}
                className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-secondary transition hover:bg-gray-100"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default CustomerSidebar;
