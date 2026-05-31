import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaBox,
  FaCog,
  FaClipboardList,
  FaChevronDown,
  FaChevronRight,
  FaChartLine,
  FaTags,
  FaMoneyBillWave,
} from "react-icons/fa";
import { PiShoppingCartSimpleFill } from "react-icons/pi";

function SidebarVendor() {
  const navigate = useNavigate();

  const [expanded, setExpanded] = useState(false);
  const [openReservation, setOpenReservation] = useState(false);
  const [openProducts, setOpenProducts] = useState(false);
  const [openPromotion, setOpenPromotion] = useState(false);
  const [openPayout, setOpenPayout] = useState(false);

  const itemClass = ({ isActive }) =>
    `group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
      isActive
        ? "bg-white text-secondary shadow-sm"
        : "text-white/85 hover:bg-white/10 hover:text-white"
    }`;

  const subItemClass = ({ isActive }) =>
    `block rounded-lg px-3 py-2 text-sm transition ${
      isActive
        ? "bg-white/15 font-semibold text-white"
        : "text-white/70 hover:bg-white/10 hover:text-white"
    }`;

  const labelClass = `truncate transition-all duration-200 ${
    expanded ? "max-w-48 opacity-100" : "max-w-0 overflow-hidden opacity-0"
  }`;

  const chevronClass = `shrink-0 text-xs text-white/60 transition ${
    expanded ? "opacity-100" : "opacity-0"
  }`;

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onFocus={() => setExpanded(true)}
      className={`flex h-screen cursor-pointer shrink-0 flex-col overflow-hidden bg-secondary text-white transition-all duration-300 ${
        expanded ? "w-[270px]" : "w-[76px]"
      }`}
    >
      <div className="border-b border-white/10 px-3 py-5">
        <button
          onClick={() => navigate("/")}
          className={`flex w-full items-center font-bold tracking-wide transition ${
            expanded ? "justify-center text-2xl" : "justify-center text-xl"
          }`}
          title="OSYUSO"
        >
          {expanded && <span>OSY</span>}
          <PiShoppingCartSimpleFill className="mx-1 text-3xl" />
          {expanded && <span>SO</span>}
        </button>

        <div
          className={`mt-3 overflow-hidden rounded-xl bg-white/10 text-center transition-all duration-300 ${
            expanded
              ? "max-h-24 px-3 py-2 opacity-100"
              : "max-h-0 px-0 py-0 opacity-0"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
            Vendor Panel
          </p>
          <p className="mt-0.5 text-sm font-medium text-white">
            Store Management
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <NavLink to="/vendor" end className={itemClass} title="Dashboard">
          <FaChartLine className="shrink-0 text-lg" />
          <span className={labelClass}>Dashboard</span>
        </NavLink>

        <button
          onClick={() => {
            setExpanded(true);
            setOpenProducts((prev) => !prev);
          }}
          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
          title="Products"
        >
          <span className="flex min-w-0 items-center gap-3">
            <FaBox className="shrink-0 text-lg" />
            <span className={labelClass}>Products</span>
          </span>

          {openProducts ? (
            <FaChevronDown className={chevronClass} />
          ) : (
            <FaChevronRight className={chevronClass} />
          )}
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ${
            expanded && openProducts ? "max-h-28 pb-1 pl-8" : "max-h-0"
          }`}
        >
          <div className="space-y-1 border-l border-white/10 pl-3">
            <NavLink to="/vendor/vendor-products" className={subItemClass}>
              Products
            </NavLink>
            <NavLink to="/vendor/archive-products" className={subItemClass}>
              Archive Products
            </NavLink>
          </div>
        </div>

        <button
          onClick={() => {
            setExpanded(true);
            setOpenReservation((prev) => !prev);
          }}
          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
          title="Reservation"
        >
          <span className="flex min-w-0 items-center gap-3">
            <FaClipboardList className="shrink-0 text-lg" />
            <span className={labelClass}>Orders</span>
          </span>

          {openReservation ? (
            <FaChevronDown className={chevronClass} />
          ) : (
            <FaChevronRight className={chevronClass} />
          )}
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ${
            expanded && openReservation ? "max-h-28 pb-1 pl-8" : "max-h-0"
          }`}
        >
          <div className="space-y-1 border-l border-white/10 pl-3">
            <NavLink to="/vendor/reserved" className={subItemClass}>
              Orders
            </NavLink>
            <NavLink to="/vendor/pending" className={subItemClass}>
              Pending
            </NavLink>
            <NavLink to="/vendor/reservation-log" className={subItemClass}>
              Order History
            </NavLink>
          </div>
        </div>

        <button
          onClick={() => {
            setExpanded(true);
            setOpenPromotion((prev) => !prev);
          }}
          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
          title="Featured Promotion"
        >
          <span className="flex min-w-0 items-center gap-3">
            <FaTags className="shrink-0 text-lg" />
            <span className={labelClass}>Featured Promotion</span>
          </span>

          {openPromotion ? (
            <FaChevronDown className={chevronClass} />
          ) : (
            <FaChevronRight className={chevronClass} />
          )}
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ${
            expanded && openPromotion ? "max-h-28 pb-1 pl-8" : "max-h-0"
          }`}
        >
          <div className="space-y-1 border-l border-white/10 pl-3">
            <NavLink to="/vendor/featured-promotion" className={subItemClass}>
              Manage Promotions
            </NavLink>

            <NavLink
              to="/vendor/featured-promotion-logs"
              className={subItemClass}
            >
              Promotion Logs
            </NavLink>
          </div>
        </div>

        <button
          onClick={() => {
            setExpanded(true);
            setOpenPayout((prev) => !prev);
          }}
          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
          title="Payout"
        >
          <span className="flex min-w-0 items-center gap-3">
            <FaMoneyBillWave className="shrink-0 text-lg" />
            <span className={labelClass}>Payout</span>
          </span>

          {openPayout ? (
            <FaChevronDown className={chevronClass} />
          ) : (
            <FaChevronRight className={chevronClass} />
          )}
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ${
            expanded && openPayout ? "max-h-24 pb-1 pl-8" : "max-h-0"
          }`}
        >
          <div className="space-y-1 border-l border-white/10 pl-3">
            <NavLink to="/vendor/vendor-payout" className={subItemClass}>
              Payout
            </NavLink>
            {/* <NavLink to="/vendor/payout-history" className={subItemClass}>
              Payout History
            </NavLink> */}
          </div>
        </div>

        <NavLink
          to="/vendor/market-settings"
          className={itemClass}
          title="Market Settings"
        >
          <FaCog className="shrink-0 text-lg" />
          <span className={labelClass}>Market Settings</span>
        </NavLink>
      </nav>

      <div className="border-t border-white/10 p-3">
        <div
          className={`overflow-hidden rounded-xl bg-white/10 text-center transition-all duration-300 ${
            expanded
              ? "max-h-24 px-3 py-3 opacity-100"
              : "max-h-0 px-0 py-0 opacity-0"
          }`}
        >
          <p className="text-xs text-white/60">Signed in as</p>
          <p className="mt-0.5 text-sm font-semibold text-white">Vendor</p>
        </div>

        <p
          className={`mt-3 text-center text-xs text-white/50 transition ${
            expanded ? "opacity-100" : "opacity-0"
          }`}
        >
          © OSYUSO Vendor
        </p>
      </div>
    </aside>
  );
}

export default SidebarVendor;
