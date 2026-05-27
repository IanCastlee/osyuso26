import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaBox,
  FaClipboardList,
  FaChevronDown,
  FaChevronRight,
  FaCog,
  FaChartLine,
  FaMoneyBillWave,
  FaStore,
  FaTags,
  FaUsers,
  FaBookOpen,
} from "react-icons/fa";
import { PiShoppingCartSimpleFill } from "react-icons/pi";

function SidebarAdmin() {
  const navigate = useNavigate();

  const [expanded, setExpanded] = useState(false);
  const [openUsers, setOpenUsers] = useState(false);
  const [openProducts, setOpenProducts] = useState(false);
  const [openOrders, setOpenOrders] = useState(false);
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
      className={`flex h-screen shrink-0 flex-col overflow-hidden bg-secondary text-white transition-all duration-300 ${
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
            Admin Panel
          </p>
          <p className="mt-0.5 text-sm font-medium text-white">
            System Management
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <NavLink to="/admin" end className={itemClass} title="Dashboard">
          <FaChartLine className="shrink-0 text-lg" />
          <span className={labelClass}>Dashboard</span>
        </NavLink>

        <button
          onClick={() => {
            setExpanded(true);
            setOpenUsers((prev) => !prev);
          }}
          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
          title="Users"
        >
          <span className="flex min-w-0 items-center gap-3">
            <FaUsers className="shrink-0 text-lg" />
            <span className={labelClass}>Users</span>
          </span>

          {openUsers ? (
            <FaChevronDown className={chevronClass} />
          ) : (
            <FaChevronRight className={chevronClass} />
          )}
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ${
            expanded && openUsers ? "max-h-36 pb-1 pl-8" : "max-h-0"
          }`}
        >
          <div className="space-y-1 border-l border-white/10 pl-3">
            <NavLink to="/admin/vendors" className={subItemClass}>
              Vendors
            </NavLink>
            <NavLink to="/admin/registered-customers" className={subItemClass}>
              Reg Customers
            </NavLink>
            <NavLink
              to="/admin/unregistered-customers"
              className={subItemClass}
            >
              Unreg Customers
            </NavLink>
          </div>
        </div>

        <button
          onClick={() => {
            setExpanded(true);
            setOpenOrders((prev) => !prev);
          }}
          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
          title="Orders"
        >
          <span className="flex min-w-0 items-center gap-3">
            <FaClipboardList className="shrink-0 text-lg" />
            <span className={labelClass}>Orders</span>
          </span>

          {openOrders ? (
            <FaChevronDown className={chevronClass} />
          ) : (
            <FaChevronRight className={chevronClass} />
          )}
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ${
            expanded && openOrders ? "max-h-36 pb-1 pl-8" : "max-h-0"
          }`}
        >
          <div className="space-y-1 border-l border-white/10 pl-3">
            <NavLink to="/admin/orders" className={subItemClass}>
              Orders
            </NavLink>
            <NavLink to="/admin/reservations" className={subItemClass}>
              Reservations
            </NavLink>
            <NavLink to="/admin/order-history" className={subItemClass}>
              Order History
            </NavLink>
          </div>
        </div>

        <button
          onClick={() => {
            setExpanded(true);
            setOpenPayout((prev) => !prev);
          }}
          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
          title="Vendor Payouts"
        >
          <span className="flex min-w-0 items-center gap-3">
            <FaMoneyBillWave className="shrink-0 text-lg" />
            <span className={labelClass}>Vendor Payouts</span>
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
            <NavLink to="/admin/payout-request" className={subItemClass}>
              Requests
            </NavLink>
            <NavLink to="/admin/payout-history" className={subItemClass}>
              History
            </NavLink>
          </div>
        </div>

        {/* <button
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
            <NavLink to="/admin/products" className={subItemClass}>
              Products
            </NavLink>
            <NavLink to="/admin/archive-products" className={subItemClass}>
              Archive Products
            </NavLink>
          </div>
        </div> */}

        <NavLink to="/admin/products" className={itemClass} title="Products">
          <FaBox className="shrink-0 text-[20px]" />
          <span className={labelClass}>Products</span>
        </NavLink>

        <NavLink
          to="/admin/promotions"
          className={itemClass}
          title="Admin Settings"
        >
          <FaTags className="shrink-0 text-lg" />
          <span className={labelClass}>Promotions</span>
        </NavLink>

        <NavLink
          to="/admin/legal-pages"
          className={itemClass}
          title="Admin Settings"
        >
          <FaBookOpen className="shrink-0 text-lg" />
          <span className={labelClass}>Legal Pages</span>
        </NavLink>

        <NavLink
          to="/admin/admin-settings"
          className={itemClass}
          title="Admin Settings"
        >
          <FaCog className="shrink-0 text-lg" />
          <span className={labelClass}>Admin Settings</span>
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
          <p className="mt-0.5 text-sm font-semibold text-white">Admin</p>
        </div>

        <p
          className={`mt-3 text-center text-xs text-white/50 transition ${
            expanded ? "opacity-100" : "opacity-0"
          }`}
        >
          © OSYUSO Admin
        </p>
      </div>
    </aside>
  );
}

export default SidebarAdmin;
